import type { PackingCategory } from "@/lib/data/packing-items";

export type LuggageKind = "cabin-trolley" | "checked-suitcase";
export type Season = "summer" | "mid" | "winter";
export type SuitcaseSize = "cabin" | "medium" | "large" | "extra-large";

export interface LuggageItem {
  quantity: number;
  volumeLiters: number;
  weightKg: number;
  category: PackingCategory;
}

export interface LuggageInput {
  kind: LuggageKind;
  tripDays: number;
  season: Season;
  items: readonly LuggageItem[];
}

export interface LuggageEstimate {
  packedVolumeLiters: number;
  recommendedCapacityLiters: number;
  suggestedCapacityRangeLiters: { min: number; max: number };
  size: SuitcaseSize;
  /** True when a cabin trolley can't realistically hold this list. */
  exceedsCabin: boolean;
  itemsWeightKg: number;
  emptyCaseKg: number;
  totalWeightKg: number;
}

/** Winter clothes are bulkier and heavier; summer ones lighter. */
const seasonVolume: Record<Season, number> = { summer: 0.85, mid: 1, winter: 1.35 };
const seasonWeight: Record<Season, number> = { summer: 0.9, mid: 1, winter: 1.2 };

/** Typical empty weight of a suitcase of each size (kg). */
export const emptyCaseWeights: Record<SuitcaseSize, number> = { cabin: 2, medium: 3.6, large: 4.5, "extra-large": 5.2 };

/** Usable capacity bands, roughly 55 cm cabin / ~65 cm medium / ~75 cm large / ~80 cm extra large. */
export const sizeBands: Record<SuitcaseSize, { min: number; max: number }> = {
  cabin: { min: 25, max: 45 },
  medium: { min: 55, max: 80 },
  large: { min: 85, max: 110 },
  "extra-large": { min: 110, max: 140 },
};

const PACKING_EFFICIENCY = 1.2; // folded clothes never fill a shell perfectly
const DAILY_BUFFER = 0.3; // liters per day for small unlisted things
const CABIN_LIMIT_LITERS = 45;

const round1 = (value: number) => Math.round(value * 10) / 10;

export function estimateLuggage(input: LuggageInput): LuggageEstimate {
  if (!Number.isFinite(input.tripDays) || input.tripDays < 1) throw new RangeError("Trip duration must be at least one day.");

  let volume = 0;
  let weight = 0;
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 0) throw new RangeError("Quantities must be non-negative integers.");
    const clothing = item.category === "clothing";
    volume += item.quantity * item.volumeLiters * (clothing ? seasonVolume[input.season] : 1);
    weight += item.quantity * item.weightKg * (clothing ? seasonWeight[input.season] : 1);
  }

  const recommended = (volume + input.tripDays * DAILY_BUFFER) * PACKING_EFFICIENCY;
  const exceedsCabin = recommended > CABIN_LIMIT_LITERS;

  let size: SuitcaseSize;
  if (input.kind === "cabin-trolley" || recommended <= CABIN_LIMIT_LITERS) size = "cabin";
  else if (recommended <= sizeBands.medium.max) size = "medium";
  else if (recommended <= sizeBands.large.max) size = "large";
  else size = "extra-large";

  // Range: start at the recommended capacity (never below the size band's floor), 10 L wide.
  const band = sizeBands[size];
  const min = Math.max(band.min, Math.ceil(recommended / 5) * 5);
  const max = input.kind === "cabin-trolley" ? Math.min(CABIN_LIMIT_LITERS, Math.max(min, min + 5)) : min + 10;
  const emptyCaseKg = emptyCaseWeights[size];

  return {
    packedVolumeLiters: round1(volume),
    recommendedCapacityLiters: round1(recommended),
    suggestedCapacityRangeLiters: { min: Math.min(min, max), max },
    size,
    exceedsCabin,
    itemsWeightKg: round1(weight),
    emptyCaseKg,
    totalWeightKg: round1(weight + emptyCaseKg),
  };
}

/** Heavy things you wear on the plane instead of packing them in a cabin trolley. */
const WORN_ON_BOARD = new Set(["jacket", "sneakers", "boots"]);

/**
 * Starting packing list for a suitcase trip. With laundry, clothes are planned for a week at most.
 * Cabin trolleys get a "travel light" list: clothes for 4–5 days, the bulkiest items worn on board,
 * no formal shoes or souvenir space.
 */
export function suggestedSuitcaseQuantity(itemId: string, days: number, season: Season, laundry: boolean, kind: LuggageKind = "checked-suitcase"): number {
  if (kind === "cabin-trolley") {
    if (WORN_ON_BOARD.has(itemId) || itemId === "formal-shoes" || itemId === "souvenirs") return 0;
    const cabinDays = Math.min(days, laundry ? 4 : 5);
    const base = suggestedSuitcaseQuantity(itemId, cabinDays, season, true, "checked-suitcase");
    const caps: Record<string, number> = { sweater: 1, hoodie: season === "winter" ? 0 : base, trousers: 2, shirt: 1, sandals: 1 };
    return itemId in caps ? Math.min(base, caps[itemId]) : base;
  }
  const clothesDays = Math.min(days, laundry ? 7 : 14);
  const warm = season === "winter";
  const hot = season === "summer";
  const suggestions: Record<string, number> = {
    "t-shirt": Math.max(1, clothesDays - (warm ? 2 : 0)),
    shirt: days >= 4 ? Math.ceil(clothesDays / 4) : 0,
    sweater: warm ? Math.max(1, Math.ceil(clothesDays / 3)) : hot ? 0 : 1,
    hoodie: hot ? 0 : 1,
    trousers: Math.max(1, Math.ceil(clothesDays / (hot ? 4 : 3))),
    shorts: hot ? Math.ceil(clothesDays / 2) : 0,
    underwear: clothesDays,
    socks: clothesDays,
    jacket: hot ? 0 : 1,
    sneakers: 1,
    "formal-shoes": days >= 5 ? 1 : 0,
    sandals: hot ? 1 : 0,
    boots: warm ? 1 : 0,
    laptop: 0,
    tablet: 0,
    camera: 0,
    chargers: 1,
    "power-bank": 1,
    toiletries: 1,
    documents: 1,
    bottle: 0,
    accessories: 1,
    "hair-dryer": 0,
    souvenirs: days >= 5 ? 1 : 0,
  };
  return suggestions[itemId] ?? 0;
}

/** Clothes trimmed first (and their minimum) when a suggested list is heavier than the allowance. */
const TRIM_ORDER: [string, number][] = [
  ["hoodie", 0], ["sweater", 0], ["shirt", 0], ["t-shirt", 2], ["trousers", 1], ["shorts", 0], ["underwear", 2], ["socks", 2], ["sandals", 0], ["power-bank", 0], ["hair-dryer", 0],
];

/**
 * Removes clothes from a *suggested* list, one at a time, until its estimated total weight fits
 * the allowance (or nothing sensible is left to remove). Never used on a list the visitor edited.
 */
export function trimToAllowance(
  quantities: Record<string, number>,
  allowanceKg: number,
  estimate: (quantities: Record<string, number>) => number,
): Record<string, number> {
  const trimmed = { ...quantities };
  let guard = 0;
  while (estimate(trimmed) > allowanceKg && guard < 60) {
    guard += 1;
    const next = TRIM_ORDER.find(([id, min]) => (trimmed[id] ?? 0) > min);
    if (!next) break;
    trimmed[next[0]] -= 1;
  }
  return trimmed;
}
