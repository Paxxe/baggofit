export type Locale = "en" | "it";
export type PackingCategory = "clothing" | "footwear" | "electronics" | "accessories" | "outdoor";

export interface PackingItemDefinition {
  id: string;
  category: PackingCategory;
  volumeLiters: number;
  /** Typical weight of one item, used for suitcase/trolley weight estimates. */
  weightKg: number;
  /** Only offered in the trolley/suitcase questionnaire. */
  suitcaseOnly?: boolean;
  label: Record<Locale, string>;
}

export const packingCategories: Record<Exclude<PackingCategory, "outdoor">, Record<Locale, string>> = {
  clothing: { en: "Clothing", it: "Abbigliamento" },
  footwear: { en: "Footwear", it: "Calzature" },
  electronics: { en: "Electronics", it: "Elettronica" },
  accessories: { en: "Accessories", it: "Accessori" },
};

export const packingItems: PackingItemDefinition[] = [
  { id: "t-shirt", category: "clothing", volumeLiters: 0.65, weightKg: 0.16, label: { en: "T-shirts", it: "Magliette" } },
  { id: "shirt", category: "clothing", volumeLiters: 0.6, weightKg: 0.2, label: { en: "Shirts", it: "Camicie" } },
  { id: "sweater", category: "clothing", volumeLiters: 1.2, weightKg: 0.45, label: { en: "Sweaters", it: "Maglioni" } },
  { id: "hoodie", category: "clothing", volumeLiters: 1.8, weightKg: 0.55, label: { en: "Hoodies", it: "Felpe" } },
  { id: "trousers", category: "clothing", volumeLiters: 1, weightKg: 0.55, label: { en: "Trousers", it: "Pantaloni" } },
  { id: "shorts", category: "clothing", volumeLiters: 0.5, weightKg: 0.25, label: { en: "Shorts", it: "Pantaloncini" } },
  { id: "underwear", category: "clothing", volumeLiters: 0.18, weightKg: 0.06, label: { en: "Underwear", it: "Intimo" } },
  { id: "socks", category: "clothing", volumeLiters: 0.15, weightKg: 0.05, label: { en: "Socks", it: "Calze" } },
  { id: "jacket", category: "clothing", volumeLiters: 2.8, weightKg: 0.9, label: { en: "Jacket", it: "Giacca" } },
  { id: "sneakers", category: "footwear", volumeLiters: 2.5, weightKg: 0.85, label: { en: "Sneakers", it: "Sneakers" } },
  { id: "formal-shoes", category: "footwear", volumeLiters: 2, weightKg: 0.9, label: { en: "Formal shoes", it: "Scarpe eleganti" } },
  { id: "sandals", category: "footwear", volumeLiters: 0.9, weightKg: 0.4, label: { en: "Sandals", it: "Sandali" } },
  { id: "boots", category: "footwear", volumeLiters: 3.2, weightKg: 1.3, label: { en: "Boots", it: "Stivali" } },
  { id: "laptop", category: "electronics", volumeLiters: 2.5, weightKg: 1.6, label: { en: "Laptop", it: "Laptop" } },
  { id: "tablet", category: "electronics", volumeLiters: 0.8, weightKg: 0.5, label: { en: "Tablet", it: "Tablet" } },
  { id: "camera", category: "electronics", volumeLiters: 1.5, weightKg: 0.7, label: { en: "Camera", it: "Fotocamera" } },
  { id: "chargers", category: "electronics", volumeLiters: 0.3, weightKg: 0.2, label: { en: "Chargers", it: "Caricabatterie" } },
  { id: "power-bank", category: "electronics", volumeLiters: 0.25, weightKg: 0.3, label: { en: "Power bank", it: "Power bank" } },
  { id: "toiletries", category: "accessories", volumeLiters: 1.4, weightKg: 0.9, label: { en: "Toiletry bag", it: "Beauty case" } },
  { id: "documents", category: "accessories", volumeLiters: 0.15, weightKg: 0.1, label: { en: "Travel documents", it: "Documenti di viaggio" } },
  { id: "bottle", category: "accessories", volumeLiters: 0.8, weightKg: 0.25, label: { en: "Water bottle", it: "Borraccia" } },
  { id: "accessories", category: "accessories", volumeLiters: 0.6, weightKg: 0.3, label: { en: "Other accessories", it: "Altri accessori" } },
  { id: "hair-dryer", category: "electronics", volumeLiters: 1.5, weightKg: 0.55, suitcaseOnly: true, label: { en: "Hair dryer", it: "Phon" } },
  { id: "souvenirs", category: "accessories", volumeLiters: 3, weightKg: 1, suitcaseOnly: true, label: { en: "Room for souvenirs", it: "Spazio per souvenir" } },
];

/** Items offered in the backpack questionnaire. */
export const backpackItems = packingItems.filter((item) => !item.suitcaseOnly);

/* ------------------------------------------------------------------ trekking & mountain */

export type TrekType = "day-hike" | "hut-to-hut" | "camping";
export type TrekSeason = "summer" | "shoulder" | "winter";
export const trekTypes: TrekType[] = ["day-hike", "hut-to-hut", "camping"];
export const trekSeasons: TrekSeason[] = ["summer", "shoulder", "winter"];

/** Outdoor gear, offered only in the trekking questionnaire. Volumes are packed/compressed sizes. */
export const trekkingGear: PackingItemDefinition[] = [
  { id: "rain-shell", category: "outdoor", volumeLiters: 2, weightKg: 0.35, label: { en: "Waterproof jacket", it: "Giacca impermeabile" } },
  { id: "fleece", category: "outdoor", volumeLiters: 2.2, weightKg: 0.4, label: { en: "Fleece / mid layer", it: "Pile / strato intermedio" } },
  { id: "base-layer", category: "outdoor", volumeLiters: 0.6, weightKg: 0.18, label: { en: "Thermal base layer", it: "Maglia termica" } },
  { id: "hat-gloves", category: "outdoor", volumeLiters: 0.6, weightKg: 0.15, label: { en: "Beanie and gloves", it: "Berretto e guanti" } },
  { id: "sun-kit", category: "outdoor", volumeLiters: 0.6, weightKg: 0.2, label: { en: "Sun hat and sunscreen", it: "Cappello e crema solare" } },
  { id: "headlamp", category: "outdoor", volumeLiters: 0.2, weightKg: 0.1, label: { en: "Headlamp", it: "Lampada frontale" } },
  { id: "first-aid", category: "outdoor", volumeLiters: 0.7, weightKg: 0.3, label: { en: "First-aid kit", it: "Kit di primo soccorso" } },
  { id: "food", category: "outdoor", volumeLiters: 1.2, weightKg: 0.6, label: { en: "Food and snacks (per day)", it: "Cibo e snack (per giorno)" } },
  { id: "water", category: "outdoor", volumeLiters: 1.1, weightKg: 1.05, label: { en: "Water (1 liter)", it: "Acqua (1 litro)" } },
  { id: "hut-liner", category: "outdoor", volumeLiters: 0.8, weightKg: 0.2, label: { en: "Sleeping-bag liner (huts)", it: "Sacco lenzuolo (rifugio)" } },
  { id: "sleeping-bag", category: "outdoor", volumeLiters: 7, weightKg: 1, label: { en: "Sleeping bag", it: "Sacco a pelo" } },
  { id: "sleeping-mat", category: "outdoor", volumeLiters: 4, weightKg: 0.5, label: { en: "Sleeping mat", it: "Materassino" } },
  { id: "tent", category: "outdoor", volumeLiters: 5, weightKg: 1.5, label: { en: "Tent", it: "Tenda" } },
  { id: "stove", category: "outdoor", volumeLiters: 2, weightKg: 0.5, label: { en: "Stove and pot", it: "Fornello e pentolino" } },
];

/** Categories shown in the trekking list, gear first. */
export const trekkingCategories: Record<"outdoor" | "clothing" | "footwear" | "electronics" | "accessories", Record<Locale, string>> = {
  outdoor: { en: "Outdoor gear", it: "Attrezzatura outdoor" },
  clothing: { en: "Clothing", it: "Abbigliamento" },
  footwear: { en: "Footwear", it: "Calzature" },
  electronics: { en: "Electronics", it: "Elettronica" },
  accessories: { en: "Accessories", it: "Accessori" },
};

const trekkingBaseIds = ["t-shirt", "trousers", "shorts", "underwear", "socks", "sandals", "camera", "chargers", "power-bank", "toiletries", "documents", "accessories"];

/** Items offered in the trekking questionnaire: everyday basics that make sense on a trail, plus the gear. */
export const trekkingItems: PackingItemDefinition[] = [...packingItems.filter((item) => trekkingBaseIds.includes(item.id)), ...trekkingGear];

/**
 * A starting packing list for a trek. Day hikes carry layers, water and food; hut-to-hut adds a change
 * of clothes and a liner (meals are in the hut); camping adds shelter, sleep system, stove and meals.
 */
export function suggestedTrekking(days: number, type: TrekType, season: TrekSeason): Record<string, number> {
  const trekDays = type === "day-hike" ? 1 : Math.max(2, days);
  const overnight = type !== "day-hike";
  const cold = season !== "summer";
  const quantities: Record<string, number> = Object.fromEntries(trekkingItems.map((item) => [item.id, 0]));
  Object.assign(quantities, {
    "t-shirt": overnight ? Math.min(4, Math.ceil(trekDays / 2) + 1) : 1,
    trousers: overnight ? 1 : 0,
    shorts: overnight && season === "summer" ? 1 : 0,
    underwear: overnight ? Math.min(trekDays, 5) : 0,
    socks: overnight ? Math.min(trekDays, 4) : 1,
    "rain-shell": 1,
    fleece: 1,
    "base-layer": (overnight || cold ? 1 : 0) + (season === "winter" ? 1 : 0),
    "hat-gloves": cold || overnight ? 1 : 0,
    "sun-kit": season === "winter" ? 0 : 1,
    headlamp: 1,
    "first-aid": 1,
    food: type === "camping" ? Math.ceil(trekDays * 1.5) : trekDays,
    water: 2,
    "hut-liner": type === "hut-to-hut" ? 1 : 0,
    "sleeping-bag": type === "camping" ? 1 : 0,
    "sleeping-mat": type === "camping" ? 1 : 0,
    tent: type === "camping" ? 1 : 0,
    stove: type === "camping" ? 1 : 0,
    toiletries: overnight ? 1 : 0,
    chargers: overnight ? 1 : 0,
    "power-bank": 1,
    documents: 1,
    accessories: 1,
  });
  return quantities;
}

export function suggestedQuantity(itemId: string, days: number): number {
  const daysOfClothing = Math.min(days, 8);
  const suggestions: Record<string, number> = {
    "t-shirt": Math.max(1, daysOfClothing - 1),
    shirt: days >= 4 ? 1 : 0,
    sweater: days >= 5 ? 1 : 0,
    hoodie: 0,
    trousers: Math.max(1, Math.ceil(daysOfClothing / 3)),
    shorts: days >= 3 ? 1 : 0,
    underwear: daysOfClothing,
    socks: daysOfClothing,
    jacket: 1,
    sneakers: 1,
    "formal-shoes": 0,
    sandals: 0,
    boots: 0,
    laptop: 0,
    tablet: 0,
    camera: 0,
    chargers: 1,
    "power-bank": 1,
    toiletries: 1,
    documents: 1,
    bottle: 1,
    accessories: 1,
    "hair-dryer": 0,
    souvenirs: 0,
  };
  return suggestions[itemId] ?? 0;
}