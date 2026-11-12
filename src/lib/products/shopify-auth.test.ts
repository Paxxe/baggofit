import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogToken, hasCatalogCredentials, resetCatalogToken } from "./shopify-auth";

const jwt = (exp: number) => `x.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.y`;

describe("Shopify catalog auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetCatalogToken();
  });

  it("returns null without credentials (anonymous catalog calls)", async () => {
    vi.stubEnv("SHOPIFY_CLIENT_ID", "");
    vi.stubEnv("SHOPIFY_CLIENT_SECRET", "");
    expect(hasCatalogCredentials()).toBe(false);
    expect(await getCatalogToken()).toBeNull();
  });

  it("exchanges client credentials once and reuses the token until it nears expiry", async () => {
    vi.stubEnv("SHOPIFY_CLIENT_ID", "id");
    vi.stubEnv("SHOPIFY_CLIENT_SECRET", "secret");
    const token = jwt(Math.floor(Date.now() / 1000) + 3600);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ access_token: token })));
    vi.stubGlobal("fetch", fetchMock);
    const [first, second] = await Promise.all([getCatalogToken(), getCatalogToken()]);
    expect(first).toBe(token);
    expect(second).toBe(token);
    expect(await getCatalogToken()).toBe(token);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ client_id: "id", client_secret: "secret", grant_type: "client_credentials" });
  });

  it("refreshes a token that is about to expire", async () => {
    vi.stubEnv("SHOPIFY_CLIENT_ID", "id");
    vi.stubEnv("SHOPIFY_CLIENT_SECRET", "secret");
    const soon = jwt(Math.floor(Date.now() / 1000) + 60);
    const fresh = jwt(Math.floor(Date.now() / 1000) + 3600);
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: soon }))).mockResolvedValueOnce(new Response(JSON.stringify({ access_token: fresh })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getCatalogToken()).toBe(soon);
    expect(await getCatalogToken()).toBe(fresh);
  });
});
