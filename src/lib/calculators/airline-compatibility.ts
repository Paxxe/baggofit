export interface DimensionsCm {
  height: number;
  width: number;
  depth: number;
}

export interface BaggageRule {
  status: "verified" | "unverified";
  maxHeightCm: number | null;
  maxWidthCm: number | null;
  maxDepthCm: number | null;
  maxWeightKg: number | null;
  verifiedAt: string | null;
  sourceUrl: string | null;
}

export interface CompatibilityInput {
  rule: BaggageRule | null;
  backpackDimensions: DimensionsCm | null;
  backpackWeightKg?: number | null;
}

export interface CompatibilityResult {
  status: "compatible" | "not-compatible" | "cannot-verify";
  reasons: string[];
  orientation?: [number, number, number];
}

export function checkAirlineCompatibility(input: CompatibilityInput): CompatibilityResult {
  const { rule, backpackDimensions: dimensions, backpackWeightKg: weight } = input;

  if (!rule || rule.status !== "verified" || !rule.verifiedAt || !rule.sourceUrl) {
    return {
      status: "cannot-verify",
      reasons: ["A current, sourced baggage rule is not available."],
    };
  }

  if (!dimensions) {
    return {
      status: "cannot-verify",
      reasons: ["Enter the backpack's external height, width, and depth to check fit."],
    };
  }

  const limits = [rule.maxHeightCm, rule.maxWidthCm, rule.maxDepthCm];
  if (limits.some((limit) => limit === null)) {
    return {
      status: "cannot-verify",
      reasons: ["The verified rule does not include all three external dimensions."],
    };
  }

  const values: [number, number, number] = [dimensions.height, dimensions.width, dimensions.depth];
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    return {
      status: "cannot-verify",
      reasons: ["All backpack dimensions must be greater than zero."],
    };
  }

  const max = limits as [number, number, number];
  const orientation = permutations(values).find((candidate) =>
    candidate.every((value, index) => value <= max[index]),
  );

  if (!orientation) {
    return {
      status: "not-compatible",
      reasons: ["The backpack exceeds the permitted size in every orientation."],
    };
  }

  if (rule.maxWeightKg !== null) {
    if (weight === null || weight === undefined) {
      return {
        status: "cannot-verify",
        reasons: ["Size fits when rotated, but the packed backpack's weight is needed."],
        orientation,
      };
    }
    if (!Number.isFinite(weight) || weight < 0) {
      return {
        status: "cannot-verify",
        reasons: ["Enter a valid backpack weight to check the weight limit."],
        orientation,
      };
    }
    if (weight > rule.maxWeightKg) {
      return {
        status: "not-compatible",
        reasons: [`Weight exceeds the ${rule.maxWeightKg} kg limit.`],
        orientation,
      };
    }
  }

  return {
    status: "compatible",
    reasons: ["Dimensions and applicable weight are within the verified rule."],
    orientation,
  };
}

function permutations(values: [number, number, number]): [number, number, number][] {
  const [first, second, third] = values;
  return [
    [first, second, third],
    [first, third, second],
    [second, first, third],
    [second, third, first],
    [third, first, second],
    [third, second, first],
  ];
}
/** Share of the allowed box a soft bag can realistically fill (rounded corners, padding, straps). */
export const SOFT_BAG_FILL = 0.85;

/**
 * Approximate usable volume (liters) of a verified size limit, e.g. 40×30×20 cm → ~20 L.
 * Returns null when the rule isn't verified or lacks a dimension.
 */
export function maxVolumeLiters(rule: BaggageRule | null | undefined): number | null {
  if (!rule || rule.status !== "verified" || rule.maxHeightCm === null || rule.maxWidthCm === null || rule.maxDepthCm === null) return null;
  return Math.floor(((rule.maxHeightCm * rule.maxWidthCm * rule.maxDepthCm) / 1000) * SOFT_BAG_FILL);
}

export type VolumeStatus = "ok" | "near" | "over";

/** Compares the volume a list needs with what the allowance holds ("near" from 90%). */
export function volumeStatus(neededLiters: number, limitLiters: number): VolumeStatus {
  if (neededLiters > limitLiters) return "over";
  if (neededLiters > limitLiters * 0.9) return "near";
  return "ok";
}
