import { z } from "zod";
import { marketCurrencies, resolveCountry } from "@/lib/products/markets";
import { localizePrices, ratesOrNull } from "@/lib/products/exchange";
import { productFacets, refineProducts } from "@/lib/products/refine";
import { ShopifyGlobalCatalogProvider } from "@/lib/products/shopify-catalog";

const dimension = z.number().positive().max(200).optional();

const requestSchema = z.object({
  locale: z.enum(["it", "en"]).default("it"),
  /** Country chosen in the UI; when missing it's detected from the request. */
  country: z.string().length(2).optional(),
  capacityRangeLiters: z.object({ min: z.number().min(1).max(160), max: z.number().min(1).max(160) }).refine((range) => range.min <= range.max),
  backpackType: z.enum(["everyday", "travel", "laptop", "hiking"]).optional(),
  productKind: z.enum(["backpack", "cabin-trolley", "checked-suitcase"]).optional(),
  text: z.string().trim().max(60).optional(),
  lightweight: z.boolean().optional(),
  laptopRequired: z.boolean().optional(),
  laptopInches: z.number().min(10).max(19).optional(),
  dimensionsCm: z.object({ height: dimension, width: dimension, depth: dimension }).optional(),
  page: z.number().int().min(1).max(50).default(1),
  pageSize: z.number().int().min(3).max(24).default(6),
  /** Visitor's filters on top of the ranking. */
  filters: z
    .object({
      priceMin: z.number().min(0).optional(),
      priceMax: z.number().min(0).optional(),
      brand: z.string().max(120).optional(),
      fitsOnly: z.boolean().optional(),
      sort: z.enum(["relevance", "price-asc", "price-desc", "rating"]).optional(),
    })
    .default({}),
});

/** Upper bound on ranked results across all pages. */
const MAX_RESULTS = 200;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid search criteria" }, { status: 400 });

  const { locale, country: selected, page, pageSize, filters, ...criteria } = parsed.data;
  // Only products that ship to the visitor's country, priced in its currency.
  const { country, source } = resolveCountry(request.headers, selected);
  const market = { country, currency: marketCurrencies[country], language: locale };

  try {
    // Rank everything once (the catalog calls are cached), then hand out one page.
    const [found, rates] = await Promise.all([new ShopifyGlobalCatalogProvider(market).searchBackpacks({ ...criteria, limit: MAX_RESULTS }), ratesOrNull()]);
    // Prices in the visitor's currency (converted at ECB rates when a store only lists another one).
    const ranked = localizePrices(found, market.currency, rates);
    const refined = refineProducts(ranked, filters);
    const pageCount = Math.max(1, Math.ceil(refined.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const products = refined.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return Response.json(
      {
        products,
        total: refined.length,
        unfilteredTotal: ranked.length,
        facets: productFacets(ranked),
        page: currentPage,
        pageCount,
        market: { country, currency: market.currency, source },
      },
      { headers: { "Cache-Control": "private, max-age=300", Vary: "Accept-Language" } },
    );
  } catch (error) {
    console.error("[api/backpacks]", error instanceof Error ? error.message : error);
    return Response.json({ error: "Product search unavailable", market: { country, currency: market.currency, source } }, { status: 502 });
  }
}
