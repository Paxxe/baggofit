import { describe, expect, it } from "vitest";
import { matchBackpacks, type CatalogEntry } from "./match";

const entry = (overrides: Partial<CatalogEntry> & Pick<CatalogEntry, "id" | "title">): CatalogEntry => ({
  brand: "Brand A",
  url: `https://shop.example/products/${overrides.id}`,
  options: [{ capacityLiters: 25, price: 100 }],
  laptop: false,
  categories: [],
  currency: "EUR",
  ...overrides,
});

describe("matchBackpacks", () => {
  it("keeps capacities in or close to the range and ranks exact fits first", () => {
    const results = matchBackpacks(
      [
        entry({ id: "close", title: "Close 32L", options: [{ capacityLiters: 32, price: 90 }] }),
        entry({ id: "exact", title: "Exact 27L", options: [{ capacityLiters: 27, price: 120 }] }),
        entry({ id: "far", title: "Far 45L", options: [{ capacityLiters: 45, price: 80 }] }),
      ],
      { capacityRangeLiters: { min: 25, max: 30 } },
    );
    expect(results.map((product) => product.id)).toEqual(["exact", "close"]);
    expect(results[0].matchReasons).toContain("capacity-in-range");
    expect(results[1].matchReasons).toContain("capacity-close");
  });

  it("picks the variant closest to the target and links to it", () => {
    const [result] = matchBackpacks(
      [entry({
        id: "multi",
        title: "Multi",
        url: "https://shop.example/products/multi?variant=1&utm_source=shopify&utm_medium=catalog",
        options: [{ capacityLiters: 20, variantId: "gid://shopify/ProductVariant/1", price: 100 }, { capacityLiters: 28, variantId: "gid://shopify/ProductVariant/2", price: 130 }],
      })],
      { capacityRangeLiters: { min: 25, max: 30 } },
    );
    expect(result.capacityLiters).toBe(28);
    // Switches to the chosen variant and keeps Shopify's attribution parameters.
    expect(result.productUrl).toBe("https://shop.example/products/multi?variant=2&utm_source=shopify&utm_medium=catalog");
  });

  it("requires a laptop compartment big enough when asked", () => {
    const results = matchBackpacks(
      [
        entry({ id: "none", title: "No laptop" }),
        entry({ id: "small", title: "Small sleeve", laptop: true, laptopInches: 13 }),
        entry({ id: "big", title: "Big sleeve", laptop: true, laptopInches: 16 }),
        entry({ id: "unknown", title: "Unknown size", laptop: true }),
      ],
      { capacityRangeLiters: { min: 20, max: 30 }, laptopRequired: true, laptopInches: 15 },
    );
    expect(results.map((product) => product.id)).toEqual(["big", "unknown"]);
    expect(results[0].matchReasons).toContain("laptop-size-confirmed");
    expect(results[1].matchReasons).toContain("laptop-sleeve");
  });

  it("drops bags known to exceed the size limit and flags unknown sizes", () => {
    const results = matchBackpacks(
      [
        entry({ id: "fits", title: "Fits", dimensionsCm: { height: 40, width: 30, depth: 20 } }),
        entry({ id: "too-big", title: "Too big", dimensionsCm: { height: 55, width: 35, depth: 25 } }),
        entry({ id: "unknown", title: "Unknown" }),
      ],
      { capacityRangeLiters: { min: 20, max: 30 }, dimensionsCm: { height: 40, width: 30, depth: 20 } },
    );
    expect(results.map((product) => product.id)).toEqual(["fits", "unknown"]);
    expect(results[1].matchReasons).toContain("size-unverified");
  });

  it("collapses colourway duplicates and limits picks per brand", () => {
    const results = matchBackpacks(
      [
        entry({ id: "a1", title: "Allpa 28L Travel Pack" }),
        entry({ id: "a2", title: "Allpa 28L Travel Pack - Del Día" }),
        entry({ id: "a3", title: "Tasra 26L" }),
        entry({ id: "a4", title: "Elqui 25L" }),
        entry({ id: "b1", title: "Other 25L", brand: "Brand B" }),
      ],
      { capacityRangeLiters: { min: 20, max: 30 }, limit: 3 },
    );
    expect(results.map((product) => product.brand)).toEqual(["Brand A", "Brand A", "Brand B"]);
    expect(results.filter((product) => product.title.startsWith("Allpa"))).toHaveLength(1);
  });

  it("ranks products priced in the visitor's currency first", () => {
    const results = matchBackpacks(
      [entry({ id: "usd", title: "Dollar pack", currency: "USD" }), entry({ id: "eur", title: "Euro pack", brand: "Brand B" })],
      { capacityRangeLiters: { min: 20, max: 30 }, preferredCurrency: "EUR" },
    );
    expect(results.map((product) => product.id)).toEqual(["eur", "usd"]);
  });
});

describe("brand or model search", () => {
  it("keeps only products whose title or store matches the text", () => {
    const results = matchBackpacks(
      [entry({ id: "e1", title: "Eastpak Day Pak'r 24L", brand: "WARDOW" }), entry({ id: "c1", title: "Allpa 28L", brand: "Cotopaxi" }), entry({ id: "x", title: "Generic 25L" })],
      { capacityRangeLiters: { min: 20, max: 30 }, text: "eastpak" },
    );
    expect(results.map((product) => product.id)).toEqual(["e1"]);
    expect(matchBackpacks([entry({ id: "c1", title: "Allpa 28L", brand: "Cotopaxi" })], { capacityRangeLiters: { min: 20, max: 30 }, text: "Cotopaxi" })).toHaveLength(1);
  });
});
