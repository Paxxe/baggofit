import { describe, expect, it } from "vitest";
import { checkAirlineCompatibility } from "../calculators/airline-compatibility";
import { getAirlineRules, getVerifiedPolicy } from "./airlines";

describe("verified airline rules", () => {
  it("exposes Ryanair's official limits with source and date", () => {
    const rules = getAirlineRules("ryanair");
    const personal = rules.find((rule) => rule.baggageType === "personal-item");
    const cabin = rules.find((rule) => rule.baggageType === "cabin-bag");
    expect(personal).toMatchObject({ status: "verified", maxHeightCm: 40, maxWidthCm: 30, maxDepthCm: 20, maxWeightKg: null });
    expect(cabin).toMatchObject({ status: "verified", maxHeightCm: 55, maxWidthCm: 40, maxDepthCm: 20, maxWeightKg: 10 });
    expect(personal?.sourceUrl).toContain("help.ryanair.com");
    expect(getVerifiedPolicy("ryanair")?.verifiedAt).toBe("2026-11-11");
  });

  it("checks a backpack against the Ryanair under-seat bag", () => {
    const personal = getAirlineRules("ryanair").find((rule) => rule.baggageType === "personal-item")!;
    expect(checkAirlineCompatibility({ rule: personal, backpackDimensions: { height: 38, width: 28, depth: 18 } }).status).toBe("compatible");
    expect(checkAirlineCompatibility({ rule: personal, backpackDimensions: { height: 45, width: 30, depth: 20 } }).status).toBe("not-compatible");
  });

  it("exposes easyJet's cabin limits and keeps its unverified checked-bag rule unverified", () => {
    const rules = getAirlineRules("easyjet");
    expect(rules.find((rule) => rule.baggageType === "personal-item")).toMatchObject({ status: "verified", maxHeightCm: 45, maxWidthCm: 36, maxDepthCm: 20, maxWeightKg: 15 });
    expect(rules.find((rule) => rule.baggageType === "cabin-bag")).toMatchObject({ status: "verified", maxHeightCm: 56, maxWidthCm: 45, maxDepthCm: 25, maxWeightKg: 15 });
    expect(rules.find((rule) => rule.baggageType === "checked-bag")?.status).toBe("unverified");
  });

  it("exposes Wizz Air's carry-on, trolley and checked limits", () => {
    const rules = getAirlineRules("wizz-air");
    expect(rules.find((rule) => rule.baggageType === "personal-item")).toMatchObject({ status: "verified", maxHeightCm: 40, maxWidthCm: 30, maxDepthCm: 20, maxWeightKg: 10 });
    expect(rules.find((rule) => rule.baggageType === "cabin-bag")).toMatchObject({ status: "verified", maxHeightCm: 55, maxWidthCm: 40, maxDepthCm: 23, maxWeightKg: 10 });
    expect(rules.find((rule) => rule.baggageType === "checked-bag")).toMatchObject({ status: "verified", maxWeightKg: 32 });
  });

  it("keeps other airlines unverified until checked", () => {
    expect(getAirlineRules("united").every((rule) => rule.status === "unverified" && rule.maxHeightCm === null)).toBe(true);
    expect(getVerifiedPolicy("united")).toBeNull();
  });
});

describe("allowance volume", () => {
  it("converts verified sizes to approximate usable liters", async () => {
    const { maxVolumeLiters, volumeStatus } = await import("../calculators/airline-compatibility");
    const ryanair = getAirlineRules("ryanair");
    const easyjet = getAirlineRules("easyjet");
    expect(maxVolumeLiters(ryanair.find((rule) => rule.baggageType === "personal-item"))).toBe(20);
    expect(maxVolumeLiters(ryanair.find((rule) => rule.baggageType === "cabin-bag"))).toBe(37);
    expect(maxVolumeLiters(easyjet.find((rule) => rule.baggageType === "personal-item"))).toBe(27);
    expect(maxVolumeLiters(ryanair.find((rule) => rule.baggageType === "checked-bag"))).toBeNull();
    expect(maxVolumeLiters(getAirlineRules("united")[0])).toBeNull();
    expect(maxVolumeLiters(getAirlineRules("wizz-air").find((rule) => rule.baggageType === "cabin-bag"))).toBe(43);
    expect(volumeStatus(18, 20)).toBe("ok");
    expect(volumeStatus(19, 20)).toBe("near");
    expect(volumeStatus(23, 20)).toBe("over");
  });
});

describe("legacy and US carriers", () => {
  it("records cabin limits for the newly verified airlines", () => {
    const cabin = (id: string) => getAirlineRules(id).find((rule) => rule.baggageType === "cabin-bag");
    const personal = (id: string) => getAirlineRules(id).find((rule) => rule.baggageType === "personal-item");
    expect(cabin("ita-airways")).toMatchObject({ status: "verified", maxHeightCm: 55, maxWidthCm: 40, maxDepthCm: 23, maxWeightKg: 8 });
    expect(cabin("vueling")).toMatchObject({ maxHeightCm: 55, maxWidthCm: 40, maxDepthCm: 20, maxWeightKg: 10 });
    expect(cabin("lufthansa")).toMatchObject({ maxHeightCm: 55, maxWidthCm: 40, maxDepthCm: 23, maxWeightKg: 8 });
    expect(cabin("british-airways")).toMatchObject({ maxHeightCm: 56, maxWidthCm: 45, maxDepthCm: 25, maxWeightKg: null });
    expect(cabin("klm")).toMatchObject({ maxHeightCm: 55, maxWidthCm: 35, maxDepthCm: 25, maxWeightKg: 12 });
    expect(personal("american-airlines")).toMatchObject({ maxHeightCm: 45, maxWidthCm: 35, maxDepthCm: 20 });
    // Delta publishes no personal-item size: verified, but without dimensions.
    expect(personal("delta")).toMatchObject({ status: "verified", maxHeightCm: null });
    // Checked bags weren't part of this check.
    expect(getAirlineRules("lufthansa").find((rule) => rule.baggageType === "checked-bag")?.status).toBe("unverified");
  });
});
