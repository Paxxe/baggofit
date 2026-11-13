import { cacheLife, cacheTag } from "next/cache";
import { capacityFromDimensions, capacityFromText, dimensionsFromSpecs, extractCategories, extractDimensionsCm, extractLaptop, litersIn, looksLikeBackpack, looksLikeLuggage, stripHtml, weightFromSpecs, type CatalogBackpack, type CatalogOption } from "./extract";
import { matchBackpacks } from "./match";
import type { BackpackCategory, BackpackProduct, BackpackSearchCriteria, ProductKind, ProductRecommendationProvider } from "./provider";
import { directStorefronts, type DirectStorefront } from "./storefronts";
import { getCatalogToken, hasCatalogCredentials } from "./shopify-auth";

/**
 * Shopify Global Catalog (UCP over MCP): official cross-merchant product search.
 * Docs: https://shopify.dev/docs/agents/catalog/global-catalog
 *
 * Every request carries the URL of our agent profile (registered in the Shopify Dev Dashboard).
 * Set SHOPIFY_UCP_AGENT_PROFILE in production; in development Shopify's documented example profile is used.
 */
const CATALOG_ENDPOINT = "https://catalog.shopify.com/api/ucp/mcp";
const EXAMPLE_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";
const PAGE_LIMIT = 50; // max allowed by search_catalog
const MAX_CATALOG_PAGES = 2; // up to 100 candidates per query (×4 queries): each extra page is another ~0.5 s round trip
const TIMEOUT_MS = 12_000;

export interface CatalogMarket {
  /** ISO 3166-1 alpha-2; also used to keep only products that ship there */
  country?: string;
  currency: string;
  language: string;
}

/* ------------------------------------------------------------------ UCP response types (subset) */

interface Money {
  amount: number;
  currency: string;
}
interface UcpMedia {
  type: string;
  url: string;
}
interface UcpVariant {
  id: string;
  title?: string;
  url?: string;
  price?: Money;
  availability?: { available?: boolean };
  options?: { name: string; label: string }[];
  media?: UcpMedia[];
  seller?: { name?: string; url?: string };
}
export interface UcpProduct {
  id: string;
  title: string;
  /** Product page (per-store catalog responses put it here). */
  url?: string;
  description?: { plain?: string; html?: string } | string;
  media?: UcpMedia[];
  options?: { name: string; values: { label: string }[] }[];
  variants?: UcpVariant[];
  price_range?: { min: Money; max: Money };
  rating?: { value: number; count: number };
  metadata?: { tech_specs?: string[]; top_features?: string[]; unique_selling_points?: string[] };
}
interface SearchResult {
  products?: UcpProduct[];
  pagination?: { cursor?: string; has_next_page?: boolean };
  messages?: { type?: string; code?: string; content?: string }[];
}

/* ------------------------------------------------------------------ normalization */

const descriptionText = (description: UcpProduct["description"]) =>
  typeof description === "string" ? stripHtml(description) : stripHtml(description?.plain ?? description?.html);

const isShopifyImage = (url?: string) => !!url && url.startsWith("https://cdn.shopify.com/s/files/");

/** Turns a catalog product into a matchable record, or null when it isn't a measurable bag of the wanted kind. */
/** `store` fills in brand/URL for per-store catalog results, which carry no seller. */
export function normalizeUcpProduct(product: UcpProduct, kind: ProductKind = "backpack", store?: { brand: string; url: string }): CatalogBackpack | null {
  const description = descriptionText(product.description);
  const luggage = kind !== "backpack";
  if (!(luggage ? looksLikeLuggage(product.title, description) : looksLikeBackpack(product.title, description))) return null;

  const variants = (product.variants ?? []).filter((variant) => variant.availability?.available !== false && variant.price);
  if (!variants.length) return null;

  const specs = product.metadata?.tech_specs ?? [];
  const features = [...(product.metadata?.top_features ?? []), ...(product.metadata?.unique_selling_points ?? [])];
  const titleLiters = litersIn(product.title);
  const dimensionsCm = dimensionsFromSpecs(specs) ?? extractDimensionsCm(description);
  const statedCapacity =
    (titleLiters.length === 1 ? titleLiters[0] : undefined) ??
    capacityFromText(specs.join(". ")) ??
    capacityFromText(features.join(". ")) ??
    capacityFromText(description);
  // Many listings state only the outer size: estimate the capacity from it, and say so in the UI.
  const estimatedCapacity = statedCapacity === undefined && dimensionsCm ? capacityFromDimensions(dimensionsCm, luggage ? "luggage" : "backpack") : undefined;
  const fallbackCapacity = statedCapacity ?? estimatedCapacity;

  // Capacity per variant ("30 liters / 1830 cu. in."), else the product-level capacity.
  const options: CatalogOption[] = [];
  for (const variant of variants) {
    const variantLiters = litersIn([variant.title ?? "", ...(variant.options ?? []).map((option) => option.label)].join(" "));
    const capacity = variantLiters.length === 1 ? variantLiters[0] : fallbackCapacity;
    if (capacity === undefined) continue;
    const price = (variant.price?.amount ?? 0) / 100;
    const existing = options.find((option) => option.capacityLiters === capacity);
    if (!existing) options.push({ capacityLiters: capacity, variantId: variant.id, price });
    else if (price < existing.price) Object.assign(existing, { price, variantId: variant.id });
  }
  if (!options.length) return null;

  const text = [product.title, ...features, ...specs, description].join(". ");
  const { laptop, laptopInches } = extractLaptop(text);
  const firstVariant = variants[0];
  const image = [...(firstVariant.media ?? []), ...(product.media ?? [])].find((media) => media.type === "image" && isShopifyImage(media.url));

  return {
    id: product.id,
    title: product.title.trim(),
    brand: store?.brand ?? (firstVariant.seller?.name?.trim() || "Shopify"),
    url: firstVariant.url ?? product.url ?? firstVariant.seller?.url ?? store?.url ?? "",
    imageUrl: image?.url,
    currency: firstVariant.price?.currency ?? product.price_range?.min.currency,
    options: options.sort((a, b) => a.capacityLiters - b.capacityLiters),
    laptop,
    laptopInches,
    dimensionsCm,
    categories: extractCategories(`${product.title} ${features.join(" ")}`),
    rating: product.rating?.count ? { value: product.rating.value, count: product.rating.count } : undefined,
    emptyWeightKg: luggage ? weightFromSpecs(specs) : undefined,
    capacityEstimated: estimatedCapacity !== undefined && options.every((option) => option.capacityLiters === estimatedCapacity) ? true : undefined,
  };
}

/* ------------------------------------------------------------------ transport */

/** False in production when neither agent credentials nor a profile are set: catalog calls would fail. */
export function catalogConfigured() {
  return process.env.NODE_ENV !== "production" || !!process.env.SHOPIFY_UCP_AGENT_PROFILE || hasCatalogCredentials();
}

function agentProfile() {
  const configured = process.env.SHOPIFY_UCP_AGENT_PROFILE;
  if (configured) return configured;
  // Authenticated agents can use Shopify's hosted profile (see the Dev Dashboard "search catalog" guide).
  if (!catalogConfigured()) {
    throw new Error("Set SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET (Dev Dashboard agent) or SHOPIFY_UCP_AGENT_PROFILE.");
  }
  return EXAMPLE_PROFILE;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Global Catalog rate limit: 5 requests per second per agent. Requests start as soon as a slot is
 * free in the last second (per server instance), so searches can run in parallel without 429s.
 */
const RATE_LIMIT = 5;
const recentStarts: number[] = [];
async function catalogSlot() {
  for (;;) {
    const now = Date.now();
    while (recentStarts.length && now - recentStarts[0] >= 1000) recentStarts.shift();
    if (recentStarts.length < RATE_LIMIT) {
      recentStarts.push(now);
      return;
    }
    await sleep(1000 - (now - recentStarts[0]) + 5);
  }
}

async function callCatalog<T>(tool: string, catalog: Record<string, unknown>, endpoint = CATALOG_ENDPOINT): Promise<T> {
  // The agent token is only ever sent to Shopify's Global Catalog, never to individual stores.
  const token = endpoint === CATALOG_ENDPOINT ? await getCatalogToken() : null;
  const send = async () => {
    if (endpoint === CATALOG_ENDPOINT) await catalogSlot();
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: tool, arguments: { meta: { "ucp-agent": { profile: agentProfile() } }, catalog } } }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  };
  let response = await send();
  // Rate limited: wait once (Retry-After if given, capped) and try again.
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 4) * 1000 : 1500);
    response = await send();
  }
  if (!response.ok) throw new Error(`Shopify Catalog → HTTP ${response.status}`);
  const payload = (await response.json()) as {
    error?: { message?: string };
    result?: { isError?: boolean; structuredContent?: T; content?: { type: string; text: string }[] };
  };
  if (payload.error) throw new Error(`Shopify Catalog → ${payload.error.message ?? "error"}`);
  const result = payload.result;
  if (!result) throw new Error("Shopify Catalog → empty response");
  if (result.isError) throw new Error(`Shopify Catalog → ${result.content?.[0]?.text ?? "tool error"}`);
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("Shopify Catalog → no content");
  return JSON.parse(text) as T;
}

/**
 * One catalog search, normalized and cached for a few hours.
 * The arguments form the cache key; the queries are coarse (capacity bucket + type), so entries are shared.
 */
/**
 * Saved catalog (Shopify Dev Dashboard) per product kind: its filters (categories, condition, media…)
 * bound every search, on top of the per-request market and query. Optional: unset = whole catalog.
 */
export function savedCatalogId(kind: ProductKind) {
  const specific = kind === "backpack" ? process.env.SHOPIFY_CATALOG_ID_BACKPACKS : process.env.SHOPIFY_CATALOG_ID_LUGGAGE;
  return specific?.trim() || process.env.SHOPIFY_CATALOG_ID?.trim() || undefined;
}

export async function searchCatalogBackpacks(query: string, market: CatalogMarket, kind: ProductKind = "backpack"): Promise<CatalogBackpack[]> {
  // Remote: shared by every server instance (in-memory "use cache" is per instance on Vercel,
  // so repeat searches still went to Shopify). Queries are bucketed, so visitors share entries.
  "use cache: remote";
  cacheTag("shopify-catalog");

  const products: UcpProduct[] = [];
  let cursor: string | undefined;
  let partial = false;
  for (let page = 0; page < MAX_CATALOG_PAGES; page += 1) {
    const catalogId = savedCatalogId(kind);
    const request = callCatalog<SearchResult>("search_catalog", {
      query,
      ...(catalogId ? { catalog_id: catalogId } : {}),
      context: { ...(market.country ? { address_country: market.country } : {}), currency: market.currency, language: market.language, intent: "Find a backpack with the right capacity for the buyer's trip or daily use." },
      filters: { available: true, ...(market.country ? { ships_to: { country: market.country } } : {}) },
      pagination: { limit: PAGE_LIMIT, ...(cursor ? { cursor } : {}) },
    });
    // The first page must succeed (errors aren't cached); later pages are a bonus.
    const result = page === 0 ? await request : await request.catch(() => null);
    if (!result) {
      partial = true;
      break;
    }
    products.push(...(result.products ?? []));
    cursor = result.pagination?.cursor;
    if (!result.pagination?.has_next_page || !cursor) break;
  }
  // A partial result is only kept briefly, so the full list is fetched again soon.
  if (partial) cacheLife("minutes");
  else cacheLife("hours");
  return products.map((product) => normalizeUcpProduct(product, kind)).filter((entry): entry is CatalogBackpack => entry !== null);
}

/**
 * One search in a brand's own store (Storefront Catalog MCP), for official stores missing from the
 * global catalog. A single page is enough: these catalogs are small and focused.
 */
export async function searchStorefrontBackpacks(store: DirectStorefront, query: string, market: CatalogMarket, kind: ProductKind = "backpack"): Promise<CatalogBackpack[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("shopify-catalog", `storefront:${store.url}`);
  const result = await callCatalog<SearchResult>(
    "search_catalog",
    {
      query,
      context: { ...(market.country ? { address_country: market.country } : {}), currency: market.currency, language: market.language },
      pagination: { limit: PAGE_LIMIT },
    },
    `${store.url.replace(/\/$/, "")}/api/ucp/mcp`,
  );
  return (result.products ?? []).map((product) => normalizeUcpProduct(product, kind, { brand: store.brand, url: store.url })).filter((entry): entry is CatalogBackpack => entry !== null);
}

/** Identity of a product across catalogs: its page without query string (falls back to the catalog id). */
export function productKey(entry: Pick<CatalogBackpack, "id" | "url">) {
  try {
    const url = new URL(entry.url);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/^\/[a-z]{2}(-[a-z]{2})?(?=\/products\/)/i, "").replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return entry.id;
  }
}

/** Runs async tasks with a small concurrency limit (keeps bursts under the catalog's rate limit). */
async function settleWithLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const index = next++;
      try {
        results[index] = { status: "fulfilled", value: await tasks[index]() };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/* ------------------------------------------------------------------ provider */

const typeQuery: Record<BackpackCategory, string> = {
  everyday: "everyday backpack",
  travel: "travel backpack carry-on",
  laptop: "laptop backpack",
  hiking: "hiking daypack",
};

/** Suitcase size words shoppers (and merchants) actually use. */
function suitcaseSize(liters: number) {
  if (liters <= 45) return { en: "cabin size 55 cm", it: "cabina 55 cm" };
  if (liters <= 80) return { en: "medium 65 cm", it: "media 65 cm" };
  if (liters <= 110) return { en: "large 75 cm", it: "grande 75 cm" };
  return { en: "extra large 80 cm", it: "extra large 80 cm" };
}

const italianType: Record<BackpackCategory, string> = {
  everyday: "zaino da città",
  travel: "zaino da viaggio",
  laptop: "zaino porta pc",
  hiking: "zaino da trekking",
};

/**
 * Search phrases for a set of criteria. Several angles widen the candidate pool: a specific query,
 * a capacity-only query, a broad type query and an Italian one (which surfaces Italian shops).
 * Capacity is bucketed to 5 L so cache entries are shared between visitors.
 */
export function buildQueries(criteria: BackpackSearchCriteria) {
  const { min, max } = criteria.capacityRangeLiters;
  const target = Math.round((min + max) / 10) * 5;
  // A brand or model typed by the visitor gets its own targeted searches.
  const text = criteria.text?.trim();
  if (text) {
    const noun = criteria.productKind === "cabin-trolley" ? "cabin trolley" : criteria.productKind === "checked-suitcase" ? "suitcase" : "backpack";
    return [...new Set([`${text} ${noun}`, `${text} ${noun} ${target}L`])];
  }
  const light = criteria.lightweight ? " lightweight" : "";
  if (criteria.productKind === "cabin-trolley") {
    const limit = criteria.dimensionsCm;
    const size = limit?.height && limit.width && limit.depth ? `${limit.height}x${limit.width}x${limit.depth}` : "55x40x20";
    return [...new Set([`cabin trolley ${size}${light}`, `carry-on suitcase ${target}L${light}`, `hand luggage spinner suitcase${light}`, `trolley bagaglio a mano ${size}`])];
  }
  if (criteria.productKind === "checked-suitcase") {
    const size = suitcaseSize(target);
    return [...new Set([`${size.en} checked suitcase${light}`, `${target}L suitcase spinner${light}`, `hard shell luggage ${size.en}`, `valigia ${size.it}`])];
  }
  const kind = criteria.backpackType ? typeQuery[criteria.backpackType] : "backpack";
  const laptop = criteria.laptopRequired ? ` with laptop compartment${criteria.laptopInches ? ` ${criteria.laptopInches} inch` : ""}` : "";
  const italian = criteria.backpackType ? italianType[criteria.backpackType] : "zaino";
  return [...new Set([`${kind} ${target}L${laptop}`, `${target} liter backpack`, `${target}L rucksack${criteria.laptopRequired ? " laptop" : ""}`, `${italian} ${target} litri`])];
}

export class ShopifyGlobalCatalogProvider implements ProductRecommendationProvider {
  private readonly market: CatalogMarket;

  constructor(market: CatalogMarket) {
    this.market = market;
  }

  async searchBackpacks(criteria: BackpackSearchCriteria): Promise<BackpackProduct[]> {
    const queries = buildQueries(criteria);
    const kind = criteria.productKind ?? "backpack";
    // Official stores outside the global catalog: one query each, for markets they sell to.
    const stores = directStorefronts.filter((store) => store.kinds.includes(kind) && (!this.market.country || store.countries.includes(this.market.country)));
    const results = await settleWithLimit(
      [
        ...queries.map((query) => () => searchCatalogBackpacks(query, this.market, kind)),
        ...stores.map((store) => () => searchStorefrontBackpacks(store, queries[0], this.market, kind)),
      ],
      // Catalog calls are paced by catalogSlot(); store calls have their own limits.
      6,
    );
    const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failures.length === results.length) throw failures[0].reason;
    failures.forEach((failure) => console.warn("[shopify-catalog]", failure.reason instanceof Error ? failure.reason.message : failure.reason));

    // The same product can come from the global catalog and from the store's own catalog:
    // keep one per product page (host + path, without variant/tracking parameters).
    const byId = new Map<string, CatalogBackpack>();
    for (const result of results) {
      if (result.status === "fulfilled") for (const entry of result.value) {
        const key = productKey(entry);
        if (!byId.has(key)) byId.set(key, entry);
      }
    }
    return matchBackpacks([...byId.values()], { preferredCurrency: this.market.currency, ...criteria });
  }
}
