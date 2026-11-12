import { describe, expect, it } from "vitest";
import { estimateBackpackCapacity } from "./backpack-capacity";

describe("estimateBackpackCapacity", () => {
  it("includes a duration buffer when the packing list is empty", () => {
    const result = estimateBackpackCapacity({
      tripDays: 4,
      packingStyle: "balanced",
      items: [],
    });

    expect(result.estimatedPackedVolumeLiters).toBe(0);
    expect(result.durationBufferLiters).toBe(2);
    expect(result.suggestedCapacityRangeLiters).toEqual({ min: 5, max: 10 });
  });

  it("sums item quantities and applies the selected packing margin", () => {
    const result = estimateBackpackCapacity({
      tripDays: 5,
      packingStyle: "balanced",
      items: [{ name: "T-shirt", quantity: 5, volumeLiters: 0.7 }],
    });

    expect(result.estimatedPackedVolumeLiters).toBe(3.5);
    expect(result.durationBufferLiters).toBe(2.5);
    expect(result.recommendedUsableCapacityLiters).toBe(7.5);
    expect(result.capacityMargin).toBe(0.25);
  });

  it("estimates everyday carry without requiring trip duration or adding a travel buffer", () => {
    const result = estimateBackpackCapacity({
      usageMode: "everyday",
      packingStyle: "balanced",
      items: [{ name: "Laptop", quantity: 1, volumeLiters: 2.5 }],
    });

    expect(result.estimatedPackedVolumeLiters).toBe(2.5);
    expect(result.durationBufferLiters).toBe(0);
    expect(result.recommendedUsableCapacityLiters).toBe(3.1);
  });

  it("rejects invalid quantities and volumes", () => {
    expect(() => estimateBackpackCapacity({
      tripDays: 2,
      packingStyle: "minimalist",
      items: [{ name: "Socks", quantity: -1, volumeLiters: 0.2 }],
    })).toThrow(RangeError);

    expect(() => estimateBackpackCapacity({
      tripDays: 2,
      packingStyle: "minimalist",
      items: [{ name: "Socks", quantity: 1, volumeLiters: Number.NaN }],
    })).toThrow(RangeError);
  });
});