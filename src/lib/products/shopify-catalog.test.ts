import { describe, expect, it } from "vitest";
import { buildQueries, normalizeUcpProduct, productKey, savedCatalogId, type UcpProduct } from "./shopify-catalog";
import { afterEach, vi } from "vitest";

// Trimmed from a real Global Catalog search_catalog response.
const travelHybrid: UcpProduct = {
  id: "gid://shopify/p/6D6UIS9nVCWem2qQULWiQS",
  title: "Travel / Hybrid 30L",
  description: { plain: "<ul><li>Travel / Hybrid 30L Backpack - Designed for Weekend Adventures, Travel and Commutes.</li><li>17” screen laptop compartment.</li></ul>" },
  rating: { value: 4.9, count: 255 },
  variants: [
    {
      id: "gid://shopify/ProductVariant/48206983921962",
      title: "Travel / Hybrid 30L",
      url: "https://threepeaksgbr.com/products/travel-hybrid-30l?variant=48206983921962&utm_source=shopify&utm_medium=catalog",
      price: { amount: 15200, currency: "EUR" },
      availability: { available: true },
      options: [{ name: "Color", label: "Black Rock" }],
      media: [{ type: "image", url: "https://cdn.shopify.com/s/files/1/0696/9943/6842/files/travel-hybrid-30l.webp" }],
      seller: { name: "Three Peaks GBR", url: "https://threepeaksgbr.com" },
    },
  ],
  metadata: {
    top_features: ["Large laptop compartment fits up to 17-inch screens for work or travel"],
    tech_specs: [
      "Overall Dimensions: 51 cm (H) x 32 cm (W) x 20 cm (D)",
      "Internal Dimensions: 45 cm (H) x 30 cm (W) x 18 cm (D)",
      "Laptop Compartment: 44 cm (H) x 27 cm (W) x 3 cm (D)",
    ],
  },
};

describe("normalizeUcpProduct", () => {
  it("maps a catalog product to a matchable backpack", () => {
    expect(normalizeUcpProduct(travelHybrid)).toEqual({
      id: "gid://shopify/p/6D6UIS9nVCWem2qQULWiQS",
      title: "Travel / Hybrid 30L",
      brand: "Three Peaks GBR",
      url: "https://threepeaksgbr.com/products/travel-hybrid-30l?variant=48206983921962&utm_source=shopify&utm_medium=catalog",
      imageUrl: "https://cdn.shopify.com/s/files/1/0696/9943/6842/files/travel-hybrid-30l.webp",
      currency: "EUR",
      options: [{ capacityLiters: 30, variantId: "gid://shopify/ProductVariant/48206983921962", price: 152 }],
      laptop: true,
      laptopInches: 17,
      dimensionsCm: { height: 51, width: 32, depth: 20 },
      categories: ["travel", "laptop"],
      rating: { value: 4.9, count: 255 },
    });
  });

  it("reads capacity from variant options (e.g. 26 / 30 litre versions)", () => {
    const entry = normalizeUcpProduct({
      id: "gid://shopify/p/synik",
      title: "Synik 30",
      description: { plain: "A travel backpack." },
      variants: [
        { id: "v26", price: { amount: 33000, currency: "USD" }, availability: { available: true }, options: [{ name: "Backpacks capacity", label: "26 Liters / 1585 cu. in." }] },
        { id: "v30", price: { amount: 35500, currency: "USD" }, availability: { available: true }, options: [{ name: "Backpacks capacity", label: "30 liters / 1830 cu. in." }] },
      ],
    });
    expect(entry?.options).toEqual([
      { capacityLiters: 26, variantId: "v26", price: 330 },
      { capacityLiters: 30, variantId: "v30", price: 355 },
    ]);
  });

  it("skips unavailable products, non-backpacks and unknown capacities", () => {
    expect(normalizeUcpProduct({ ...travelHybrid, variants: [{ ...travelHybrid.variants![0], availability: { available: false } }] })).toBeNull();
    expect(normalizeUcpProduct({ ...travelHybrid, title: "Packing Cube Set" })).toBeNull();
    expect(normalizeUcpProduct({ id: "x", title: "City Backpack", description: { plain: "Our best backpack." }, variants: [{ id: "v", price: { amount: 100, currency: "EUR" } }] })).toBeNull();
  });
});

describe("buildQueries", () => {
  it("searches from several angles on a 5 L capacity bucket, including Italian shops", () => {
    expect(buildQueries({ capacityRangeLiters: { min: 25, max: 30 }, backpackType: "travel", laptopRequired: true, laptopInches: 15 })).toEqual([
      "travel backpack carry-on 30L with laptop compartment 15 inch",
      "30 liter backpack",
      "30L rucksack laptop",
      "zaino da viaggio 30 litri",
      "CabinZero backpack 30L",
    ]);
    expect(buildQueries({ capacityRangeLiters: { min: 10, max: 15 } })).toEqual(["backpack 15L", "15 liter backpack", "15L rucksack", "zaino 15 litri"]);
  });

  it("uses luggage queries for trolleys and suitcases", () => {
    const cabin = buildQueries({ productKind: "cabin-trolley", capacityRangeLiters: { min: 35, max: 45 }, dimensionsCm: { height: 55, width: 40, depth: 20 } });
    expect(cabin).toContain("cabin trolley 55x40x20");
    expect(cabin).toContain("trolley bagaglio a mano 55x40x20");
    expect(buildQueries({ productKind: "checked-suitcase", capacityRangeLiters: { min: 65, max: 75 } })).toContain("valigia media 65 cm");
  });
});

describe("productKey", () => {
  it("matches the same product from the global and the store catalog", () => {
    const fromGlobal = productKey({ id: "gid://shopify/p/abc", url: "https://www.awaytravel.com/products/carry-on?variant=1&_gsid=x&utm_source=shopify" });
    const fromStore = productKey({ id: "gid://shopify/Product/9", url: "https://awaytravel.com/products/carry-on" });
    const localized = productKey({ id: "x", url: "https://eu.eastpak.com/it-it/products/day-pak-r?variant=2" });
    expect(fromGlobal).toBe(fromStore);
    expect(localized).toBe("eu.eastpak.com/products/day-pak-r");
  });
});

describe("savedCatalogId", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the backpack or luggage catalog when configured", () => {
    vi.stubEnv("SHOPIFY_CATALOG_ID_BACKPACKS", "cat-backpacks");
    vi.stubEnv("SHOPIFY_CATALOG_ID_LUGGAGE", " cat-luggage ");
    expect(savedCatalogId("backpack")).toBe("cat-backpacks");
    expect(savedCatalogId("cabin-trolley")).toBe("cat-luggage");
    expect(savedCatalogId("checked-suitcase")).toBe("cat-luggage");
  });

  it("falls back to one catalog for every kind, or the whole catalog when unset", () => {
    vi.stubEnv("SHOPIFY_CATALOG_ID_BACKPACKS", "");
    vi.stubEnv("SHOPIFY_CATALOG_ID_LUGGAGE", "");
    vi.stubEnv("SHOPIFY_CATALOG_ID", "cat-all");
    expect(savedCatalogId("backpack")).toBe("cat-all");
    expect(savedCatalogId("checked-suitcase")).toBe("cat-all");
    vi.stubEnv("SHOPIFY_CATALOG_ID", "");
    expect(savedCatalogId("backpack")).toBeUndefined();
  });
});
