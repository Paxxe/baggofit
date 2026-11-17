export type BackpackCategory = "everyday" | "travel" | "laptop" | "hiking";
/** What the visitor is shopping for. */
export type ProductKind = "backpack" | "cabin-trolley" | "checked-suitcase";

export interface BackpackProduct {
  id: string;
  title: string;
  /** Store (seller) name. */
  brand?: string;
  /** The product's real brand, when recognised; used by the brand filter. */
  maker?: string;
  imageUrl?: string;
  productUrl?: string;
  price?: number;
  currency?: string;
  /** Set when the price was converted from another currency (an estimate; the store may differ). */
  originalPrice?: number;
  originalCurrency?: string;
  capacityLiters?: number;
  dimensions?: { height: number; width: number; depth: number };
  /** Largest laptop the maker says fits, in inches, when stated. */
  laptopInches?: number;
  rating?: { value: number; count: number };
  /** Empty weight of the bag/suitcase in kg, when stated. */
  emptyWeightKg?: number;
  /** Capacity was derived from the outer size because the maker didn't state it. */
  capacityEstimated?: boolean;
  /** Why this product was suggested; translated in the UI. */
  matchReasons?: MatchReason[];
}

export type MatchReason =
  | "capacity-in-range"
  | "capacity-close"
  /** Rated above the range, but its stated outer size fits the airline limit. */
  | "capacity-over-fits-size"
  | "laptop-size-confirmed"
  | "laptop-sleeve"
  | "fits-airline-size"
  | "size-unverified"
  | "type-match"
  | "lightweight"
  | "capacity-estimated";

export interface BackpackSearchCriteria {
  capacityRangeLiters: { min: number; max: number };
  backpackType?: BackpackCategory;
  laptopRequired?: boolean;
  /** Screen size the user needs to carry, in inches. */
  laptopInches?: number;
  /** Maximum allowed outer size (e.g. airline personal item), in cm. */
  dimensionsCm?: { height?: number; width?: number; depth?: number };
  limit?: number;
  productKind?: ProductKind;
  /** Brand or model the visitor typed (e.g. "Eastpak"): targeted searches, and only matching products are kept. */
  text?: string;
  /** Prefer light suitcases (useful with strict weight allowances). */
  lightweight?: boolean;
  /** Shop currency the visitor expects; products priced in another currency rank lower. */
  preferredCurrency?: string;
}

export interface ProductRecommendationProvider {
  searchBackpacks(criteria: BackpackSearchCriteria): Promise<BackpackProduct[]>;
}
