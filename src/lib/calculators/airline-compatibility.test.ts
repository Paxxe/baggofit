import { describe, expect, it } from "vitest";
import { checkAirlineCompatibility, type BaggageRule } from "./airline-compatibility";

const verifiedRule: BaggageRule = {
  status: "verified",
  maxHeightCm: 40,
  maxWidthCm: 30,
  maxDepthCm: 20,
  maxWeightKg: 8,
  verifiedAt: "2026-01-15",
  sourceUrl: "https://example.com/baggage",
};

describe("checkAirlineCompatibility", () => {
  it("allows a fitting orientation when dimensions are rotated", () => {
    const result = checkAirlineCompatibility({
      rule: verifiedRule,
      backpackDimensions: { height: 30, width: 40, depth: 20 },
      backpackWeightKg: 7,
    });

    expect(result.status).toBe("compatible");
    expect(result.orientation).toEqual([40, 30, 20]);
  });

  it("rejects a bag that exceeds every orientation or exceeds weight", () => {
    expect(checkAirlineCompatibility({
      rule: verifiedRule,
      backpackDimensions: { height: 41, width: 30, depth: 20 },
      backpackWeightKg: 7,
    }).status).toBe("not-compatible");

    expect(checkAirlineCompatibility({
      rule: verifiedRule,
      backpackDimensions: { height: 40, width: 30, depth: 20 },
      backpackWeightKg: 8.1,
    }).status).toBe("not-compatible");
  });

  it("cannot confirm unverified rules, missing dimensions, or missing required weight", () => {
    expect(checkAirlineCompatibility({
      rule: { ...verifiedRule, status: "unverified" },
      backpackDimensions: { height: 40, width: 30, depth: 20 },
    }).status).toBe("cannot-verify");

    expect(checkAirlineCompatibility({ rule: verifiedRule, backpackDimensions: null }).status)
      .toBe("cannot-verify");

    expect(checkAirlineCompatibility({
      rule: verifiedRule,
      backpackDimensions: { height: 40, width: 30, depth: 20 },
    }).status).toBe("cannot-verify");
  });
});