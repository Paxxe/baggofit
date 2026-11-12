export type Locale = "en" | "it";
export type PackingCategory = "clothing" | "footwear" | "electronics" | "accessories";

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

export const packingCategories: Record<PackingCategory, Record<Locale, string>> = {
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