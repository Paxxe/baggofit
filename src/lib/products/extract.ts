import type { BackpackCategory } from "./provider";

/**
 * Reads the numbers that matter for a backpack recommendation (capacity, laptop size, outer size)
 * out of product text. Catalog data is written by many different merchants, so everything here is
 * best-effort and conservative: an ambiguous read returns nothing rather than a guess.
 */

/** One buyable capacity of a product (some sell 26 L / 30 L as variants). */
export interface CatalogOption {
  capacityLiters: number;
  variantId?: string;
  price: number;
}

/** Normalized, serializable backpack record used for matching. */
export interface CatalogBackpack {
  id: string;
  title: string;
  brand: string;
  url: string;
  imageUrl?: string;
  currency?: string;
  options: CatalogOption[];
  laptop: boolean;
  laptopInches?: number;
  dimensionsCm?: { height: number; width: number; depth: number };
  categories: BackpackCategory[];
  rating?: { value: number; count: number };
  emptyWeightKg?: number;
  capacityEstimated?: boolean;
}

const BAG_PATTERN = /\b(back ?packs?|day ?packs?|rucksacks?|travel packs?|rolltop|roll-top|commuter pack|zaino|zaini|rucksack|pack|sac à dos|sac a dos|mochilas?|rugzak|plecak|ryggsäck|reppu)\b/i;
const EXCLUDE_PATTERN = /\b(bundle|set|cubes?|pouch(es)?|inserts?|straps?|hip ?belt|rain ?cover|keychain|gift ?card|bottle|wallet|organi[sz]er|sling|fanny|waist ?pack|hip ?pack|belt ?bag|tote|duffel|duffle|crossbody|messenger|kit|sleeve|case|cover|toiletry|replacement|patch|carabiner|kids?|toddler|lunch|meal ?prep|cooler|diaper|nappy)\b|\+/i;

// A whole number (never the middle of one: "100 L" is not "10 L"), an optional range with an explicit
// separator ("28-35 L"), then the unit, also hyphenated ("23-Liter").
const LITER_IN_TEXT = /(?<![\d.,])(\d{1,3}(?:[.,]\d)?)(?:\s?(?:-|–|\/|to)\s?(\d{1,3}(?:[.,]\d)?))?\s?-?\s?(?:l|ltr|liters?|litres?|litri)\b/gi;
const CAPACITY_SENTENCE = /(?:capacity|volume|capacità|volumen|storage)[^.\d]{0,40}?(?<![\d.,])(\d{1,3}(?:[.,]\d)?)(?:\s?(?:-|–|to)\s?(\d{1,3}(?:[.,]\d)?))?\s?-?\s?(?:l|ltr|liters?|litres?|litri)\b/i;
/** Plausible capacities: from a small daypack to an extra-large checked suitcase. */
const MIN_LITERS = 5;
const MAX_LITERS = 160;

export function stripHtml(html: string | null | undefined) {
  return (html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;|&#8221;|&#8220;|&rdquo;|&ldquo;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const toNumber = (value: string) => Number(value.replace(",", "."));

/** All plausible capacities (5–160 L) mentioned in a short text such as a title. */
export function litersIn(text: string): number[] {
  const values: number[] = [];
  for (const match of text.matchAll(LITER_IN_TEXT)) {
    const low = toNumber(match[1]);
    const high = match[2] ? toNumber(match[2]) : undefined;
    for (const value of [low, high]) {
      if (value !== undefined && value >= MIN_LITERS && value <= MAX_LITERS) values.push(value);
    }
  }
  return [...new Set(values)];
}

/**
 * Capacity from free text: an explicit "capacity: 30L" sentence wins, otherwise the text must name
 * exactly one plausible volume (several different numbers are too ambiguous to use).
 */
export function capacityFromText(text: string): number | undefined {
  const sentence = text.match(CAPACITY_SENTENCE);
  if (sentence) {
    const value = toNumber(sentence[2] ?? sentence[1]);
    if (value >= MIN_LITERS && value <= MAX_LITERS) return value;
  }
  const values = litersIn(text);
  return values.length === 1 ? values[0] : undefined;
}

export function extractLaptop(text: string): { laptop: boolean; laptopInches?: number } {
  const laptop = /\b(laptops?|macbooks?|notebook computer|computer sleeve|laptop sleeve|tech compartment|pc portatile)\b/i.test(text);
  if (!laptop) return { laptop: false };
  const sizes: number[] = [];
  const patterns = [
    /(1[0-8](?:[.,]\d)?)\s?(?:"|”|''|-?\s?inch(?:es)?|in\b|pollici)/gi,
    /(?:laptops?|macbooks?)[^.]{0,40}?(1[0-8](?:[.,]\d)?)\s?(?:"|”|''|-?\s?inch(?:es)?|in\b)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      const nearby = text.slice(Math.max(0, index - 60), index + match[0].length + 60);
      if (/laptop|macbook|computer|notebook|screen/i.test(nearby)) sizes.push(toNumber(match[1]));
    }
  }
  return sizes.length ? { laptop: true, laptopInches: Math.max(...sizes) } : { laptop: true };
}

export function extractDimensionsCm(text: string): { height: number; width: number; depth: number } | undefined {
  // "51 cm (H) x 32 cm (W) x 20 cm (D)" → "51 cm x 32 cm x 20 cm"
  const cleaned = text.replace(/\(\s*[HWDLhwdl]\s*\)|\b[HWD]\s*:?(?=\s*\d)/g, " ");
  const number = String.raw`(\d{1,3}(?:[.,]\d{1,2})?)`;
  const sep = String.raw`\s*(?:cm|"|”|in)?\s*[x×*]\s*`;
  const triple = new RegExp(`${number}${sep}${number}${sep}${number}\\s*(cm|"|”|in(?:ches)?)`, "i");
  const match = cleaned.match(triple);
  if (!match) return labelledDimensionsCm(text);
  const factor = match[4].toLowerCase() === "cm" ? 1 : 2.54;
  const values = [match[1], match[2], match[3]].map((value) => Math.round(toNumber(value) * factor * 10) / 10).sort((a, b) => b - a);
  // Reject obviously wrong reads (a laptop, a bottle, a pocket).
  if (values[0] < 25 || values[0] > 90 || values[2] < 5) return undefined;
  return { height: values[0], width: values[1], depth: values[2] };
}

const LABELS = {
  height: "altezza|height|höhe|hauteur|alto|altura",
  width: "larghezza|width|breite|largeur|ancho|anchura",
  depth: "profondità|profondita|depth|tiefe|profondeur|fondo|profundidad|spessore",
};

/** "Altezza: 44 cm, Larghezza: 29,5 cm, Profondità: 22 cm" (and the same in EN/DE/FR/ES). */
export function labelledDimensionsCm(text: string): { height: number; width: number; depth: number } | undefined {
  const read = (labels: string) => {
    const match = text.match(new RegExp(`(?:${labels})\\s*[:=]?\\s*(\\d{1,3}(?:[.,]\\d{1,2})?)\\s*cm`, "i"));
    return match ? toNumber(match[1]) : undefined;
  };
  const height = read(LABELS.height);
  const width = read(LABELS.width);
  const depth = read(LABELS.depth);
  if (height === undefined || width === undefined || depth === undefined) return undefined;
  const values = [height, width, depth].sort((a, b) => b - a);
  if (values[0] < 25 || values[0] > 90 || values[2] < 5) return undefined;
  return { height: values[0], width: values[1], depth: values[2] };
}

/** Outer dimensions from spec lines, skipping internal/laptop/pocket measurements. */
export function dimensionsFromSpecs(lines: readonly string[]) {
  const outer = lines.filter((line) => !/internal|interior|inner|laptop|compartment|pocket|packed|folded|sleeve|tablet/i.test(line));
  for (const line of outer) {
    const dimensions = extractDimensionsCm(line);
    if (dimensions) return dimensions;
  }
  return undefined;
}

export function extractCategories(text: string): BackpackCategory[] {
  const categories = new Set<BackpackCategory>();
  if (/\b(travel|carry[- ]?on|cabin|weekender|one[- ]bag|flight|trip|airline)\b/i.test(text)) categories.add("travel");
  if (/\b(hik(e|ing)|trek(king)?|trail|outdoor|mountain|climb|camp)\b/i.test(text)) categories.add("hiking");
  if (/\b(laptop|work|office|commut(e|er|ing)|tech|business)\b/i.test(text)) categories.add("laptop");
  if (/\b(everyday|daily|city|urban|edc|school|campus|day ?pack)\b/i.test(text)) categories.add("everyday");
  return [...categories];
}

/**
 * Titles like "Travel / Hybrid 30L" don't say "backpack", so the opening of the description can
 * confirm it. Accessories and other bag types are excluded by title.
 */
export function looksLikeBackpack(title: string, description = "") {
  if (EXCLUDE_PATTERN.test(title)) return false;
  return BAG_PATTERN.test(title) || /\b(back ?pack|rucksack|zaino)\b/i.test(description.slice(0, 400));
}

/* ------------------------------------------------------------------ trolleys & suitcases */

const LUGGAGE_PATTERN = /\b(trolley|suitcases?|luggage|valigi[ae]|spinner|carry[- ]?on|cabin (?:bag|case|size)|hand luggage|koffer|maleta|trolleys?)\b/i;
const LUGGAGE_EXCLUDE = /\b(covers?|tags?|straps?|scales?|locks?|organi[sz]ers?|cubes?|set|sets|bundle|kids?|children|toddler|back ?packs?|rucksacks?|duffel|duffle|tote|toiletry|inserts?|replacement|wheels? kit|garment|pet|hanging|travel pillow|adapter)\b|\+|\b\d\s*(?:pcs?|pieces?|pezzi)\b|\b(?:2|3|4)[- ]piece/i;

/** Trolley/suitcase check; multi-piece sets and accessories are excluded. */
export function looksLikeLuggage(title: string, description = "") {
  if (LUGGAGE_EXCLUDE.test(title)) return false;
  // "40L Carry-On" backpacks: if the product talks about being a backpack, the title must
  // explicitly say trolley/suitcase (no word boundary, to catch compounds like "Kabinentrolley").
  const strongLuggage = /(trolley|suitcase|valigi[ae]|koffer|maleta|spinner|hardside|hard shell)/i.test(title);
  const backpackish = /\b(back ?packs?|rucksacks?|zain[oi]|daypacks?)\b/i.test(`${title} ${description.slice(0, 300)}`);
  if (backpackish && !strongLuggage) return false;
  return strongLuggage || LUGGAGE_PATTERN.test(title) || LUGGAGE_PATTERN.test(description.slice(0, 300));
}

/**
 * Empty weight from spec lines ("Weight: 1.7 kg", "Weight: 3.7 lbs"). Readings outside a plausible
 * range for a bag (0.5–8 kg) are treated as data errors and ignored.
 */
export function weightFromSpecs(lines: readonly string[]): number | undefined {
  for (const line of lines) {
    if (!/weight|peso/i.test(line) || /max(imum)?|load|capacity|portata/i.test(line)) continue;
    const kg = line.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
    const lbs = line.match(/(\d+(?:[.,]\d+)?)\s*(?:lbs?|pounds?)\b/i);
    const value = kg ? toNumber(kg[1]) : lbs ? toNumber(lbs[1]) / 2.2046 : undefined;
    if (value !== undefined && value >= 0.5 && value <= 8) return Math.round(value * 10) / 10;
  }
  return undefined;
}

/** Rough usable capacity from the outer size, used only when the maker states no liters (shown as "~"). */
export function capacityFromDimensions(dimensions: { height: number; width: number; depth: number }, kind: "luggage" | "backpack" = "luggage") {
  // Hard shells lose ~20% to the frame and lining; soft backpacks bulge and are usually rated close to their box size.
  const factor = kind === "luggage" ? 0.8 : 0.95;
  return Math.round(((dimensions.height * dimensions.width * dimensions.depth) / 1000) * factor);
}
