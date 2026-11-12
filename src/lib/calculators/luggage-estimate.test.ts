import { describe, expect, it } from "vitest";
import { estimateLuggage, suggestedSuitcaseQuantity } from "./luggage-estimate";

const shirt = { volumeLiters: 0.65, weightKg: 0.16, category: "clothing" as const };
const shoes = { volumeLiters: 2.5, weightKg: 0.85, category: "footwear" as const };

describe("estimateLuggage", () => {
  it("sizes a short trip as a cabin trolley and adds the empty case weight", () => {
    const estimate = estimateLuggage({ kind: "cabin-trolley", tripDays: 3, season: "mid", items: [{ ...shirt, quantity: 4 }, { ...shoes, quantity: 1 }] });
    expect(estimate.size).toBe("cabin");
    expect(estimate.exceedsCabin).toBe(false);
    expect(estimate.itemsWeightKg).toBe(1.5);
    expect(estimate.totalWeightKg).toBe(3.5);
    expect(estimate.suggestedCapacityRangeLiters.max).toBeLessThanOrEqual(45);
  });

  it("flags a list too big for a cabin trolley", () => {
    const estimate = estimateLuggage({ kind: "cabin-trolley", tripDays: 10, season: "winter", items: [{ ...shirt, quantity: 30 }, { ...shoes, quantity: 4 }] });
    expect(estimate.exceedsCabin).toBe(true);
    expect(estimate.size).toBe("cabin");
  });

  it("picks medium or large checked suitcases by volume", () => {
    const medium = estimateLuggage({ kind: "checked-suitcase", tripDays: 7, season: "mid", items: [{ ...shirt, quantity: 60 }, { ...shoes, quantity: 3 }] });
    expect(medium.size).toBe("medium");
    expect(medium.suggestedCapacityRangeLiters.max - medium.suggestedCapacityRangeLiters.min).toBe(10);
    const large = estimateLuggage({ kind: "checked-suitcase", tripDays: 14, season: "winter", items: [{ ...shirt, quantity: 60 }, { ...shoes, quantity: 6 }] });
    expect(large.size).toBe("large");
    expect(large.emptyCaseKg).toBeGreaterThan(medium.emptyCaseKg);
  });

  it("makes winter clothes bulkier and heavier than summer ones", () => {
    const summer = estimateLuggage({ kind: "checked-suitcase", tripDays: 7, season: "summer", items: [{ ...shirt, quantity: 20 }] });
    const winter = estimateLuggage({ kind: "checked-suitcase", tripDays: 7, season: "winter", items: [{ ...shirt, quantity: 20 }] });
    expect(winter.packedVolumeLiters).toBeGreaterThan(summer.packedVolumeLiters);
    expect(winter.itemsWeightKg).toBeGreaterThan(summer.itemsWeightKg);
  });
});

describe("suggestedSuitcaseQuantity", () => {
  it("caps clothes at a week when laundry is available", () => {
    expect(suggestedSuitcaseQuantity("underwear", 14, "mid", true)).toBe(7);
    expect(suggestedSuitcaseQuantity("underwear", 14, "mid", false)).toBe(14);
    expect(suggestedSuitcaseQuantity("shorts", 6, "winter", false)).toBe(0);
    expect(suggestedSuitcaseQuantity("boots", 6, "winter", false)).toBe(1);
  });
});

describe("cabin trolley starting list", () => {
  it("travels light: heavy items worn on board, clothes for at most 5 days", async () => {
    const { packingItems } = await import("../data/packing-items");
    expect(suggestedSuitcaseQuantity("jacket", 7, "winter", false, "cabin-trolley")).toBe(0);
    expect(suggestedSuitcaseQuantity("sneakers", 7, "mid", false, "cabin-trolley")).toBe(0);
    expect(suggestedSuitcaseQuantity("underwear", 10, "mid", false, "cabin-trolley")).toBe(5);
    // Every season and length starts under a 10 kg cabin allowance, empty trolley included.
    for (const days of [2, 5, 7, 14]) {
      for (const season of ["summer", "mid", "winter"] as const) {
        const items = packingItems.map((item) => ({ quantity: suggestedSuitcaseQuantity(item.id, days, season, false, "cabin-trolley"), volumeLiters: item.volumeLiters, weightKg: item.weightKg, category: item.category }));
        expect(estimateLuggage({ kind: "cabin-trolley", tripDays: days, season, items }).totalWeightKg).toBeLessThanOrEqual(10);
      }
    }
  });

  it("trims a suggested list down to a tighter allowance", async () => {
    const { trimToAllowance } = await import("./luggage-estimate");
    const weights: Record<string, number> = { "t-shirt": 0.2, underwear: 0.1, sweater: 0.5 };
    const total = (quantities: Record<string, number>) => 2 + Object.entries(quantities).reduce((sum, [id, count]) => sum + (weights[id] ?? 0) * count, 0);
    const trimmed = trimToAllowance({ "t-shirt": 5, underwear: 5, sweater: 2 }, 3.5, total);
    expect(total(trimmed)).toBeLessThanOrEqual(3.5);
    expect(trimmed.sweater).toBe(0);
    expect(trimmed["t-shirt"]).toBeGreaterThanOrEqual(2);
  });
});
