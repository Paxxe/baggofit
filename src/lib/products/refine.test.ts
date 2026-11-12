import { describe, expect, it } from "vitest";
import { productFacets, refineProducts } from "./refine";
import type { BackpackProduct } from "./provider";

const product = (id: string, overrides: Partial<BackpackProduct> = {}): BackpackProduct => ({ id, title: id, brand: "A", price: 100, ...overrides });

const list = [
  product("cheap", { price: 40, brand: "A" }),
  product("mid", { price: 120, brand: "B", matchReasons: ["capacity-in-range", "fits-airline-size"] }),
  product("pricey", { price: 260, brand: "B", rating: { value: 4.7, count: 2000 } }),
  product("hyped", { price: 90, brand: "C", rating: { value: 5, count: 2 } }),
];

describe("refineProducts", () => {
  it("keeps the ranking when sorting by relevance", () => {
    expect(refineProducts(list, {}).map((item) => item.id)).toEqual(["cheap", "mid", "pricey", "hyped"]);
  });

  it("filters by price band, brand and confirmed fit", () => {
    expect(refineProducts(list, { priceMin: 80, priceMax: 150 }).map((item) => item.id)).toEqual(["mid", "hyped"]);
    expect(refineProducts(list, { brand: "B" }).map((item) => item.id)).toEqual(["mid", "pricey"]);
    expect(refineProducts(list, { fitsOnly: true }).map((item) => item.id)).toEqual(["mid"]);
  });

  it("sorts by price and by trustworthy rating", () => {
    expect(refineProducts(list, { sort: "price-asc" }).map((item) => item.id)).toEqual(["cheap", "hyped", "mid", "pricey"]);
    expect(refineProducts(list, { sort: "price-desc" })[0].id).toBe("pricey");
    // 4.7 from 2,000 reviews beats 5.0 from 2.
    expect(refineProducts(list, { sort: "rating" })[0].id).toBe("pricey");
  });
});

describe("productFacets", () => {
  it("lists brands by relevance with counts, plus price span and confirmed fits", () => {
    expect(productFacets(list)).toEqual({
      brands: [{ name: "A", count: 1 }, { name: "B", count: 2 }, { name: "C", count: 1 }],
      priceRange: { min: 40, max: 260 },
      fitsCount: 1,
    });
  });
});
