import type { BackpackProduct, BackpackSearchCriteria, MatchReason } from "./provider";
import type { CatalogBackpack } from "./extract";

export type CatalogEntry = CatalogBackpack;

/** Points the product link at the chosen variant, keeping any attribution parameters already on it. */
function variantLink(url: string, variantId?: string) {
  const numericId = variantId?.split("/").pop();
  if (!numericId || !url) return url;
  try {
    const link = new URL(url);
    link.searchParams.set("variant", numericId);
    return link.toString();
  } catch {
    return url;
  }
}

interface Scored {
  entry: CatalogEntry;
  capacity: number;
  price: number;
  variantId?: string;
  score: number;
  reasons: MatchReason[];
}

const baseTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/\s[-–|]\s.*$/, "")
    .replace(/[®™]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** How far outside the suggested range a capacity may be and still count as "close" (scales with size). */
const belowTolerance = (min: number) => Math.max(2, min * 0.08);
const aboveTolerance = (max: number) => Math.max(5, max * 0.12);
/** A suitcase counts as light under this many kg per liter of capacity (≈2.4 kg for 40 L, 3.5 kg for 70 L). */
const LIGHT_KG_PER_LITER = 0.055;

function fitsWithin(product: { height: number; width: number; depth: number }, limit: BackpackSearchCriteria["dimensionsCm"]) {
  if (!limit) return true;
  const allowed = [limit.height ?? Infinity, limit.width ?? Infinity, limit.depth ?? Infinity].sort((a, b) => b - a);
  const actual = [product.height, product.width, product.depth].sort((a, b) => b - a);
  return actual.every((value, index) => value <= allowed[index]);
}

function scoreEntry(entry: CatalogEntry, criteria: BackpackSearchCriteria): Scored | null {
  const text = criteria.text?.trim().toLowerCase();
  if (text && !`${entry.title} ${entry.brand}`.toLowerCase().includes(text)) return null;
  const { min, max } = criteria.capacityRangeLiters;
  const target = (min + max) / 2;

  // Best capacity option for this product.
  const option = [...entry.options].sort((a, b) => Math.abs(a.capacityLiters - target) - Math.abs(b.capacityLiters - target))[0];
  if (!option) return null;
  const capacity = option.capacityLiters;
  const reasons: MatchReason[] = [];
  let score = 0;

  if (capacity >= min && capacity <= max) {
    score += 60;
    reasons.push("capacity-in-range");
  } else if (capacity >= min - belowTolerance(min) && capacity <= max + aboveTolerance(max)) {
    score += 40 - Math.abs(capacity - target) * 3;
    reasons.push("capacity-close");
  } else {
    return null;
  }

  if (criteria.laptopRequired) {
    if (!entry.laptop) return null;
    if (criteria.laptopInches && entry.laptopInches) {
      if (entry.laptopInches + 0.5 < criteria.laptopInches) return null;
      score += 15;
      reasons.push("laptop-size-confirmed");
    } else {
      score += 6;
      reasons.push("laptop-sleeve");
    }
  }

  if (criteria.dimensionsCm) {
    if (entry.dimensionsCm) {
      if (!fitsWithin(entry.dimensionsCm, criteria.dimensionsCm)) return null;
      score += 12;
      reasons.push("fits-airline-size");
    } else {
      reasons.push("size-unverified");
    }
  }

  if (criteria.backpackType && entry.categories.includes(criteria.backpackType)) {
    score += 10;
    reasons.push("type-match");
  }
  if (entry.capacityEstimated) {
    score -= 4;
    reasons.push("capacity-estimated");
  }
  if (entry.emptyWeightKg !== undefined && entry.emptyWeightKg <= capacity * LIGHT_KG_PER_LITER) {
    score += criteria.lightweight ? 12 : 3;
    reasons.push("lightweight");
  }

  if (entry.imageUrl) score += 2;
  // Foreign-currency prices rank a little lower (the store still ships here, e.g. Cotopaxi in USD).
  if (criteria.preferredCurrency && entry.currency && entry.currency !== criteria.preferredCurrency) score -= 5;
  // Keyword-stuffed marketplace titles are usually generic resellers rather than the maker's own store.
  if (entry.title.length > 70) score -= 8;
  // Well-reviewed products win ties (max +4).
  if (entry.rating && entry.rating.count >= 10) score += Math.max(0, entry.rating.value - 4) * 4;

  return { entry, capacity, price: option.price, variantId: option.variantId, score, reasons };
}

/** Ranks catalog entries against the questionnaire, keeping the list varied across brands. */
export function matchBackpacks(entries: readonly CatalogEntry[], criteria: BackpackSearchCriteria): BackpackProduct[] {
  const limit = criteria.limit ?? 6;
  const ranked = entries
    .map((entry) => scoreEntry(entry, criteria))
    .filter((item): item is Scored => item !== null)
    .sort((a, b) => b.score - a.score || a.price - b.price);

  // Colourway/edition duplicates ("Allpa 28L" vs "Allpa 28L - Del Día") collapse to the best-ranked one.
  const seen = new Set<string>();
  const scored = ranked.filter((item) => {
    const key = `${item.entry.brand}|${baseTitle(item.entry.title)}|${item.capacity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // At most two picks per brand on the first pass, then fill with whatever is left.
  const picked: Scored[] = [];
  const perBrand = new Map<string, number>();
  for (const item of scored) {
    if (picked.length >= limit) break;
    const count = perBrand.get(item.entry.brand) ?? 0;
    if (count >= 2) continue;
    perBrand.set(item.entry.brand, count + 1);
    picked.push(item);
  }
  for (const item of scored) {
    if (picked.length >= limit) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return picked.map(({ entry, capacity, price, variantId, reasons }) => ({
    id: entry.id,
    title: entry.title,
    brand: entry.brand,
    imageUrl: entry.imageUrl,
    productUrl: variantLink(entry.url, variantId),
    price,
    currency: entry.currency,
    capacityLiters: capacity,
    dimensions: entry.dimensionsCm,
    laptopInches: entry.laptopInches,
    rating: entry.rating,
    emptyWeightKg: entry.emptyWeightKg,
    capacityEstimated: entry.capacityEstimated,
    matchReasons: reasons,
  }));
}
