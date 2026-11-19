import { airlines, getVerifiedPolicy } from "./airlines";

/**
 * CabinZero Classic sizes from the maker's product pages (cabinzero.com, checked 19 November 2026).
 * The 44L pages list two sizes (51×36×18 and 51×37×20 cm): we use the larger, to stay on the safe side.
 */
export const cabinZeroModels = [
  { liters: 28, size: [39, 29.5, 20], weightG: 600 },
  { liters: 36, size: [45, 31, 20], weightG: 700 },
  { liters: 44, size: [51, 37, 20], weightG: 760 },
] as const;

type Limit = { maxHeightCm: number | null; maxWidthCm: number | null; maxDepthCm: number | null };

/** Whether a bag fits a limit in any orientation (largest side against largest side). */
export function fitsLimit(size: readonly number[], limit: Limit) {
  if (!limit.maxHeightCm || !limit.maxWidthCm || !limit.maxDepthCm) return false;
  const allowed = [limit.maxHeightCm, limit.maxWidthCm, limit.maxDepthCm].sort((a, b) => b - a);
  return [...size].sort((a, b) => b - a).every((value, index) => value <= allowed[index]);
}

export type BagFit = "under-seat" | "overhead" | "too-big" | "unknown";

/** Where a bag can go on one airline, from its verified rules. */
export function bagFit(size: readonly number[], airlineId: string): BagFit {
  const rules = getVerifiedPolicy(airlineId)?.rules;
  if (!rules) return "unknown";
  if (rules["personal-item"] && fitsLimit(size, rules["personal-item"])) return "under-seat";
  if (rules["cabin-bag"] && fitsLimit(size, rules["cabin-bag"])) return "overhead";
  return "too-big";
}

/** Airlines (verified rules only) where a bag goes under the seat, or in the overhead bin. */
export function airlinesFor(size: readonly number[]) {
  const underSeat: string[] = [];
  const overhead: string[] = [];
  for (const airline of airlines) {
    const fit = bagFit(size, airline.id);
    if (fit === "under-seat") underSeat.push(airline.name);
    if (fit === "overhead") overhead.push(airline.name);
  }
  return { underSeat, overhead };
}
