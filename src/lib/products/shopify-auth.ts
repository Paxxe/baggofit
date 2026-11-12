/**
 * Agent authentication for Shopify's Global Catalog (client credentials → 60-minute bearer token).
 * Docs: https://shopify.dev/docs/agents/get-started/authentication
 *
 * Server-only: reads SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET. The token is kept in memory and
 * refreshed shortly before it expires. Without credentials the catalog is called anonymously.
 */
const TOKEN_ENDPOINT = "https://api.shopify.com/auth/access_token";
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const FALLBACK_LIFETIME_MS = 55 * 60 * 1000;

let cached: { token: string; expiresAt: number } | null = null;
let pending: Promise<string> | null = null;

export function hasCatalogCredentials() {
  return Boolean(process.env.SHOPIFY_CLIENT_ID?.trim() && process.env.SHOPIFY_CLIENT_SECRET?.trim());
}

/** Expiry from the token's JWT payload ("exp", seconds), or a safe default. */
function expiryOf(token: string) {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as { exp?: number };
    if (json.exp) return json.exp * 1000;
  } catch {
    // opaque token
  }
  return Date.now() + FALLBACK_LIFETIME_MS;
}

/** Bearer token for catalog.shopify.com, or null when no credentials are configured. */
export async function getCatalogToken(): Promise<string | null> {
  if (!hasCatalogCredentials()) return null;
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cached.token;
  // One refresh at a time, even with concurrent searches.
  pending ??= (async () => {
    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: process.env.SHOPIFY_CLIENT_ID!.trim(), client_secret: process.env.SHOPIFY_CLIENT_SECRET!.trim(), grant_type: "client_credentials" }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Shopify auth → HTTP ${response.status}`);
      const { access_token: token } = (await response.json()) as { access_token?: string };
      if (!token) throw new Error("Shopify auth → no access_token");
      cached = { token, expiresAt: expiryOf(token) };
      return token;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

/** Test helper. */
export function resetCatalogToken() {
  cached = null;
  pending = null;
}
