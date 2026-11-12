import type { BackpackProduct } from "./provider";

export type ProductSort = "relevance" | "price-asc" | "price-desc" | "rating";

export interface ProductFilters {
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  /** Only products whose stated size is confirmed to fit the airline limit. */
  fitsOnly?: boolean;
  sort?: ProductSort;
}

export interface ProductFacets {
  brands: { name: string; count: number }[];
  priceRange: { min: number; max: number } | null;
  fitsCount: number;
}

/** Brands (most relevant first), price span and "confirmed fit" count over the full ranked list. */
export function productFacets(products: readonly BackpackProduct[], maxBrands = 30): ProductFacets {
  // Map keeps insertion order, i.e. each brand's best (first) position in the ranking.
  const brandCounts = new Map<string, number>();
  const prices: number[] = [];
  let fitsCount = 0;
  for (const product of products) {
    if (product.brand) brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
    if (product.price !== undefined) prices.push(product.price);
    if (product.matchReasons?.includes("fits-airline-size")) fitsCount += 1;
  }
  // Most relevant brands first: order of their best-ranked product.
  const brands = [...brandCounts.entries()].map(([name, count]) => ({ name, count })).slice(0, maxBrands);
  return { brands, priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null, fitsCount };
}

/** Applies the visitor's filters and sort order; "relevance" keeps the ranking from matchBackpacks. */
export function refineProducts(products: readonly BackpackProduct[], filters: ProductFilters): BackpackProduct[] {
  const filtered = products.filter((product) => {
    if (filters.priceMin !== undefined && (product.price === undefined || product.price < filters.priceMin)) return false;
    if (filters.priceMax !== undefined && (product.price === undefined || product.price > filters.priceMax)) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    if (filters.fitsOnly && !product.matchReasons?.includes("fits-airline-size")) return false;
    return true;
  });
  const priceOf = (product: BackpackProduct, fallback: number) => product.price ?? fallback;
  switch (filters.sort) {
    case "price-asc":
      return [...filtered].sort((a, b) => priceOf(a, Infinity) - priceOf(b, Infinity));
    case "price-desc":
      return [...filtered].sort((a, b) => priceOf(b, -Infinity) - priceOf(a, -Infinity));
    case "rating":
      // Bayesian-ish: a 4.9 from 3 reviews shouldn't beat a 4.7 from 2,000.
      return [...filtered].sort((a, b) => score(b) - score(a));
    default:
      return filtered;
  }
}

function score(product: BackpackProduct) {
  if (!product.rating) return 0;
  const { value, count } = product.rating;
  const prior = 4.2;
  const weight = 20;
  return (value * count + prior * weight) / (count + weight);
}
