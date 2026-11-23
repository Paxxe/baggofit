import type { BackpackSearchCriteria } from "../products/provider";
import { estimateBackpackCapacity } from "../calculators/backpack-capacity";
import { airlines, getVerifiedPolicy } from "./airlines";
import { packingItems } from "./packing-items";
import { bagFit, cabinZeroModels, type BagFit } from "./cabinzero";

type Lang = "en" | "it";

/* ------------------------------------------------------------------ packing lists (same volumes as the planner) */

type Kit = [itemId: string, quantity: number][];

const liters = (value: number, language: Lang) =>
  `${(Math.round(value * 10) / 10).toLocaleString(language === "it" ? "it-IT" : "en-GB")} L`;

/** Packed volume and the planner's suggested range for a 3-day kit packed "minimalist". */
function kitEstimate(kit: Kit, tripDays: number) {
  const items = kit.map(([id, quantity]) => {
    const item = packingItems.find((entry) => entry.id === id);
    if (!item) throw new Error(`Unknown packing item ${id}`);
    return { item, quantity };
  });
  const estimate = estimateBackpackCapacity({
    tripDays,
    packingStyle: "minimalist",
    items: items.map(({ item, quantity }) => ({ name: item.id, quantity, volumeLiters: item.volumeLiters })),
  });
  return { items, estimate };
}

const kilos = (value: number, language: Lang) =>
  `${(Math.round(value * 10) / 10).toLocaleString(language === "it" ? "it-IT" : "en-GB")} kg`;

/** Total weight of a kit's contents (kg). */
const kitWeight = (kit: Kit) => kitEstimate(kit, 1).items.reduce((total, { item, quantity }) => total + item.weightKg * quantity, 0);

/** The planner's suggested capacity for a kit, e.g. "20–25 L". */
function kitRange(kit: Kit, tripDays: number) {
  const { min, max } = kitEstimate(kit, tripDays).estimate.suggestedCapacityRangeLiters;
  return `${min}–${max} L`;
}

/** Item / quantity / liters (and optionally weight) table, with the totals as the last row. */
function kitTable(kit: Kit, tripDays: number, language: Lang, withWeight = false) {
  const { items, estimate } = kitEstimate(kit, tripDays);
  const it = language === "it";
  return {
    head: [...(it ? ["Cosa", "Quanti", "Volume"] : ["Item", "How many", "Volume"]), ...(withWeight ? [it ? "Peso" : "Weight"] : [])],
    rows: [
      ...items.map(({ item, quantity }) => [
        item.label[language],
        String(quantity),
        liters(item.volumeLiters * quantity, language),
        ...(withWeight ? [kilos(item.weightKg * quantity, language)] : []),
      ]),
      [
        it ? "Totale nello zaino" : "Total in the bag",
        "",
        liters(estimate.estimatedPackedVolumeLiters, language),
        ...(withWeight ? [kilos(kitWeight(kit), language)] : []),
      ],
    ],
  };
}

/** Under-seat bag and cabin bag of one airline, from its verified rules. */
function airlineRulesTable(airlineId: string, language: Lang, cost: { personal: string; cabin: string }) {
  const rules = getVerifiedPolicy(airlineId)?.rules;
  const personal = rules?.["personal-item"];
  const cabin = rules?.["cabin-bag"];
  if (!personal || !cabin) throw new Error(`Missing verified rules for ${airlineId}`);
  const it = language === "it";
  return {
    head: it ? ["Bagaglio", "Misure massime", "Peso", "Costo"] : ["Bag", "Maximum size", "Weight", "Cost"],
    rows: [
      [it ? "Borsa sotto il sedile" : "Under-seat bag", sizeCell(personal, language), weightCell(personal.maxWeightKg, language), cost.personal],
      [it ? "Bagaglio in cappelliera" : "Overhead cabin bag", sizeCell(cabin, language), weightCell(cabin.maxWeightKg, language), cost.cabin],
    ],
  };
}

/** easyJet's bigger free bag (45×36×20) holds up to 5 days. */
const easyjetFiveDayKit: Kit = [
  ["t-shirt", 5], ["shorts", 1], ["trousers", 2], ["sweater", 1], ["underwear", 5], ["socks", 5], ["sandals", 1],
  ["toiletries", 1], ["chargers", 1], ["power-bank", 1], ["documents", 1], ["accessories", 1],
];
const easyjetLaptopKit: Kit = [...easyjetFiveDayKit.filter(([id]) => id !== "sandals"), ["laptop", 1]];

/** A week in a cabin trolley: the kit for the full-size carry-on guides (BA, ITA, Vueling). */
const cabinWeekKit: Kit = [
  ["t-shirt", 6], ["shirt", 1], ["shorts", 1], ["trousers", 2], ["sweater", 1], ["underwear", 7], ["socks", 7], ["sneakers", 1],
  ["toiletries", 1], ["chargers", 1], ["power-bank", 1], ["documents", 1], ["accessories", 1],
];

const ryanairSummerKit: Kit = [
  ["t-shirt", 3], ["shorts", 1], ["trousers", 1], ["sweater", 1], ["underwear", 3], ["socks", 3], ["sandals", 1],
  ["toiletries", 1], ["chargers", 1], ["power-bank", 1], ["documents", 1], ["accessories", 1],
];
const ryanairWinterKit: Kit = [
  ["t-shirt", 3], ["sweater", 2], ["trousers", 1], ["underwear", 3], ["socks", 3],
  ["toiletries", 1], ["chargers", 1], ["power-bank", 1], ["documents", 1], ["accessories", 1],
];
const ryanairWorkKit: Kit = [
  ["shirt", 2], ["t-shirt", 1], ["trousers", 1], ["underwear", 3], ["socks", 3], ["laptop", 1],
  ["toiletries", 1], ["chargers", 1], ["power-bank", 1], ["documents", 1],
];
const ryanairKits = {
  summer: ryanairSummerKit,
  winter: ryanairWinterKit,
  work: ryanairWorkKit,
  // The usual mistake: a second pair of sneakers and a hoodie "just in case".
  overpacked: [...ryanairSummerKit, ["sneakers", 1], ["hoodie", 1]] as Kit,
};

/** Packed liters and suggested range per kit, for the comparison table. */
function kitSummaryTable(language: Lang) {
  const names: Record<keyof typeof ryanairKits, Record<Lang, string>> = {
    summer: { it: "City break estiva", en: "Summer city break" },
    winter: { it: "City break invernale", en: "Winter city break" },
    work: { it: "Viaggio di lavoro con laptop", en: "Work trip with laptop" },
    overpacked: { it: "Estiva + sneakers e felpa in più", en: "Summer + extra sneakers and hoodie" },
  };
  return {
    head: language === "it" ? ["Viaggio di 3 giorni", "Volume degli oggetti", "Zaino consigliato", "Nel 40×30×20?"] : ["3-day trip", "Packed volume", "Suggested bag", "In 40×30×20?"],
    rows: (Object.keys(ryanairKits) as (keyof typeof ryanairKits)[]).map((key) => {
      const { estimate } = kitEstimate(ryanairKits[key], 3);
      const { min, max } = estimate.suggestedCapacityRangeLiters;
      const fits = max <= 20;
      return [
        names[key][language],
        liters(estimate.estimatedPackedVolumeLiters, language),
        `${min}–${max} L`,
        fits ? (language === "it" ? "Sì" : "Yes") : language === "it" ? "Al limite" : "Borderline",
      ];
    }),
  };
}

/* ------------------------------------------------------------------ CabinZero sizes vs airlines (verified rules) */

const fitLabel: Record<BagFit, Record<Lang, string>> = {
  "under-seat": { it: "Sotto il sedile", en: "Under the seat" },
  overhead: { it: "In cappelliera", en: "Overhead bin" },
  "too-big": { it: "Troppo grande", en: "Too big" },
  unknown: { it: "—", en: "—" },
};

function cabinZeroAirlineTable(language: Lang) {
  return {
    head: [language === "it" ? "Compagnia" : "Airline", ...cabinZeroModels.map((model) => `${model.liters} L`)],
    rows: airlines.filter((airline) => getVerifiedPolicy(airline.id)).map((airline) => [airline.name, ...cabinZeroModels.map((model) => fitLabel[bagFit(model.size, airline.id)][language])]),
  };
}

function cabinZeroModelTable(language: Lang) {
  const it = language === "it";
  const number = (value: number) => value.toLocaleString(it ? "it-IT" : "en-GB");
  return {
    head: it ? ["Modello", "Misure esterne", "Peso a vuoto", "Volume del parallelepipedo"] : ["Model", "Outer size", "Empty weight", "Box volume"],
    rows: cabinZeroModels.map((model) => [
      `Classic ${model.liters} L`,
      `${number(model.size[0])} × ${number(model.size[1])} × ${model.size[2]} cm`,
      `${number(model.weightG / 1000)} kg`,
      liters((model.size[0] * model.size[1] * model.size[2]) / 1000, language),
    ]),
  };
}

const cz28Box = liters((39 * 29.5 * 20) / 1000, "it");
const cz28BoxEn = liters((39 * 29.5 * 20) / 1000, "en");

/* ------------------------------------------------------------------ Christmas with hand luggage only */

/** 4 days with family in the free under-seat bag: coat, boots and the thick sweater are worn on the plane. */
const christmasFreeBagKit: Kit = [
  ["t-shirt", 3], ["sweater", 1], ["trousers", 1], ["underwear", 4], ["socks", 4],
  ["toiletries", 1], ["chargers", 1], ["power-bank", 1], ["documents", 1], ["accessories", 1],
];
/** 5 days including the Christmas dinner outfit, in a 55×40×20 cabin trolley. */
const christmasCabinKit: Kit = [
  ["t-shirt", 4], ["shirt", 1], ["sweater", 2], ["trousers", 2], ["underwear", 5], ["socks", 5], ["formal-shoes", 1],
  ["toiletries", 1], ["chargers", 1], ["power-bank", 1], ["documents", 1], ["accessories", 1],
];
/** Worn on the plane instead of packed (shown in the "winter-wear" illustration). */
export const christmasWornItems = ["jacket", "boots", "sweater"] as const;
const christmasPackedCoatKit: Kit = [...christmasFreeBagKit, ["jacket", 1], ["boots", 1]];

/** Usable liters assumed per bag: the low end of the ranges used in the other guides (18–20 L and 30–35 L). */
const FREE_BAG_LITERS = 18;
const CABIN_TROLLEY_LITERS = 30;
/** Empty weight of a typical hard-shell cabin trolley (the guides quote 2.5–3.5 kg). */
const TROLLEY_EMPTY_KG = 3;
const ryanairCabinKg = getVerifiedPolicy("ryanair")?.rules["cabin-bag"]?.maxWeightKg ?? 10;

/** Space the planner asks for: items + per-day buffer + minimalist margin. */
const neededLiters = (kit: Kit, days: number) => kitEstimate(kit, days).estimate.recommendedUsableCapacityLiters;
const roomLeft = (kit: Kit, days: number, capacity: number) => Math.round((capacity - neededLiters(kit, days)) * 10) / 10;
const christmasGiftRoom = roomLeft(christmasFreeBagKit, 4, FREE_BAG_LITERS);
const christmasTrolleyRoom = roomLeft(christmasCabinKit, 5, CABIN_TROLLEY_LITERS);
const christmasCabinKg = kitWeight(christmasCabinKit);
const christmasGiftKg = Math.round((ryanairCabinKg - TROLLEY_EMPTY_KG - christmasCabinKg) * 10) / 10;
const christmasWornLiters = christmasWornItems.reduce((total, id) => total + (packingItems.find((item) => item.id === id)?.volumeLiters ?? 0), 0);

function christmasScenarioTable(language: Lang) {
  const it = language === "it";
  const freeBag = it ? `Borsa gratuita (~${FREE_BAG_LITERS} L)` : `Free bag (~${FREE_BAG_LITERS} L)`;
  const trolley = it ? `Trolley 55×40×20 (~${CABIN_TROLLEY_LITERS} L)` : `55×40×20 trolley (~${CABIN_TROLLEY_LITERS} L)`;
  const scenarios: [Record<Lang, string>, string, Kit, number, number][] = [
    [{ it: "4 giorni, cappotto e stivali addosso", en: "4 days, coat and boots worn" }, freeBag, christmasFreeBagKit, 4, FREE_BAG_LITERS],
    [{ it: "4 giorni, cappotto e stivali nello zaino", en: "4 days, coat and boots packed" }, freeBag, christmasPackedCoatKit, 4, FREE_BAG_LITERS],
    [{ it: "5 giorni con la cena di Natale", en: "5 days with Christmas dinner" }, freeBag, christmasCabinKit, 5, FREE_BAG_LITERS],
    [{ it: "5 giorni con la cena di Natale", en: "5 days with Christmas dinner" }, trolley, christmasCabinKit, 5, CABIN_TROLLEY_LITERS],
  ];
  return {
    head: it ? ["Viaggio", "Bagaglio", "Spazio che serve", "Spazio per i regali"] : ["Trip", "Bag", "Space needed", "Room for gifts"],
    rows: scenarios.map(([name, bag, kit, days, capacity]) => {
      const left = roomLeft(kit, days, capacity);
      return [
        name[language],
        bag,
        liters(neededLiters(kit, days), language),
        left > 0 ? `${it ? "circa" : "about"} ${liters(left, language)}` : it ? `Non ci sta (mancano ${liters(-left, language)})` : `Doesn't fit (${liters(-left, language)} short)`,
      ];
    }),
  };
}

export type ChristmasLayer = { key: "clothes" | "electronics" | "toiletries" | "margin" | "gifts"; liters: number };

/** How the free bag fills up for the 4-day Christmas kit, bottom to top (for the "christmas-fill" illustration). */
export function christmasFreeBagLayers(): { capacity: number; layers: ChristmasLayer[] } {
  const { items, estimate } = kitEstimate(christmasFreeBagKit, 4);
  const sum = (test: (id: string, category: string) => boolean) =>
    items.filter(({ item }) => test(item.id, item.category)).reduce((total, { item, quantity }) => total + item.volumeLiters * quantity, 0);
  const clothes = sum((_, category) => ["clothing", "footwear"].includes(category));
  const toiletries = sum((id) => id === "toiletries");
  const electronics = estimate.estimatedPackedVolumeLiters - clothes - toiletries;
  return {
    capacity: FREE_BAG_LITERS,
    layers: [
      { key: "clothes", liters: clothes },
      { key: "electronics", liters: electronics },
      { key: "toiletries", liters: toiletries },
      { key: "margin", liters: estimate.recommendedUsableCapacityLiters - estimate.estimatedPackedVolumeLiters },
      { key: "gifts", liters: christmasGiftRoom },
    ],
  };
}

/* ------------------------------------------------------------------ cabin size table (from verified rules) */

/** Airlines with a verified rule of this type, in the airlines list order. */
function verifiedRules(type: "personal-item" | "cabin-bag") {
  return airlines.flatMap((airline) => {
    const rule = getVerifiedPolicy(airline.id)?.rules[type];
    return rule ? [{ airline, rule }] : [];
  });
}

const sizeCell = (rule: { maxHeightCm: number | null; maxWidthCm: number | null; maxDepthCm: number | null }, language: Lang) =>
  rule.maxHeightCm && rule.maxWidthCm && rule.maxDepthCm ? `${rule.maxHeightCm} × ${rule.maxWidthCm} × ${rule.maxDepthCm} cm` : language === "it" ? "Non indicate" : "Not stated";
const weightCell = (kg: number | null, language: Lang) => (kg ? `${kg} kg` : language === "it" ? "Non indicato" : "Not stated");

/** Whether the overhead cabin bag comes with the ticket. Editorial summary of each verified rule's fare conditions. */
const cabinBagIncluded: Record<string, Record<Lang, string>> = {
  ryanair: { it: "No, a pagamento", en: "No, paid" },
  easyjet: { it: "No, a pagamento (incluso con easyJet Plus)", en: "No, paid (included with easyJet Plus)" },
  "wizz-air": { it: "No, con WIZZ Priority", en: "No, with WIZZ Priority" },
  vueling: { it: "No, a pagamento", en: "No, paid" },
  "ita-airways": { it: "Dipende dalla tariffa", en: "Depends on the fare" },
  lufthansa: { it: "Sì, tranne Economy Basic", en: "Yes, except Economy Basic" },
  "british-airways": { it: "Sì", en: "Yes" },
  "air-france": { it: "Dipende dalla tariffa", en: "Depends on the fare" },
  klm: { it: "Sì, tranne Economy Basic", en: "Yes, except Economy Basic" },
  delta: { it: "Sì, sui voli Delta", en: "Yes, on Delta flights" },
  "american-airlines": { it: "Sì", en: "Yes" },
};

function personalItemTable(language: Lang) {
  return {
    head: language === "it" ? ["Compagnia", "Borsa sotto il sedile", "Peso massimo"] : ["Airline", "Under-seat bag", "Max weight"],
    rows: verifiedRules("personal-item").map(({ airline, rule }) => [airline.name, sizeCell(rule, language), weightCell(rule.maxWeightKg, language)]),
  };
}

function cabinBagTable(language: Lang) {
  return {
    head: language === "it" ? ["Compagnia", "Bagaglio in cappelliera", "Peso massimo", "Incluso nel biglietto?"] : ["Airline", "Overhead cabin bag", "Max weight", "Included in the ticket?"],
    rows: verifiedRules("cabin-bag").map(({ airline, rule }) => [airline.name, sizeCell(rule, language), weightCell(rule.maxWeightKg, language), cabinBagIncluded[airline.id]?.[language] ?? "—"]),
  };
}

/** The largest bag that fits every verified limit of this type (smallest height, width and depth). */
function universalSize(type: "personal-item" | "cabin-bag") {
  const sized = verifiedRules(type).map(({ rule }) => rule).filter((rule) => rule.maxHeightCm && rule.maxWidthCm && rule.maxDepthCm);
  return {
    height: Math.min(...sized.map((rule) => rule.maxHeightCm!)),
    width: Math.min(...sized.map((rule) => rule.maxWidthCm!)),
    depth: Math.min(...sized.map((rule) => rule.maxDepthCm!)),
  };
}
const formatSize = (size: { height: number; width: number; depth: number }) => `${size.height} × ${size.width} × ${size.depth} cm`;
const universalCabin = universalSize("cabin-bag");
const universalPersonal = universalSize("personal-item");
const airlineCount = airlines.filter((airline) => getVerifiedPolicy(airline.id)).length;

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
  /** Simple comparison table. */
  table?: { head: string[]; rows: string[][] };
  /** Highlighted practical tip. */
  tip?: string;
  /** Insert the live product picks right after this section. */
  productPicks?: boolean;
  /** Cartoon figure shown after the section text (see components/guide-illustration). */
  illustration?: GuideIllustrationId;
}

export type GuideIllustrationId = "sizer-40x30x20" | "packed-depth" | "cabinzero-sizes" | "christmas-fill" | "winter-wear";

export interface TravelGuide {
  slug: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  /** ISO dates; "updated" is shown to readers (baggage rules and prices change). */
  published?: string;
  updated?: string;
  category?: Record<Lang, string>;
  sections: Record<Lang, GuideSection[]>;
  faq?: Record<Lang, { question: string; answer: string }[]>;
  /** Live products from the Shopify catalog matching these criteria. */
  products?: { heading: Record<Lang, string>; intro: Record<Lang, string>; criteria: BackpackSearchCriteria };
  /** Call to action towards one of the planners. */
  cta?: { label: Record<Lang, string>; text: Record<Lang, string>; href: "/backpack-configurator" | "/backpack-configurator?mode=trekking" | "/luggage-configurator" };
}

export const guides: TravelGuide[] = [
  {
    slug: "how-to-measure-a-backpack",
    published: "2026-11-04",
    updated: "2026-11-04",
    title: { en: "How to measure a backpack for travel", it: "Come misurare uno zaino da viaggio" },
    description: { en: "Measure a packed backpack accurately and compare the external dimensions with your baggage allowance.", it: "Misura correttamente uno zaino pieno e confronta le dimensioni esterne con la franchigia." },
    sections: {
      en: [
        { heading: "Measure the outside, packed", paragraphs: ["Pack the bag as you intend to travel. Measure its tallest, widest, and deepest points, including bulging pockets, handles, and fixed straps. Soft bags can change shape when full, so an empty-bag measurement may be misleading."] },
        { heading: "Check the booking, not a rule of thumb", paragraphs: ["Look up the baggage allowance attached to your fare and route on the airline's official site. Personal items, cabin bags, and checked bags are different categories, and the rules may change."] },
        { heading: "Compare each dimension", paragraphs: ["Do not rely on liters alone. A bag can have a small volume and still exceed a depth or height limit. Compare all three external dimensions and check whether the airline permits different orientations."] },
      ],
      it: [
        { heading: "Misura l'esterno con lo zaino pieno", paragraphs: ["Riempi lo zaino come per il viaggio. Misura i punti più alti, larghi e profondi, incluse tasche sporgenti, maniglie e cinghie fisse. Uno zaino morbido cambia forma quando è pieno."] },
        { heading: "Controlla la prenotazione, non una regola generica", paragraphs: ["Verifica sul sito ufficiale la franchigia associata a tariffa e tratta. Oggetto personale, bagaglio a mano e bagaglio da stiva sono categorie diverse e le regole possono cambiare."] },
        { heading: "Confronta ogni dimensione", paragraphs: ["I litri non bastano: uno zaino può avere un volume ridotto ma superare i limiti di altezza o profondità. Confronta tutte e tre le misure esterne e controlla le orientazioni consentite."] },
      ],
    },
  },
  {
    slug: "usable-capacity-vs-external-volume",
    published: "2026-11-07",
    updated: "2026-11-07",
    title: { en: "Usable capacity vs. external volume", it: "Capienza utile e volume esterno" },
    description: { en: "Understand why a backpack's advertised liters do not translate directly to its external dimensions or usable space.", it: "Scopri perché i litri dichiarati non corrispondono direttamente alle dimensioni esterne o allo spazio utile." },
    sections: {
      en: [
        { heading: "Three measurements, three meanings", paragraphs: ["External dimensions describe a bag's height, width, and depth. Multiplying them gives the volume of its bounding box, not the usable interior. Advertised capacity is usually an approximation of internal volume, measured differently across manufacturers."] },
        { heading: "Construction changes what fits", paragraphs: ["Curved panels, padding, dividers, laptop sleeves, and pockets all take space. Two bags with the same advertised liters can carry differently shaped loads."] },
        { heading: "Use estimates as a starting point", paragraphs: ["A packing list can help you compare sizes, but it cannot replace a physical test or an airline dimension check. Allow room for awkward shapes and check the manufacturer's measurements."] },
      ],
      it: [
        { heading: "Tre misure, tre significati", paragraphs: ["Le dimensioni esterne descrivono altezza, larghezza e profondità. Moltiplicandole ottieni il volume del parallelepipedo esterno, non quello interno utile. La capienza dichiarata è un'approssimazione misurata in modo diverso dai produttori."] },
        { heading: "La struttura cambia cosa entra", paragraphs: ["Pannelli curvi, imbottiture, divisori, scomparti per laptop e tasche occupano spazio. Due zaini con gli stessi litri dichiarati possono contenere oggetti diversi."] },
        { heading: "Usa la stima come punto di partenza", paragraphs: ["Una lista aiuta a confrontare le taglie, ma non sostituisce una prova pratica o il controllo delle misure richieste dalla compagnia. Considera gli oggetti ingombranti e verifica le misure del produttore."] },
      ],
    },
  },
  {
    slug: "best-office-backpacks",
    published: "2026-11-12",
    updated: "2026-11-12",
    category: { en: "Buying guide", it: "Guida all'acquisto" },
    title: {
      en: "The best office backpacks: how to choose one (and models that fit)",
      it: "I migliori zaini da ufficio: come sceglierli (e i modelli giusti)",
    },
    description: {
      en: "Capacity, laptop sleeve, weight and materials: what really matters in a work backpack, with a liters-by-routine table and real models that match.",
      it: "Litri, scomparto laptop, peso e materiali: cosa conta davvero in uno zaino da lavoro, con una tabella dei litri per ogni routine e modelli reali che corrispondono.",
    },
    sections: {
      it: [
        {
          heading: "Cosa rende davvero buono uno zaino da ufficio",
          paragraphs: [
            "Uno zaino da lavoro lo porti tutti i giorni, spesso per anni: i difetti piccoli diventano fastidi enormi. Una cinghia che sega la spalla, il laptop che sbatte sul fondo a ogni gradino, le chiavi che spariscono in un unico grande vano.",
            "Prima dell'estetica, contano poche cose concrete:",
          ],
          list: [
            "Scomparto laptop imbottito e sospeso: il computer non deve toccare il fondo quando appoggi lo zaino a terra.",
            "Tasca ad accesso rapido per badge, chiavi, cuffie e abbonamento, raggiungibile senza aprire il vano principale.",
            "Spallacci imbottiti e schienale traspirante: dopo 30 minuti di metro fanno tutta la differenza.",
            "Peso a vuoto contenuto: sotto 1,2 kg per uno zaino da 20 L è un buon valore.",
            "Apertura ampia (meglio se a libro): utile ai controlli in aeroporto se lo usi anche in trasferta.",
          ],
        },
        {
          heading: "Quanti litri ti servono davvero",
          paragraphs: [
            "L'errore più comune è prendere uno zaino troppo grande “per sicurezza”: si riempie di cose inutili, diventa pesante e sporge sul treno. La capienza giusta dipende da cosa porti ogni giorno, non dal lavoro che fai.",
          ],
          table: {
            head: ["La tua routine", "Litri consigliati", "Cosa ci sta"],
            rows: [
              ["Solo laptop e caricatore", "12–16 L", "Laptop fino a 14”, caricatore, documenti, cuffie"],
              ["Laptop, pranzo e borraccia", "18–22 L", "Più schiscetta, borraccia, giacca leggera"],
              ["Ufficio + palestra", "24–30 L", "Più scarpe e cambio, in uno scomparto separato"],
              ["Trasferta di 1–2 notti", "28–35 L", "Più cambi, beauty e una camicia di ricambio"],
            ],
          },
          tip: "Se lo usi anche come bagaglio a mano gratuito: la borsa sotto il sedile Ryanair (40×30×20 cm) contiene circa 20 L, quella easyJet (45×36×20 cm) circa 27 L. Uno zaino da ufficio da 18–20 L è spesso perfetto per entrambe.",
        },
        {
          heading: "Laptop: misura lo scomparto, non la diagonale",
          paragraphs: [
            "“Fino a 15 pollici” è un'indicazione, non una garanzia: un MacBook Pro da 16” e un portatile da gaming da 15,6” hanno ingombri molto diversi. Controlla le misure interne dello scomparto (altezza × larghezza) e confrontale con quelle del tuo computer, aggiungendo un centimetro per la custodia.",
            "Se cambi spesso computer, scegli uno scomparto un po' più grande con una fascia di fissaggio: tiene fermo anche un laptop più piccolo.",
          ],
        },
        {
          heading: "Materiali: cosa scegliere e perché",
          paragraphs: ["Il materiale decide quanto dura lo zaino, quanto pesa e come invecchia. Non esiste il migliore in assoluto: dipende da come lo usi."],
          table: {
            head: ["Materiale", "Punti forti", "Attenzione a"],
            rows: [
              ["Nylon balistico / Cordura", "Resistentissimo a graffi e strappi, leggero", "Aspetto più tecnico"],
              ["Poliestere riciclato", "Leggero, economico, spesso idrorepellente", "Qualità molto variabile tra marchi"],
              ["Tela cerata", "Look classico, resiste alla pioggia, invecchia bene", "Più pesante, va ricerata ogni tanto"],
              ["Pelle", "Elegante, adatta a contesti formali", "Pesante e costosa, teme l'acqua"],
            ],
          },
          tip: "Guarda anche cerniere e fibbie: una zip robusta (spesso YKK) e fibbie in metallo o in plastica rinforzata contano quanto il tessuto.",
        },
        {
          heading: "Lo stile giusto in ufficio è sobrio",
          paragraphs: [
            "Profilo sottile, colori neutri (nero, blu scuro, grigio, oliva) e loghi discreti: uno zaino così sta bene sia con il completo che il venerdì in jeans. Evita gli zaini molto profondi o pieni di cinghie esterne: sembrano da trekking e si impigliano ovunque.",
          ],
        },
        {
          heading: "Come valutarne la qualità prima di comprare",
          paragraphs: ["Che tu lo veda in negozio o online, questi controlli richiedono un minuto e ti evitano un acquisto sbagliato:"],
          list: [
            "Spallacci: devono essere imbottiti e cuciti con rinforzi a X o a riquadro nel punto in cui si attaccano allo zaino.",
            "Fondo: rinforzato o in materiale più spesso, perché è la parte che si consuma prima.",
            "Fodera: chiara se possibile, così trovi le cose; scura nasconde tutto.",
            "Maniglia superiore: robusta, la userai più degli spallacci tra ufficio e treno.",
            "Peso a vuoto e misure esterne: se il produttore non le indica, è un cattivo segno.",
          ],
          productPicks: true,
        },
        {
          heading: "Lo zaino giusto è quello che ti somiglia",
          paragraphs: [
            "Non serve lo zaino con più tasche, ma quello che segue la tua giornata: quanto cammini, cosa porti, se dopo il lavoro vai in palestra o in aeroporto. Parti dai litri che ti servono davvero, controlla lo scomparto laptop e scegli un materiale adatto al tuo meteo: il resto è gusto personale.",
          ],
        },
      ],
      en: [
        {
          heading: "What actually makes a good office backpack",
          paragraphs: [
            "You carry a work backpack every day, often for years, so small flaws turn into daily annoyances: a strap digging into your shoulder, a laptop thumping the floor on every step, keys lost in one big compartment.",
            "Before looks, a few concrete things matter:",
          ],
          list: [
            "A padded, suspended laptop sleeve: the computer shouldn't touch the floor when you put the bag down.",
            "A quick-access pocket for badge, keys, earbuds and travel card, reachable without opening the main compartment.",
            "Padded straps and a breathable back panel: after 30 minutes on the train they make all the difference.",
            "Low empty weight: under 1.2 kg for a 20 L backpack is a good figure.",
            "A wide opening (ideally clamshell): handy at airport security if you also travel with it.",
          ],
        },
        {
          heading: "How many liters you really need",
          paragraphs: [
            "The most common mistake is buying a bag that is too big “just in case”: it fills up with clutter, gets heavy and sticks out on the train. The right capacity depends on what you carry every day, not on your job.",
          ],
          table: {
            head: ["Your routine", "Suggested liters", "What fits"],
            rows: [
              ["Laptop and charger only", "12–16 L", "Laptop up to 14”, charger, documents, earbuds"],
              ["Laptop, lunch and bottle", "18–22 L", "Plus lunch box, bottle, light jacket"],
              ["Office + gym", "24–30 L", "Plus shoes and a change, in a separate compartment"],
              ["1–2 night business trip", "28–35 L", "Plus changes of clothes, toiletries and a spare shirt"],
            ],
          },
          tip: "If you also use it as a free cabin bag: Ryanair's under-seat bag (40×30×20 cm) holds about 20 L, easyJet's (45×36×20 cm) about 27 L. An 18–20 L office backpack often works for both.",
        },
        {
          heading: "Laptops: measure the sleeve, not the screen",
          paragraphs: [
            "“Fits up to 15 inches” is a hint, not a guarantee: a 16” MacBook Pro and a 15.6” gaming laptop have very different footprints. Check the sleeve's inner size (height × width) against your computer and add a centimeter for a case.",
            "If you change computers often, pick a slightly larger sleeve with a retaining strap: it keeps a smaller laptop in place too.",
          ],
        },
        {
          heading: "Materials: what to choose and why",
          paragraphs: ["The material decides how long the bag lasts, how much it weighs and how it ages. There's no single best one: it depends on how you use it."],
          table: {
            head: ["Material", "Strengths", "Watch out for"],
            rows: [
              ["Ballistic nylon / Cordura", "Very abrasion- and tear-resistant, light", "More technical look"],
              ["Recycled polyester", "Light, affordable, often water-repellent", "Quality varies a lot between brands"],
              ["Waxed canvas", "Classic look, shrugs off rain, ages well", "Heavier, needs re-waxing now and then"],
              ["Leather", "Elegant, suits formal settings", "Heavy and pricey, dislikes water"],
            ],
          },
          tip: "Check zips and buckles too: a sturdy zip (often YKK) and metal or reinforced buckles matter as much as the fabric.",
        },
        {
          heading: "The right office style is understated",
          paragraphs: [
            "A slim profile, neutral colors (black, navy, grey, olive) and discreet logos: a bag like that works with a suit and with Friday jeans. Avoid very deep bags covered in external straps: they look like hiking gear and snag on everything.",
          ],
        },
        {
          heading: "How to judge quality before you buy",
          paragraphs: ["In a shop or online, these checks take a minute and save you from a bad buy:"],
          list: [
            "Straps: padded, and stitched with X or box reinforcement where they meet the bag.",
            "Base: reinforced or made of thicker material, since it wears out first.",
            "Lining: light-colored if possible, so you can find things; dark linings hide everything.",
            "Top handle: sturdy, you'll use it more than the straps between office and train.",
            "Empty weight and outer size: if the maker doesn't state them, that's a bad sign.",
          ],
          productPicks: true,
        },
        {
          heading: "The right backpack fits your day",
          paragraphs: [
            "You don't need the bag with the most pockets, but the one that follows your day: how far you walk, what you carry, whether you head to the gym or the airport after work. Start from the liters you really need, check the laptop sleeve and pick a material for your weather. The rest is taste.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Office backpacks that match", it: "Zaini da ufficio che corrispondono" },
      intro: {
        en: "18–24 L backpacks with a laptop sleeve for 15”, from brands' official stores. Use the filters to narrow by price or brand.",
        it: "Zaini da 18–24 L con scomparto per laptop da 15”, dai negozi ufficiali dei brand. Usa i filtri per restringere per prezzo o marca.",
      },
      criteria: { productKind: "backpack", backpackType: "laptop", capacityRangeLiters: { min: 18, max: 24 }, laptopRequired: true, laptopInches: 15 },
    },
    faq: {
      it: [
        { question: "Meglio uno zaino o una borsa porta pc per l'ufficio?", answer: "Se cammini o usi i mezzi più di 10–15 minuti al giorno, lo zaino: distribuisce il peso su entrambe le spalle. La borsa a tracolla va bene per tragitti brevi in auto o per contesti molto formali." },
        { question: "Quanto spendere per un buono zaino da ufficio?", answer: "Tra 80 e 150 € trovi zaini ben costruiti con materiali durevoli e uno scomparto laptop protetto. Sotto i 50 € conviene controllare bene cerniere e cuciture; sopra i 200 € paghi soprattutto materiali premium e design." },
        { question: "Lo zaino da ufficio deve essere impermeabile?", answer: "Basta che sia idrorepellente, con cerniere protette: ti salva da pioggia e caffè rovesciato. L'impermeabilità totale serve solo se vai in bici con qualsiasi tempo." },
        { question: "Posso usarlo come bagaglio a mano sui voli low cost?", answer: "Sì, se rientra nelle misure: 40×30×20 cm per la borsa gratuita Ryanair, 45×36×20 cm per easyJet. Controlla le misure esterne dello zaino pieno e verifica sempre la tua tariffa." },
        { question: "Che scomparto serve per un laptop da 16 pollici?", answer: "Cerca uno scomparto da almeno 16” e confronta le misure interne con quelle del computer: un 16” moderno misura circa 36×25 cm. Se lo zaino indica solo “fino a 15,6””, probabilmente è troppo stretto." },
        { question: "Come si pulisce uno zaino da ufficio?", answer: "Svuotalo, spazzola via la polvere e lava a mano le macchie con acqua tiepida e sapone neutro. Evita la lavatrice: rovina imbottiture e rivestimenti idrorepellenti. Lascialo asciugare aperto, lontano da fonti di calore." },
      ],
      en: [
        { question: "Backpack or laptop bag for the office?", answer: "If you walk or take public transport for more than 10–15 minutes a day, a backpack: it spreads the weight over both shoulders. A shoulder bag is fine for short car commutes or very formal settings." },
        { question: "How much should a good office backpack cost?", answer: "Between €80 and €150 you'll find well-made bags with durable materials and a protected laptop sleeve. Under €50, check zips and seams carefully; over €200 you mostly pay for premium materials and design." },
        { question: "Does an office backpack need to be waterproof?", answer: "Water-repellent with covered zips is enough to survive rain and spilled coffee. Full waterproofing only matters if you cycle in any weather." },
        { question: "Can I use it as cabin baggage on low-cost flights?", answer: "Yes, if it fits: 40×30×20 cm for Ryanair's free bag, 45×36×20 cm for easyJet. Check the packed outer size and always confirm your fare." },
        { question: "What sleeve do I need for a 16-inch laptop?", answer: "Look for a sleeve of at least 16” and compare its inner size with your computer: a modern 16” is about 36×25 cm. If the bag only says “up to 15.6””, it's probably too tight." },
        { question: "How do I clean an office backpack?", answer: "Empty it, brush off dust and hand-wash stains with lukewarm water and mild soap. Avoid the washing machine: it ruins padding and water-repellent coatings. Let it dry open, away from heat." },
      ],
    },
    cta: {
      label: { en: "Find your capacity", it: "Calcola la tua misura" },
      text: { en: "Tell us what you carry every day and get the right capacity in a minute.", it: "Dicci cosa porti ogni giorno e scopri in un minuto la capienza giusta." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "ryanair-backpack-40x30x20",
    published: "2026-11-11",
    updated: "2026-11-11",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "Ryanair backpack 40×30×20: how to choose one that fits the free bag",
      it: "Zaino 40×30×20 per Ryanair: come sceglierlo per la borsa gratuita",
    },
    description: {
      en: "Official Ryanair sizes, how many liters really fit in 40×30×20 cm, what to look for in a backpack and what to pack for 2–3 nights without paying for a cabin bag.",
      it: "Le misure ufficiali Ryanair, quanti litri entrano davvero in 40×30×20 cm, cosa guardare in uno zaino e cosa portare per 2–3 notti senza pagare il bagaglio a mano.",
    },
    sections: {
      it: [
        {
          heading: "Le misure ufficiali: cosa è gratis e cosa no",
          paragraphs: [
            "Con Ryanair ogni tariffa include una sola borsa piccola da mettere sotto il sedile davanti. È lì che entra in gioco lo zaino: se rientra nelle misure, viaggi senza pagare il bagaglio a mano.",
            "Ecco le regole dalla pagina ufficiale Ryanair, verificate da noi l'11 novembre 2026:",
          ],
          table: {
            head: ["Bagaglio", "Misure massime", "Peso", "Costo"],
            rows: [
              ["Borsa piccola sotto il sedile", "40 × 30 × 20 cm", "Non indicato", "Inclusa in tutte le tariffe"],
              ["Bagaglio a mano in cappelliera", "55 × 40 × 20 cm", "10 kg", "A pagamento (Priorità e 2 bagagli a mano)"],
            ],
          },
          tip: "Le regole possono cambiare e dipendono dalla tariffa: prima di partire controlla sempre la tua prenotazione sul sito Ryanair.",
        },
        {
          heading: "Quanti litri entrano davvero in 40×30×20",
          paragraphs: [
            "40 × 30 × 20 cm fanno 24 litri, ma è il volume di una scatola. Uno zaino ha angoli arrotondati, imbottiture e tasche: lo spazio utile reale è di circa 18–20 litri.",
            "Per questo il numero da cercare non è “24 L”, ma uno zaino dichiarato tra 16 e 20 litri con misure esterne entro 40 × 30 × 20 cm. I litri da soli non bastano: uno zaino da 18 L alto 45 cm non passa.",
          ],
          table: {
            head: ["Capienza dichiarata", "Quanto ci sta", "Per Ryanair"],
            rows: [
              ["Fino a 15 L", "Un giorno, o un weekend molto essenziale", "Entra facilmente, anche pieno"],
              ["16–20 L", "2–3 notti con abiti leggeri", "La scelta ideale, se le misure esterne rientrano"],
              ["21–24 L", "3–4 notti", "Al limite: entra solo se è squadrato e non troppo pieno"],
              ["Oltre 24 L", "Una settimana", "Quasi sempre troppo grande per la borsa gratuita"],
            ],
          },
        },
        {
          heading: "Cosa guardare prima di comprare",
          paragraphs: ["Molti zaini sono venduti come “compatibili Ryanair”, ma conviene verificare di persona. I dettagli che contano:"],
          list: [
            "Misure esterne dichiarate dal produttore: altezza, larghezza e profondità, non solo i litri.",
            "Forma squadrata: sfrutta tutto il volume della scatola 40 × 30 × 20, a differenza degli zaini a goccia.",
            "Apertura a libro (a valigia): prepari e controlli tutto come in un trolley.",
            "Tasche esterne piatte: quelle a soffietto, piene, fanno superare la profondità di 20 cm.",
            "Cinghie di compressione: tengono basso lo spessore quando lo zaino è pieno.",
            "Peso a vuoto sotto 1 kg: lasci più spazio (e meno fatica) per il contenuto.",
            "Spallacci che si possono nascondere: utile se lo metti nel misuratore al gate.",
          ],
        },
        {
          heading: "Il vero limite è la profondità di 20 cm",
          paragraphs: [
            "Altezza e larghezza sono facili da rispettare. La profondità no: uno zaino morbido da 18 cm vuoto può arrivare a 23–24 cm quando è pieno, perché il tessuto si gonfia.",
            "Misura lo zaino già pronto per il viaggio, nel punto più spesso. Se supera i 20 cm, sposta gli oggetti più ingombranti al centro, stringi le cinghie e lascia vuote le tasche esterne.",
          ],
          tip: "Prova a casa con una scatola o un segno sul pavimento di 40 × 30 cm: se lo zaino ci sta senza schiacciarlo, al gate non avrai sorprese.",
        },
        {
          heading: "Cosa ci sta in 20 litri (2–3 notti)",
          paragraphs: ["Con abiti leggeri e un po' di metodo, 20 litri bastano per un weekend lungo. Una lista realistica:"],
          list: [
            "2–3 magliette e un cambio di intimo per notte",
            "Un paio di pantaloni o una gonna (l'altro lo indossi)",
            "Un maglione leggero o un pile",
            "Beauty da viaggio con liquidi in formato 100 ml",
            "Caricatori, power bank e documenti",
            "Laptop sottile o tablet, se serve",
          ],
          tip: "Le scarpe più ingombranti e la giacca indossale in volo: sono i capi che occupano più spazio. Arrotolare i vestiti invece di piegarli aiuta a riempire gli angoli.",
          productPicks: true,
        },
        {
          heading: "Cosa succede se lo zaino non entra",
          paragraphs: [
            "Al gate il personale può chiederti di inserire la borsa nel misuratore. Se non entra, devi pagare un supplemento per imbarcarla, che al gate costa di più che comprare il bagaglio in anticipo.",
            "Se hai dubbi sulla misura, è più conveniente aggiungere il bagaglio a mano già in fase di prenotazione, oppure scegliere uno zaino più piccolo.",
          ],
        },
        {
          heading: "In breve",
          paragraphs: [
            "Cerca uno zaino da 16–20 litri, squadrato, con misure esterne dichiarate entro 40 × 30 × 20 cm e tasche piatte. Misuralo pieno, soprattutto la profondità. E controlla sempre le regole della tua tariffa prima di partire.",
          ],
        },
      ],
      en: [
        {
          heading: "The official sizes: what's free and what isn't",
          paragraphs: [
            "Every Ryanair fare includes just one small bag that goes under the seat in front of you. That's where a backpack comes in: if it fits the size, you fly without paying for a cabin bag.",
            "Here are the rules from Ryanair's official page, checked by us on 11 November 2026:",
          ],
          table: {
            head: ["Bag", "Maximum size", "Weight", "Cost"],
            rows: [
              ["Small under-seat bag", "40 × 30 × 20 cm", "Not stated", "Included in every fare"],
              ["Overhead cabin bag", "55 × 40 × 20 cm", "10 kg", "Paid (Priority & 2 cabin bags)"],
            ],
          },
          tip: "Rules can change and depend on your fare: always check your booking on Ryanair's site before you travel.",
        },
        {
          heading: "How many liters really fit in 40×30×20",
          paragraphs: [
            "40 × 30 × 20 cm is 24 liters, but that's the volume of a box. A backpack has rounded corners, padding and pockets: the real usable space is about 18–20 liters.",
            "So the number to look for isn't “24 L” but a backpack rated 16–20 liters whose outer size stays within 40 × 30 × 20 cm. Liters alone aren't enough: an 18 L bag that is 45 cm tall won't pass.",
          ],
          table: {
            head: ["Rated capacity", "What it holds", "For Ryanair"],
            rows: [
              ["Up to 15 L", "A day, or a very minimal weekend", "Fits easily, even full"],
              ["16–20 L", "2–3 nights with light clothes", "The sweet spot, if the outer size fits"],
              ["21–24 L", "3–4 nights", "Borderline: only if boxy and not overstuffed"],
              ["Over 24 L", "A week", "Almost always too big for the free bag"],
            ],
          },
        },
        {
          heading: "What to check before you buy",
          paragraphs: ["Plenty of backpacks are sold as “Ryanair compatible”, but it's worth checking yourself. The details that matter:"],
          list: [
            "The maker's stated outer size: height, width and depth, not just liters.",
            "A boxy shape: it uses the whole 40 × 30 × 20 box, unlike teardrop-shaped packs.",
            "Clamshell opening: you pack and find things like in a suitcase.",
            "Flat outer pockets: bellows pockets, once full, push the depth past 20 cm.",
            "Compression straps: they keep the bag slim when it's full.",
            "Empty weight under 1 kg: more room (and less effort) for what's inside.",
            "Stowable straps: handy when you put it in the sizer at the gate.",
          ],
        },
        {
          heading: "The real limit is the 20 cm depth",
          paragraphs: [
            "Height and width are easy to meet. Depth isn't: a soft backpack that is 18 cm empty can reach 23–24 cm when full, because the fabric bulges.",
            "Measure the bag packed for the trip, at its thickest point. If it's over 20 cm, move bulky items to the middle, cinch the straps and leave the outer pockets empty.",
          ],
          tip: "Test at home with a box or a 40 × 30 cm outline on the floor: if the bag fits without squashing, there'll be no surprises at the gate.",
        },
        {
          heading: "What fits in 20 liters (2–3 nights)",
          paragraphs: ["With light clothes and a bit of method, 20 liters is enough for a long weekend. A realistic list:"],
          list: [
            "2–3 T-shirts and a change of underwear per night",
            "One pair of trousers or a skirt (wear the other)",
            "A light sweater or fleece",
            "Travel toiletries with 100 ml liquids",
            "Chargers, power bank and documents",
            "A slim laptop or tablet, if you need one",
          ],
          tip: "Wear your bulkiest shoes and jacket on the plane: they take the most space. Rolling clothes instead of folding them helps fill the corners.",
          productPicks: true,
        },
        {
          heading: "What happens if the bag doesn't fit",
          paragraphs: [
            "At the gate, staff may ask you to put your bag in the sizer. If it doesn't fit, you pay a fee to check it in, and paying at the gate costs more than adding a bag when you book.",
            "If you're unsure about the size, it's cheaper to add a cabin bag when booking, or to pick a smaller backpack.",
          ],
        },
        {
          heading: "In short",
          paragraphs: [
            "Look for a 16–20 liter, boxy backpack with a stated outer size within 40 × 30 × 20 cm and flat pockets. Measure it packed, especially the depth. And always check your fare's rules before you fly.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Backpacks that fit 40×30×20", it: "Zaini che rientrano in 40×30×20" },
      intro: {
        en: "16–20 L travel backpacks from brands' official stores, checked against the Ryanair free-bag size when the maker states the dimensions.",
        it: "Zaini da viaggio da 16–20 L dai negozi ufficiali dei brand, confrontati con le misure della borsa gratuita Ryanair quando il produttore le indica.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 16, max: 20 }, dimensionsCm: { height: 40, width: 30, depth: 20 } },
    },
    faq: {
      it: [
        { question: "Qual è la misura dello zaino gratuito Ryanair?", answer: "La borsa piccola inclusa in tutte le tariffe può misurare al massimo 40 × 30 × 20 cm e va sotto il sedile davanti. Verifica sempre le regole della tua tariffa sul sito Ryanair." },
        { question: "C'è un limite di peso per la borsa gratuita?", answer: "La pagina ufficiale Ryanair non indica un limite di peso per la borsa piccola: contano le misure. Devi comunque poterla sollevare e sistemare da solo." },
        { question: "Uno zaino da 20 litri va bene per Ryanair?", answer: "Di solito sì, se le misure esterne dichiarate rientrano in 40 × 30 × 20 cm. Controlla soprattutto la profondità con lo zaino pieno: è la misura che si supera più spesso." },
        { question: "Posso portare lo zaino e anche una borsetta?", answer: "Con la tariffa base no: è inclusa una sola borsa piccola. Per aggiungere un trolley da 10 kg in cappelliera serve l'opzione “Priorità e 2 bagagli a mano”." },
        { question: "Lo stesso zaino va bene anche per easyJet?", answer: "Sì: la borsa sotto il sedile easyJet può misurare fino a 45 × 36 × 20 cm, quindi uno zaino che rientra in 40 × 30 × 20 va bene anche lì. Non vale il contrario." },
        { question: "Gli zaini “compatibili Ryanair” sono garantiti?", answer: "No, è un'indicazione del venditore. Confronta le misure esterne reali con quelle ufficiali e misura lo zaino pieno prima di partire." },
      ],
      en: [
        { question: "What size is Ryanair's free backpack?", answer: "The small bag included in every fare can measure up to 40 × 30 × 20 cm and goes under the seat in front. Always check your fare's rules on Ryanair's site." },
        { question: "Is there a weight limit for the free bag?", answer: "Ryanair's official page states no weight limit for the small bag: the size is what counts. You still need to be able to lift and stow it yourself." },
        { question: "Is a 20 liter backpack OK for Ryanair?", answer: "Usually, if its stated outer size is within 40 × 30 × 20 cm. Check the depth with the bag packed: it's the size people exceed most often." },
        { question: "Can I bring the backpack and a handbag?", answer: "Not on the basic fare: one small bag is included. To add a 10 kg overhead bag you need the “Priority & 2 cabin bags” option." },
        { question: "Does the same backpack work for easyJet?", answer: "Yes: easyJet's under-seat bag can be up to 45 × 36 × 20 cm, so a backpack that fits 40 × 30 × 20 works there too. Not the other way round." },
        { question: "Are “Ryanair compatible” backpacks guaranteed?", answer: "No, it's the seller's claim. Compare the real outer size with the official one and measure the bag packed before you travel." },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose Ryanair and your packing list: we'll tell you if 40×30×20 is enough or you need a bigger bag.", it: "Scegli Ryanair e cosa porti: ti diciamo se 40×30×20 basta o se ti serve un bagaglio più grande." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "cabin-baggage-sizes-by-airline",
    published: "2026-11-14",
    updated: "2026-11-14",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "Cabin baggage sizes by airline: the complete table",
      it: "Misure bagaglio a mano: la tabella delle compagnie aeree",
    },
    description: {
      en: `Under-seat bag and overhead cabin bag sizes and weights for ${airlineCount} airlines (Ryanair, easyJet, Wizz Air, ITA, Lufthansa…), what's included and the one size that fits them all.`,
      it: `Misure e peso della borsa sotto il sedile e del bagaglio in cappelliera per ${airlineCount} compagnie (Ryanair, easyJet, Wizz Air, ITA, Lufthansa…), cosa è incluso e la misura che va bene per tutte.`,
    },
    sections: {
      it: [
        {
          heading: "Due bagagli diversi, spesso confusi",
          paragraphs: [
            "Quando si parla di “bagaglio a mano” si intendono due cose diverse, e confonderle è il modo più veloce per pagare un supplemento al gate:",
          ],
          list: [
            "La borsa sotto il sedile (oggetto personale): piccola, quasi sempre inclusa nel biglietto. Uno zaino, una borsa, un porta laptop.",
            "Il bagaglio in cappelliera: il classico trolley da 55 cm. Sulle low cost è quasi sempre a pagamento, sulle compagnie tradizionali spesso è incluso, ma non nelle tariffe più economiche.",
          ],
          tip: "Le misure qui sotto le abbiamo verificate sulle pagine ufficiali delle compagnie l'11 e 12 novembre 2026. Le regole cambiano spesso e dipendono dalla tariffa: controlla sempre la tua prenotazione.",
        },
        {
          heading: "Borsa sotto il sedile: misure per compagnia",
          paragraphs: ["Questa è la borsa che puoi portare con quasi tutte le tariffe, anche le più economiche. Le misure includono maniglie e tasche."],
          table: personalItemTable("it"),
        },
        {
          heading: "Bagaglio in cappelliera: misure, peso e se è incluso",
          paragraphs: ["Il trolley da cabina: quasi tutte le compagnie contano anche ruote e maniglie nelle misure. Attenzione al peso: alcune compagnie non lo indicano, altre (Air France, KLM) fissano un limite unico per trolley e borsa insieme."],
          table: cabinBagTable("it"),
        },
        {
          heading: "La misura che va bene per tutte",
          paragraphs: [
            `Se viaggi spesso con compagnie diverse, conviene un bagaglio che rientri nei limiti più stretti. Incrociando le misure verificate:`,
          ],
          list: [
            `Trolley da cabina: ${formatSize(universalCabin)}. Entra in tutte le ${airlineCount} compagnie della tabella; il limite più stretto è la larghezza di Air France, KLM e Delta e la profondità di Ryanair e Vueling.`,
            `Borsa sotto il sedile: ${formatSize(universalPersonal)}. Il limite più stretto è la profondità di 15 cm di ITA, Lufthansa, British Airways, Air France e KLM.`,
          ],
          tip: "Il classico trolley 55 × 40 × 20 va bene sulle low cost (Ryanair, Vueling, Wizz Air) ma è troppo largo per Air France e KLM, che si fermano a 35 cm.",
          productPicks: true,
        },
        {
          heading: "Ruote, maniglie e tasche contano",
          paragraphs: [
            "Le misure dichiarate dal produttore a volte escludono ruote e maniglia: è il motivo più comune per cui un trolley “da 55 cm” non entra nel misuratore. Cerca le misure totali, o misuralo tu dalla base delle ruote alla cima della maniglia abbassata.",
            "Con borse e zaini morbidi il problema è la profondità: da pieni si gonfiano anche di 3–4 cm. Misurali già pronti per il viaggio.",
          ],
        },
        {
          heading: "E il peso?",
          paragraphs: [
            "Le low cost tendono a controllare soprattutto le misure; le compagnie tradizionali indicano spesso un peso massimo, da 8 kg (ITA, Lufthansa) a 12 kg (Air France, KLM, sommando trolley e borsa). Dove la compagnia non indica un limite, devi comunque riuscire a sollevare il bagaglio in cappelliera da solo.",
          ],
        },
        {
          heading: "In breve",
          paragraphs: [
            `Prima di comprare un trolley o uno zaino, decidi con quali compagnie voli di solito. Se cambi spesso, punta su ${formatSize(universalCabin)} per il trolley e ${formatSize(universalPersonal)} per la borsa: vanno bene ovunque. E prima di ogni volo controlla le regole della tua tariffa.`,
          ],
        },
      ],
      en: [
        {
          heading: "Two different bags, often mixed up",
          paragraphs: [
            "“Hand luggage” means two different things, and mixing them up is the quickest way to pay a fee at the gate:",
          ],
          list: [
            "The under-seat bag (personal item): small, almost always included in the ticket. A backpack, handbag or laptop bag.",
            "The overhead cabin bag: the classic 55 cm trolley. On low-cost airlines it's almost always paid; on full-service airlines it's often included, but not on the cheapest fares.",
          ],
          tip: "We checked the sizes below on the airlines' official pages on 11–12 November 2026. Rules change often and depend on the fare: always check your booking.",
        },
        {
          heading: "Under-seat bag: sizes by airline",
          paragraphs: ["This is the bag you can bring on almost every fare, even the cheapest. Sizes include handles and pockets."],
          table: personalItemTable("en"),
        },
        {
          heading: "Overhead cabin bag: size, weight and whether it's included",
          paragraphs: ["The cabin trolley: almost every airline counts wheels and handles in the size. Watch the weight: some airlines don't state one, others (Air France, KLM) set a single limit for trolley and small bag together."],
          table: cabinBagTable("en"),
        },
        {
          heading: "The one size that fits them all",
          paragraphs: ["If you often fly different airlines, pick a bag that meets the strictest limits. Crossing the verified sizes:"],
          list: [
            `Cabin trolley: ${formatSize(universalCabin)}. It fits all ${airlineCount} airlines in the table; the tightest limits are the width at Air France, KLM and Delta and the depth at Ryanair and Vueling.`,
            `Under-seat bag: ${formatSize(universalPersonal)}. The tightest limit is the 15 cm depth at ITA, Lufthansa, British Airways, Air France and KLM.`,
          ],
          tip: "The classic 55 × 40 × 20 trolley works on low-cost airlines (Ryanair, Vueling, Wizz Air) but is too wide for Air France and KLM, which stop at 35 cm.",
          productPicks: true,
        },
        {
          heading: "Wheels, handles and pockets count",
          paragraphs: [
            "Makers sometimes leave wheels and handle out of the stated size: that's the most common reason a “55 cm” trolley won't go in the sizer. Look for the overall size, or measure it yourself from the bottom of the wheels to the top of the lowered handle.",
            "With soft bags and backpacks the issue is depth: packed, they bulge by 3–4 cm. Measure them ready for the trip.",
          ],
        },
        {
          heading: "What about weight?",
          paragraphs: [
            "Low-cost airlines mostly check size; full-service airlines often state a maximum weight, from 8 kg (ITA, Lufthansa) to 12 kg (Air France, KLM, trolley and small bag combined). Where no limit is stated, you still need to lift the bag into the overhead bin yourself.",
          ],
        },
        {
          heading: "In short",
          paragraphs: [
            `Before buying a trolley or backpack, decide which airlines you usually fly. If it varies, aim for ${formatSize(universalCabin)} for the trolley and ${formatSize(universalPersonal)} for the small bag: they work everywhere. And before every flight, check your fare's rules.`,
          ],
        },
      ],
    },
    products: {
      heading: { en: "Cabin trolleys that fit every airline", it: "Trolley da cabina che vanno bene ovunque" },
      intro: {
        en: `Cabin trolleys checked against ${formatSize(universalCabin)}, the size that fits all the airlines above, from the stores' Shopify catalogs.`,
        it: `Trolley da cabina confrontati con ${formatSize(universalCabin)}, la misura che va bene per tutte le compagnie qui sopra, dai cataloghi Shopify dei negozi.`,
      },
      criteria: { productKind: "cabin-trolley", capacityRangeLiters: { min: 30, max: 40 }, dimensionsCm: universalCabin },
    },
    faq: {
      it: [
        { question: "Qual è la misura standard del bagaglio a mano?", answer: `Non esiste una misura unica: il trolley più comune è 55 × 40 × 20 cm, ma Air France e KLM accettano al massimo 35 cm di larghezza. Un bagaglio ${formatSize(universalCabin)} va bene per tutte le compagnie della nostra tabella.` },
        { question: "Il bagaglio a mano è incluso nel biglietto?", answer: "La borsa sotto il sedile quasi sempre sì. Il trolley in cappelliera no con Ryanair, easyJet, Wizz Air e Vueling (a pagamento); sì con British Airways e, tranne le tariffe Basic, con Lufthansa e KLM. Dipende sempre dalla tariffa." },
        { question: "Le ruote sono comprese nelle misure?", answer: "Per quasi tutte le compagnie sì: le misure includono ruote, maniglie e tasche. Wizz Air consente fino a 5 cm in più per le ruote. Controlla le misure totali del tuo trolley, non solo quelle del corpo." },
        { question: "Quanto può pesare il bagaglio a mano?", answer: "Dipende: 8 kg per ITA e Lufthansa, 10 kg per Ryanair, Vueling e Wizz Air, 12 kg totali per Air France e KLM (trolley più borsa). Alcune compagnie, come British Airways e Delta, non indicano un limite." },
        { question: "Uno zaino conta come bagaglio a mano?", answer: "Se rientra nelle misure della borsa sotto il sedile, conta come oggetto personale ed è gratuito. Se è più grande, va considerato bagaglio in cappelliera." },
        { question: "Ogni quanto aggiornate le misure?", answer: "Le verifichiamo sulle pagine ufficiali e indichiamo la data del controllo. Le regole cambiano spesso: prima di partire controlla sempre la tua prenotazione sul sito della compagnia." },
      ],
      en: [
        { question: "What is the standard cabin bag size?", answer: `There's no single standard: the most common trolley is 55 × 40 × 20 cm, but Air France and KLM accept 35 cm width at most. A ${formatSize(universalCabin)} bag fits every airline in our table.` },
        { question: "Is the cabin bag included in the ticket?", answer: "The under-seat bag almost always is. The overhead trolley isn't on Ryanair, easyJet, Wizz Air and Vueling (paid); it is on British Airways and, except Basic fares, on Lufthansa and KLM. It always depends on the fare." },
        { question: "Do wheels count in the size?", answer: "For almost every airline, yes: sizes include wheels, handles and pockets. Wizz Air allows up to 5 cm extra for wheels. Check your trolley's overall size, not just the body." },
        { question: "How heavy can a cabin bag be?", answer: "It depends: 8 kg on ITA and Lufthansa, 10 kg on Ryanair, Vueling and Wizz Air, 12 kg in total on Air France and KLM (trolley plus small bag). Some airlines, such as British Airways and Delta, state no limit." },
        { question: "Does a backpack count as cabin baggage?", answer: "If it fits the under-seat size, it counts as a personal item and is free. If it's bigger, it counts as an overhead cabin bag." },
        { question: "How often do you update the sizes?", answer: "We check them on the official pages and show the date of the check. Rules change often: always check your booking on the airline's site before you travel." },
      ],
    },
    cta: {
      label: { en: "Find your suitcase", it: "Trova il tuo trolley" },
      text: { en: "Choose your airline and what you're packing: we'll suggest the right size and real suitcases that fit.", it: "Scegli la compagnia e cosa porti: ti suggeriamo la misura giusta e trolley veri che rientrano." },
      href: "/luggage-configurator",
    },
  },
  {
    slug: "trekking-backpack-guide",
    published: "2026-11-13",
    updated: "2026-11-13",
    category: { en: "Trekking & outdoor", it: "Trekking e outdoor" },
    title: {
      en: "Trekking backpack: how to choose one for hiking and mountains",
      it: "Zaino da trekking: come sceglierlo per escursioni e montagna",
    },
    description: {
      en: "How many liters for a day hike, a hut-to-hut trek or a tent trip, how to find your back length, hip belt, back panel and how to pack it. With real models.",
      it: "Quanti litri per un'escursione, un trekking in rifugio o in tenda, come trovare la taglia dello schienale, cintura, ventilazione e come caricarlo. Con modelli reali.",
    },
    sections: {
      it: [
        {
          heading: "Prima di tutto: che uscita fai?",
          paragraphs: [
            "Lo zaino da trekking giusto dipende quasi solo da dove dormi. Una giornata in montagna, tre notti di rifugio in rifugio e un trekking con la tenda sulle spalle richiedono zaini completamente diversi, anche se il percorso è lo stesso.",
            "Come punto di partenza, queste sono le capienze che servono di solito:",
          ],
          table: {
            head: ["Tipo di uscita", "Capienza consigliata", "Cosa ci va"],
            rows: [
              ["Escursione in giornata", "20–30 L", "Giacca impermeabile, pile, acqua, pranzo, kit di primo soccorso"],
              ["Trekking in rifugio (2–4 giorni)", "30–45 L", "Più un cambio, sacco lenzuolo, beauty essenziale"],
              ["Trekking con tenda (2–4 giorni)", "50–65 L", "Più tenda, sacco a pelo, materassino, fornello e pasti"],
              ["Più di 5 giorni in autonomia", "65 L e oltre", "Più cibo e ricambi per tutti i giorni"],
            ],
          },
          tip: "In autunno e in inverno conta 5–10 litri in più: strati termici, guanti e un sacco a pelo più caldo occupano molto spazio.",
        },
        {
          heading: "La taglia giusta è quella del tuo busto, non la tua altezza",
          paragraphs: [
            "Molti zaini da trekking esistono in più taglie (S, M, L) o hanno uno schienale regolabile. La misura che conta è la lunghezza del busto: dalla vertebra sporgente alla base del collo fino alla linea dei fianchi (il bordo superiore delle ossa del bacino).",
            "Fatti aiutare a misurarla con un metro morbido e confrontala con la tabella taglie del produttore. Due persone alte uguali possono avere busti diversi di diversi centimetri.",
          ],
          tip: "Le versioni da donna hanno di solito busto più corto, spallacci sagomati e cintura più conica: non sono solo un cambio di colore.",
        },
        {
          heading: "La cintura in vita porta il peso",
          paragraphs: [
            "Da circa 30 litri in su lo zaino deve avere una cintura imbottita: è lei che trasferisce gran parte del carico sui fianchi, lasciando le spalle libere. Una cintura sottile o assente va bene solo per zaini da giornata leggeri.",
            "Quando lo provi, la cintura deve appoggiare sulle ossa del bacino, non sulla pancia. Poi stringi gli spallacci e infine i tiranti sopra le spalle (load lifters), che avvicinano il carico alla schiena.",
          ],
        },
        {
          heading: "Schienale: ventilato o a contatto?",
          paragraphs: ["Ci sono due grandi famiglie, con vantaggi diversi:"],
          table: {
            head: ["Schienale", "Punti forti", "Attenzione a"],
            rows: [
              ["A rete tesa (ventilato)", "La schiena suda molto meno, ottimo d'estate", "Il carico sta più lontano dalla schiena: meno stabile con molto peso"],
              ["A contatto (imbottito)", "Carico vicino alla schiena, più stabile su terreni difficili e con zaini pesanti", "Più caldo"],
            ],
          },
        },
        {
          heading: "Le caratteristiche che fanno la differenza",
          paragraphs: ["Oltre ai litri, questi dettagli rendono uno zaino comodo in cammino:"],
          list: [
            "Accesso frontale o dal basso: prendi la giacca senza svuotare tutto.",
            "Coprizaino integrato: nella sua tasca sul fondo, pronto quando arriva il temporale.",
            "Tasche sulla cintura: per telefono, snack e crema solare senza togliere lo zaino.",
            "Compatibilità con sacca idrica: bevi spesso senza fermarti.",
            "Portabastoncini e anelli porta piccozza: utili in montagna.",
            "Cinghie di compressione: tengono il carico fermo quando lo zaino non è pieno.",
            "Peso a vuoto: 1–1,5 kg è normale per un 40 litri; sotto 1 kg sei nel mondo ultralight, con tessuti più delicati.",
          ],
          productPicks: true,
        },
        {
          heading: "Come caricarlo bene",
          paragraphs: [
            "Il modo in cui lo riempi conta quanto lo zaino. La regola base: gli oggetti pesanti vicini alla schiena, all'altezza delle scapole.",
          ],
          list: [
            "Sul fondo: sacco a pelo e cose che usi solo la sera.",
            "Al centro, contro la schiena: acqua, cibo, fornello, le cose più pesanti.",
            "In alto e nelle tasche: giacca impermeabile, pile, kit di primo soccorso, frontale.",
            "Fuori dallo zaino il meno possibile: oggetti appesi dondolano e si impigliano.",
          ],
          tip: "Una regola pratica diffusa è non superare circa il 20% del tuo peso corporeo nello zaino carico: oltre, la fatica cresce molto in fretta.",
        },
        {
          heading: "In breve",
          paragraphs: [
            "Parti da dove dormi per scegliere i litri, poi scegli la taglia in base al busto, verifica la cintura in vita e provalo carico prima di comprarlo. Lo zaino giusto è quello che dopo sei ore di cammino ti dimentichi di avere sulle spalle.",
          ],
        },
      ],
      en: [
        {
          heading: "First: what kind of trip?",
          paragraphs: [
            "The right trekking backpack depends almost entirely on where you sleep. A day in the mountains, three nights hut to hut and a trek carrying your own tent need very different packs, even on the same trail.",
            "As a starting point, these are the capacities you usually need:",
          ],
          table: {
            head: ["Kind of trip", "Suggested capacity", "What goes in"],
            rows: [
              ["Day hike", "20–30 L", "Waterproof jacket, fleece, water, lunch, first-aid kit"],
              ["Hut-to-hut trek (2–4 days)", "30–45 L", "Plus a change of clothes, a sleeping-bag liner, basic toiletries"],
              ["Trek with a tent (2–4 days)", "50–65 L", "Plus tent, sleeping bag, mat, stove and meals"],
              ["Over 5 days self-supported", "65 L and up", "Plus food and changes for every day"],
            ],
          },
          tip: "In autumn and winter add 5–10 liters: thermal layers, gloves and a warmer sleeping bag take a lot of room.",
        },
        {
          heading: "Size it to your back, not your height",
          paragraphs: [
            "Many trekking packs come in sizes (S, M, L) or have an adjustable back. What matters is your torso length: from the bony bump at the base of your neck down to your hip line (the top of your hip bones).",
            "Have someone measure it with a soft tape and compare it with the maker's size chart. Two people of the same height can have torsos several centimeters apart.",
          ],
          tip: "Women's versions usually have a shorter torso, shaped straps and a more conical hip belt: they're not just a different color.",
        },
        {
          heading: "The hip belt carries the load",
          paragraphs: [
            "From about 30 liters, a pack needs a padded hip belt: it moves most of the weight onto your hips and frees your shoulders. A thin belt, or none, is only fine for light day packs.",
            "When you try it, the belt should sit on your hip bones, not your belly. Then tighten the shoulder straps and finally the load lifters above your shoulders, which pull the load towards your back.",
          ],
        },
        {
          heading: "Back panel: ventilated or contact?",
          paragraphs: ["There are two big families, with different strengths:"],
          table: {
            head: ["Back panel", "Strengths", "Watch out for"],
            rows: [
              ["Suspended mesh (ventilated)", "Much less back sweat, great in summer", "The load sits further from your back: less stable when heavy"],
              ["Contact (padded)", "Load close to your back, more stable on rough ground and with heavy packs", "Warmer"],
            ],
          },
        },
        {
          heading: "Features that make a difference",
          paragraphs: ["Beyond liters, these details make a pack comfortable on the trail:"],
          list: [
            "Front or bottom access: grab your jacket without unpacking everything.",
            "Built-in rain cover: in its own pocket at the bottom, ready for the storm.",
            "Hip-belt pockets: phone, snacks and sunscreen without taking the pack off.",
            "Hydration-bladder compatible: drink often without stopping.",
            "Pole and ice-axe loops: useful in the mountains.",
            "Compression straps: keep the load steady when the pack isn't full.",
            "Empty weight: 1–1.5 kg is normal for 40 liters; under 1 kg you're in ultralight territory, with more delicate fabrics.",
          ],
          productPicks: true,
        },
        {
          heading: "How to pack it",
          paragraphs: ["How you fill it matters as much as the pack itself. The basic rule: heavy items close to your back, at shoulder-blade height."],
          list: [
            "At the bottom: sleeping bag and things you only use in the evening.",
            "In the middle, against your back: water, food, stove, the heaviest items.",
            "At the top and in pockets: waterproof jacket, fleece, first-aid kit, headlamp.",
            "As little as possible outside: hanging items swing and snag.",
          ],
          tip: "A common rule of thumb is to keep the loaded pack under about 20% of your body weight: beyond that, fatigue grows fast.",
        },
        {
          heading: "In short",
          paragraphs: [
            "Start from where you sleep to choose the liters, then size it to your torso, check the hip belt and try it loaded before you buy. The right pack is the one you forget you're wearing after six hours on the trail.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Trekking backpacks for hut-to-hut treks", it: "Zaini da trekking per il rifugio" },
      intro: {
        en: "30–45 L trekking backpacks, the most versatile size, from the stores' Shopify catalogs. Use the brand filter to compare makers.",
        it: "Zaini da trekking da 30–45 L, la misura più versatile, dai cataloghi Shopify dei negozi. Usa il filtro brand per confrontare le marche.",
      },
      criteria: { productKind: "backpack", backpackType: "hiking", capacityRangeLiters: { min: 30, max: 45 } },
    },
    faq: {
      it: [
        { question: "Quanti litri deve avere uno zaino da trekking?", answer: "Per un'escursione in giornata 20–30 L, per un trekking in rifugio di 2–4 giorni 30–45 L, con la tenda 50–65 L. In inverno aggiungi 5–10 litri per gli strati in più." },
        { question: "Come si misura la lunghezza del busto?", answer: "Dalla vertebra sporgente alla base del collo fino alla linea dei fianchi, all'altezza del bordo superiore delle ossa del bacino. Confronta la misura con la tabella taglie del produttore." },
        { question: "Uno zaino da 40 litri basta per un trekking in rifugio?", answer: "Di solito sì per 2–4 giorni: in rifugio trovi letto e pasti, quindi porti solo vestiti, sacco lenzuolo, acqua e snack. Con la tenda invece servono 50 litri o più." },
        { question: "Meglio schienale ventilato o a contatto?", answer: "Ventilato se fai soprattutto escursioni estive con carichi leggeri. A contatto se porti molto peso o cammini su terreni difficili, dove serve stabilità." },
        { question: "Quanto deve pesare lo zaino carico?", answer: "Una regola pratica diffusa è restare intorno al 20% del proprio peso corporeo. Per una persona di 70 kg significa circa 14 kg con acqua e cibo." },
        { question: "Serve uno zaino da donna?", answer: "Non è obbligatorio, ma i modelli da donna hanno busto più corto e spallacci e cintura sagomati: per molte persone sono più comodi. Conta la vestibilità, non l'etichetta." },
      ],
      en: [
        { question: "How many liters should a trekking backpack have?", answer: "20–30 L for a day hike, 30–45 L for a 2–4 day hut-to-hut trek, 50–65 L with a tent. In winter add 5–10 liters for extra layers." },
        { question: "How do I measure my torso length?", answer: "From the bony bump at the base of your neck down to your hip line, level with the top of your hip bones. Compare it with the maker's size chart." },
        { question: "Is a 40 liter pack enough for a hut-to-hut trek?", answer: "Usually yes for 2–4 days: huts provide beds and meals, so you carry only clothes, a liner, water and snacks. With a tent you'll need 50 liters or more." },
        { question: "Ventilated or contact back panel?", answer: "Ventilated if you mostly hike in summer with light loads. Contact if you carry a lot of weight or walk rough terrain, where stability matters." },
        { question: "How heavy should the loaded pack be?", answer: "A common rule of thumb is about 20% of your body weight. For a 70 kg person that's roughly 14 kg including water and food." },
        { question: "Do I need a women's backpack?", answer: "It's not required, but women's models have a shorter torso and shaped straps and hip belt: many people find them more comfortable. Fit matters, not the label." },
      ],
    },
    cta: {
      label: { en: "Find your trekking pack", it: "Calcola il tuo zaino da trekking" },
      text: { en: "Choose day hike, huts or tent, the days and the season: we'll work out the liters and show you real trekking packs.", it: "Scegli giornata, rifugio o tenda, i giorni e la stagione: calcoliamo i litri e ti mostriamo zaini da trekking veri." },
      href: "/backpack-configurator?mode=trekking",
    },
  },
  {
    slug: "ryanair-backpack-3-days-packing-list",
    published: "2026-11-15",
    updated: "2026-11-15",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "What fits in a Ryanair backpack for 3 days: the complete packing list",
      it: "Cosa ci sta nello zaino Ryanair per 3 giorni: la lista completa",
    },
    description: {
      en: "Summer, winter and work-trip packing lists for 3 days in Ryanair's free 40×30×20 cm bag, with the liters each item takes, what to wear on the plane and what to leave at home.",
      it: "Le liste per 3 giorni in estate, in inverno e per lavoro nella borsa gratuita Ryanair 40×30×20 cm, con i litri di ogni oggetto, cosa indossare in volo e cosa lasciare a casa.",
    },
    sections: {
      it: [
        {
          heading: "La risposta breve: sì, 3 giorni ci stanno",
          paragraphs: [
            "La borsa gratuita Ryanair misura al massimo 40 × 30 × 20 cm: in uno zaino di quella misura lo spazio utile reale è di circa 18–20 litri. Per tre giorni bastano, a una condizione: abiti leggeri, niente doppioni e i capi più ingombranti addosso durante il volo.",
            "Le liste qui sotto usano gli stessi volumi del nostro configuratore: per ogni oggetto trovi quanto spazio occupa davvero, così vedi subito dove va a finire lo spazio.",
          ],
        },
        {
          heading: "La lista per 3 giorni in estate",
          paragraphs: ["Pensata per una city break da venerdì a domenica: in volo indossi sneakers, jeans e una maglietta. Nello zaino:"],
          table: kitTable(ryanairSummerKit, 3, "it"),
          tip: "I sandali vanno in fondo, contro lo schienale, dentro un sacchetto: sono pesanti e così non sbilanciano lo zaino.",
        },
        {
          heading: "La lista per 3 giorni in inverno",
          paragraphs: [
            "In inverno lo spazio lo occupano i maglioni, non le magliette. Il trucco è semplice: in volo indossi giacca, scarpe chiuse e il maglione più spesso, e nello zaino metti solo gli strati sottili.",
          ],
          table: kitTable(ryanairWinterKit, 3, "it"),
          tip: "Una giacca con tasche capienti è il tuo bagaglio extra: power bank, documenti e cuffie possono viaggiare lì e liberano spazio nello zaino.",
        },
        {
          heading: "Quanto spazio serve: il confronto",
          paragraphs: [
            "Ai volumi degli oggetti il configuratore aggiunge un piccolo margine per le cose che non elenchi e per gli spazi vuoti tra un oggetto e l'altro. Il risultato è la capienza da cercare nello zaino:",
          ],
          table: kitSummaryTable("it"),
          tip: "Il viaggio di lavoro sta nello zaino anche con il laptop, ma è il caso più pesante: il computer da solo occupa quasi quanto quattro magliette. Scegli uno zaino con scomparto imbottito, così il laptop fa da pannello rigido sulla schiena.",
        },
        {
          heading: "Dove si sbaglia: le cose “in più”",
          paragraphs: [
            "L'ultima riga della tabella mostra l'errore più comune: un secondo paio di sneakers e una felpa “per sicurezza” aggiungono oltre 4 litri, e il viaggio passa da 15–20 L a 20–25 L. A quel punto lo zaino supera i 20 cm di profondità e al gate rischi il supplemento.",
            "Prima di aggiungere un capo, chiediti se lo indosserai davvero. Per tre giorni, un paio di scarpe addosso e uno leggero nello zaino bastano quasi sempre.",
          ],
        },
        {
          heading: "Cosa indossare in volo",
          paragraphs: ["Quello che hai addosso non conta nelle misure della borsa. Sfruttalo per i capi più voluminosi:"],
          list: [
            "Le scarpe più ingombranti: sneakers o scarpe chiuse, mai nello zaino.",
            "La giacca o il cappotto, anche se in aereo fa caldo: puoi toglierlo una volta seduto.",
            "Il maglione o la felpa più spessa.",
            "Jeans o pantaloni pesanti: nello zaino metti quelli leggeri.",
            "Una sciarpa grande, che in volo fa anche da coperta.",
          ],
        },
        {
          heading: "Liquidi e beauty: la regola dei 100 ml",
          paragraphs: [
            "Nel bagaglio a mano la regola standard è questa: contenitori da massimo 100 ml, tutti in una busta trasparente richiudibile da circa 1 litro, da mostrare ai controlli. Alcuni aeroporti con scanner di nuova generazione sono più permissivi, ma le regole cambiano spesso: conviene sempre restare nei 100 ml.",
            "Per risparmiare spazio scegli i solidi: shampoo e balsamo in barretta, deodorante stick, dentifricio in pastiglie. Non contano come liquidi e occupano la metà.",
          ],
          tip: "Power bank e batterie al litio devono stare nel bagaglio a mano, mai in stiva: tienili nella tasca esterna dello zaino, così li tiri fuori subito ai controlli.",
        },
        {
          heading: "Come sistemare lo zaino perché rientri nelle misure",
          paragraphs: ["Con 20 litri il metodo conta quanto la lista. L'ordine che funziona meglio:"],
          list: [
            "Sul fondo le scarpe e gli oggetti pesanti, vicino alla schiena.",
            "Al centro i vestiti arrotolati: riempiono gli angoli meglio di quelli piegati.",
            "Calze e intimo dentro le scarpe o negli spazi vuoti.",
            "In alto beauty e busta dei liquidi, per tirarli fuori ai controlli.",
            "Tasche esterne quasi vuote: sono loro a far superare i 20 cm di profondità.",
            "Cinghie di compressione strette: tengono lo spessore sotto controllo.",
          ],
          productPicks: true,
        },
        {
          heading: "Cosa lasciare a casa",
          paragraphs: ["Per tre giorni, queste cose occupano spazio e quasi sempre restano nello zaino:"],
          list: [
            "Il phon: quasi tutti gli hotel e molti appartamenti ce l'hanno.",
            "L'asciugamano grande: se ti serve, uno in microfibra occupa un quinto.",
            "Libri di carta: meglio un ebook o il telefono.",
            "Un cambio “per ogni evenienza”: per tre giorni non serve.",
            "Caricatori separati per ogni dispositivo: un caricatore USB-C con due porte basta per tutto.",
          ],
        },
        {
          heading: "In breve",
          paragraphs: [
            "Per tre giorni bastano circa 9 litri di oggetti, che in uno zaino da 15–20 L stanno nella borsa gratuita 40 × 30 × 20 cm. Indossa in volo scarpe, giacca e maglione più pesanti, porta i liquidi in formato 100 ml e lascia a casa i doppioni. E controlla sempre le regole della tua tariffa prima di partire.",
          ],
        },
      ],
      en: [
        {
          heading: "The short answer: yes, 3 days fit",
          paragraphs: [
            "Ryanair's free bag can be up to 40 × 30 × 20 cm: a backpack that size has about 18–20 liters of real usable space. That's enough for three days, on one condition: light clothes, no duplicates and your bulkiest items worn on the plane.",
            "The lists below use the same volumes as our planner: for every item you see how much space it really takes, so it's clear where the room goes.",
          ],
        },
        {
          heading: "The 3-day summer packing list",
          paragraphs: ["Built for a Friday-to-Sunday city break: on the plane you wear sneakers, jeans and a T-shirt. In the backpack:"],
          table: kitTable(ryanairSummerKit, 3, "en"),
          tip: "Put the sandals at the bottom, against the back panel, in a bag: they're heavy, and that way they don't unbalance the pack.",
        },
        {
          heading: "The 3-day winter packing list",
          paragraphs: [
            "In winter the space goes to sweaters, not T-shirts. The trick is simple: wear your jacket, closed shoes and thickest sweater on the plane, and pack only the thin layers.",
          ],
          table: kitTable(ryanairWinterKit, 3, "en"),
          tip: "A jacket with big pockets is your extra luggage: power bank, documents and earbuds can travel there and free up room in the bag.",
        },
        {
          heading: "How much space you need: the comparison",
          paragraphs: [
            "On top of the items' volume, the planner adds a small margin for things you don't list and for the gaps between items. The result is the capacity to look for in a backpack:",
          ],
          table: kitSummaryTable("en"),
          tip: "The work trip fits even with a laptop, but it's the heaviest case: the computer alone takes almost as much room as four T-shirts. Pick a bag with a padded sleeve, so the laptop works as a stiff back panel.",
        },
        {
          heading: "Where people go wrong: the “extra” items",
          paragraphs: [
            "The last row of the table shows the most common mistake: a second pair of sneakers and a hoodie “just in case” add over 4 liters, and the trip goes from 15–20 L to 20–25 L. At that point the bag is deeper than 20 cm and you risk a fee at the gate.",
            "Before adding something, ask yourself whether you'll really wear it. For three days, one pair of shoes on your feet and a light pair in the bag is almost always enough.",
          ],
        },
        {
          heading: "What to wear on the plane",
          paragraphs: ["What you wear doesn't count towards the bag's size. Use it for the bulkiest items:"],
          list: [
            "Your bulkiest shoes: sneakers or closed shoes, never in the bag.",
            "Your jacket or coat, even if the plane is warm: take it off once seated.",
            "Your thickest sweater or hoodie.",
            "Jeans or heavy trousers: pack the light ones.",
            "A large scarf, which doubles as a blanket on board.",
          ],
        },
        {
          heading: "Liquids and toiletries: the 100 ml rule",
          paragraphs: [
            "In hand luggage the standard rule is: containers of up to 100 ml, all in a resealable clear bag of about 1 liter, shown at security. Some airports with new-generation scanners are more relaxed, but the rules change often: staying within 100 ml is always the safe choice.",
            "To save space, go solid: shampoo and conditioner bars, stick deodorant, toothpaste tablets. They don't count as liquids and take half the room.",
          ],
          tip: "Power banks and lithium batteries must travel in hand luggage, never in the hold: keep them in the outer pocket so you can take them out quickly at security.",
        },
        {
          heading: "How to pack so the bag stays within size",
          paragraphs: ["With 20 liters, method matters as much as the list. The order that works best:"],
          list: [
            "Shoes and heavy items at the bottom, close to your back.",
            "Rolled clothes in the middle: they fill corners better than folded ones.",
            "Socks and underwear inside the shoes or in the gaps.",
            "Toiletries and the liquids bag on top, ready for security.",
            "Outer pockets almost empty: they're what pushes the depth past 20 cm.",
            "Compression straps cinched: they keep the thickness in check.",
          ],
          productPicks: true,
        },
        {
          heading: "What to leave at home",
          paragraphs: ["For three days, these take up room and almost always stay in the bag:"],
          list: [
            "A hair dryer: almost every hotel and many apartments have one.",
            "A big towel: if you need one, a microfiber towel takes a fifth of the space.",
            "Paper books: an ebook or your phone is enough.",
            "A spare outfit “just in case”: you don't need it for three days.",
            "A charger per device: one two-port USB-C charger covers everything.",
          ],
        },
        {
          heading: "In short",
          paragraphs: [
            "Three days take about 9 liters of items, which fit in a 15–20 L backpack within the free 40 × 30 × 20 cm bag. Wear your heaviest shoes, jacket and sweater on the plane, keep liquids in 100 ml containers and leave duplicates at home. And always check your fare's rules before you fly.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Backpacks for 3 days in 40×30×20", it: "Zaini per 3 giorni in 40×30×20" },
      intro: {
        en: "16–20 L travel backpacks, checked against the Ryanair free-bag size when the maker states the dimensions.",
        it: "Zaini da viaggio da 16–20 L, confrontati con le misure della borsa gratuita Ryanair quando il produttore le indica.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 16, max: 20 }, dimensionsCm: { height: 40, width: 30, depth: 20 } },
    },
    faq: {
      it: [
        { question: "Si può viaggiare 3 giorni solo con lo zaino Ryanair?", answer: "Sì. Per tre giorni servono circa 9 litri di oggetti, che stanno in uno zaino da 15–20 L entro 40 × 30 × 20 cm, se indossi in volo scarpe, giacca e maglione più ingombranti." },
        { question: "Il laptop sta nello zaino gratuito Ryanair?", answer: "Sì, ma deve stare dentro l'unica borsa inclusa: non è un oggetto in più. Un laptop fino a 15” entra in uno zaino 40 × 30 × 20 con scomparto dedicato, lasciando spazio per due o tre giorni di vestiti leggeri." },
        { question: "Meglio uno zaino o una borsa per la borsa gratuita?", answer: "Per 3 giorni lo zaino: se è squadrato sfrutta quasi tutto il volume 40 × 30 × 20, lascia le mani libere e si comprime con le cinghie. Una borsa morbida si deforma e supera più facilmente la profondità." },
        { question: "Quante paia di scarpe portare per 3 giorni?", answer: "Due al massimo: quelle che indossi in volo e un paio leggero (sandali o scarpe da sera sottili) nello zaino. Un secondo paio di sneakers occupa circa 2,5 litri, più di un ottavo dello zaino." },
        { question: "La giacca conta nelle misure della borsa?", answer: "No, se la indossi. Il personale controlla la borsa, non quello che hai addosso: per questo conviene viaggiare con i capi più voluminosi." },
        { question: "E se lo zaino pieno non rientra al gate?", answer: "Devi pagare un supplemento per imbarcarlo, più caro che aggiungere il bagaglio in prenotazione. Misura lo zaino pieno a casa, soprattutto la profondità di 20 cm." },
      ],
      en: [
        { question: "Can I travel for 3 days with just the Ryanair backpack?", answer: "Yes. Three days take about 9 liters of items, which fit in a 15–20 L backpack within 40 × 30 × 20 cm, if you wear your bulkiest shoes, jacket and sweater on the plane." },
        { question: "Does a laptop fit in Ryanair's free backpack?", answer: "Yes, but it must go inside the one included bag: it isn't an extra item. A laptop up to 15” fits in a 40 × 30 × 20 backpack with a sleeve, leaving room for two or three days of light clothes." },
        { question: "Backpack or tote for the free bag?", answer: "For 3 days, a backpack: if it's boxy it uses almost all of the 40 × 30 × 20 volume, keeps your hands free and compresses with its straps. A soft tote loses its shape and exceeds the depth more easily." },
        { question: "How many pairs of shoes for 3 days?", answer: "Two at most: the ones you wear on the plane and a light pair (sandals or thin evening shoes) in the bag. A second pair of sneakers takes about 2.5 liters, more than an eighth of the bag." },
        { question: "Does my jacket count towards the bag size?", answer: "Not if you wear it. Staff check the bag, not what you have on: that's why it pays to travel in your bulkiest clothes." },
        { question: "What if the packed bag doesn't fit at the gate?", answer: "You pay a fee to check it in, which costs more than adding a bag when booking. Measure the packed bag at home, especially the 20 cm depth." },
      ],
    },
    cta: {
      label: { en: "Check your own list", it: "Prova con la tua lista" },
      text: { en: "Choose Ryanair, the days and what you're bringing: we'll tell you if the 40×30×20 bag is enough.", it: "Scegli Ryanair, i giorni e cosa porti: ti diciamo se la borsa 40×30×20 basta." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "easyjet-backpack-45x36x20",
    published: "2026-11-16",
    updated: "2026-11-16",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "easyJet backpack 45×36×20: sizes, how many liters and what fits",
      it: "Zaino easyJet 45×36×20: misure, quanti litri e cosa ci sta",
    },
    description: {
      en: "easyJet's free under-seat bag is 45×36×20 cm, bigger than Ryanair's: how many liters that really is, what fits for up to 5 days and how to pick a backpack that passes the gate.",
      it: "La borsa gratuita easyJet sotto il sedile misura 45×36×20 cm, più di quella Ryanair: quanti litri sono davvero, cosa ci sta per un viaggio fino a 5 giorni e come scegliere uno zaino che passa al gate.",
    },
    sections: {
      it: [
        {
          heading: "Le misure ufficiali easyJet",
          paragraphs: [
            "Ogni biglietto easyJet include un bagaglio a mano piccolo da mettere sotto il sedile davanti. Il trolley grande in cappelliera invece è un extra, salvo alcune tariffe e l'abbonamento easyJet Plus.",
            "Le regole dalla pagina ufficiale easyJet, verificate da noi l'11 novembre 2026:",
          ],
          table: airlineRulesTable("easyjet", "it", {
            personal: "Incluso in tutte le tariffe",
            cabin: "A pagamento (incluso con easyJet Plus e Inclusive Plus)",
          }),
          tip: "Per easyJet le misure includono ruote e maniglie. Le regole possono cambiare: controlla sempre la tua prenotazione prima di partire.",
        },
        {
          heading: "Quanti litri entrano in 45×36×20",
          paragraphs: [
            "45 × 36 × 20 cm fanno circa 32 litri, ma è il volume di una scatola. Uno zaino ha angoli arrotondati, imbottiture e tasche: lo spazio utile reale è di circa 25–27 litri.",
            "In pratica conviene cercare uno zaino dichiarato tra 20 e 26 litri, con misure esterne entro 45 × 36 × 20 cm. È circa un terzo in più della borsa gratuita Ryanair (40 × 30 × 20), abbastanza per qualche giorno in più.",
          ],
          table: {
            head: ["Capienza dichiarata", "Quanto ci sta", "Per easyJet"],
            rows: [
              ["Fino a 20 L", "2–3 notti", "Entra facilmente, ed è valido anche per Ryanair"],
              ["20–26 L", "4–5 notti con abiti leggeri", "La scelta ideale, se le misure esterne rientrano"],
              ["27–30 L", "Una settimana", "Al limite: solo se è squadrato e poco profondo"],
              ["Oltre 30 L", "Più di una settimana", "Troppo grande per la borsa gratuita"],
            ],
          },
        },
        {
          heading: "Cosa ci sta: la lista per 5 giorni",
          paragraphs: [
            `Con abiti leggeri e i capi più pesanti indossati in volo, 45 × 36 × 20 basta per cinque giorni. Gli oggetti qui sotto occupano circa ${liters(kitEstimate(easyjetFiveDayKit, 5).estimate.estimatedPackedVolumeLiters, "it")}: il nostro configuratore consiglia uno zaino da ${kitRange(easyjetFiveDayKit, 5)}.`,
          ],
          table: kitTable(easyjetFiveDayKit, 5, "it"),
          tip: `Viaggi per lavoro? Togli i sandali e aggiungi un laptop da 15”: il configuratore consiglia comunque ${kitRange(easyjetLaptopKit, 5)}, quindi entra nella borsa gratuita.`,
        },
        {
          heading: "Zaino o trolley piccolo?",
          paragraphs: [
            "easyJet accetta sotto il sedile anche un trolley piccolo, ma ruote e maniglie contano nelle misure e pesano: a parità di misure esterne, un trolley ha meno spazio utile e pesa di più a vuoto.",
            "Per questo, con la borsa gratuita, lo zaino è quasi sempre la scelta migliore: sfrutta tutti i 45 × 36 × 20 cm, si comprime con le cinghie e non ha parti rigide che superano le misure.",
          ],
        },
        {
          heading: "Cosa guardare prima di comprare",
          paragraphs: ["Molti zaini sono venduti come “compatibili easyJet”: conviene verificare. I dettagli che contano:"],
          list: [
            "Misure esterne dichiarate dal produttore, con lo zaino pieno: altezza, larghezza e profondità.",
            "Forma squadrata e apertura a libro: usi tutto lo spazio e lo prepari come una valigia.",
            "Profondità sotto 20 cm anche quando è pieno: è la misura che si supera più spesso.",
            "Tasche esterne piatte e cinghie di compressione.",
            "Peso a vuoto sotto 1,2 kg.",
            "Scomparto laptop imbottito, se lo usi anche per lavoro.",
          ],
          productPicks: true,
        },
        {
          heading: "Lo stesso zaino va bene anche per Ryanair e Wizz Air?",
          paragraphs: [
            "Non sempre. Ryanair e Wizz Air accettano gratis una borsa di 40 × 30 × 20 cm, più piccola di quella easyJet. Uno zaino da 45 × 36 × 20 pieno non entra nel loro misuratore.",
            "Se voli spesso con compagnie diverse, scegli uno zaino da 18–20 litri entro 40 × 30 × 20 cm: va bene con tutte. Se voli soprattutto easyJet, sfrutta lo spazio in più con uno zaino da 20–26 litri.",
          ],
        },
        {
          heading: "In breve",
          paragraphs: [
            "La borsa gratuita easyJet misura 45 × 36 × 20 cm, ruote e maniglie comprese: in uno zaino da 20–26 litri ci stanno fino a cinque giorni di abiti leggeri. Misura lo zaino pieno, soprattutto la profondità, e controlla sempre le regole della tua tariffa.",
          ],
        },
      ],
      en: [
        {
          heading: "easyJet's official sizes",
          paragraphs: [
            "Every easyJet ticket includes a small cabin bag that goes under the seat in front. The large overhead bag is an extra, except on some fares and with an easyJet Plus membership.",
            "The rules from easyJet's official page, checked by us on 11 November 2026:",
          ],
          table: airlineRulesTable("easyjet", "en", {
            personal: "Included in every fare",
            cabin: "Paid (included with easyJet Plus and Inclusive Plus)",
          }),
          tip: "For easyJet the sizes include wheels and handles. Rules can change: always check your booking before you travel.",
        },
        {
          heading: "How many liters fit in 45×36×20",
          paragraphs: [
            "45 × 36 × 20 cm is about 32 liters, but that's the volume of a box. A backpack has rounded corners, padding and pockets: the real usable space is about 25–27 liters.",
            "In practice, look for a backpack rated 20–26 liters with an outer size within 45 × 36 × 20 cm. That's about a third more than Ryanair's free bag (40 × 30 × 20), enough for a few extra days.",
          ],
          table: {
            head: ["Rated capacity", "What it holds", "For easyJet"],
            rows: [
              ["Up to 20 L", "2–3 nights", "Fits easily, and works for Ryanair too"],
              ["20–26 L", "4–5 nights with light clothes", "The sweet spot, if the outer size fits"],
              ["27–30 L", "A week", "Borderline: only if boxy and slim"],
              ["Over 30 L", "More than a week", "Too big for the free bag"],
            ],
          },
        },
        {
          heading: "What fits: a 5-day packing list",
          paragraphs: [
            `With light clothes and your heaviest items worn on the plane, 45 × 36 × 20 is enough for five days. The items below take about ${liters(kitEstimate(easyjetFiveDayKit, 5).estimate.estimatedPackedVolumeLiters, "en")}: our planner suggests a ${kitRange(easyjetFiveDayKit, 5)} backpack.`,
          ],
          table: kitTable(easyjetFiveDayKit, 5, "en"),
          tip: `Travelling for work? Swap the sandals for a 15” laptop: the planner still suggests ${kitRange(easyjetLaptopKit, 5)}, so it fits the free bag.`,
        },
        {
          heading: "Backpack or small trolley?",
          paragraphs: [
            "easyJet also accepts a small trolley under the seat, but wheels and handles count towards the size and add weight: for the same outer size, a trolley has less usable space and weighs more empty.",
            "That's why, for the free bag, a backpack is almost always the better choice: it uses the whole 45 × 36 × 20 cm, compresses with its straps and has no rigid parts sticking out.",
          ],
        },
        {
          heading: "What to check before you buy",
          paragraphs: ["Plenty of backpacks are sold as “easyJet compatible”: it's worth checking. The details that matter:"],
          list: [
            "The maker's stated outer size, packed: height, width and depth.",
            "A boxy shape and clamshell opening: you use all the space and pack it like a suitcase.",
            "Depth under 20 cm even when full: it's the size people exceed most often.",
            "Flat outer pockets and compression straps.",
            "Empty weight under 1.2 kg.",
            "A padded laptop sleeve, if you also use it for work.",
          ],
          productPicks: true,
        },
        {
          heading: "Does the same backpack work for Ryanair and Wizz Air?",
          paragraphs: [
            "Not always. Ryanair and Wizz Air take a free bag of 40 × 30 × 20 cm, smaller than easyJet's. A packed 45 × 36 × 20 backpack won't go in their sizer.",
            "If you fly with different airlines, pick an 18–20 liter backpack within 40 × 30 × 20 cm: it works with all of them. If you mostly fly easyJet, use the extra room with a 20–26 liter bag.",
          ],
        },
        {
          heading: "In short",
          paragraphs: [
            "easyJet's free bag is 45 × 36 × 20 cm, wheels and handles included: a 20–26 liter backpack holds up to five days of light clothes. Measure the bag packed, especially the depth, and always check your fare's rules.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Backpacks that fit 45×36×20", it: "Zaini che rientrano in 45×36×20" },
      intro: {
        en: "20–26 L travel backpacks, checked against easyJet's free-bag size when the maker states the dimensions.",
        it: "Zaini da viaggio da 20–26 L, confrontati con le misure della borsa gratuita easyJet quando il produttore le indica.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 20, max: 26 }, dimensionsCm: { height: 45, width: 36, depth: 20 } },
    },
    faq: {
      it: [
        { question: "Qual è la misura del bagaglio a mano gratuito easyJet?", answer: "45 × 36 × 20 cm, ruote e maniglie comprese, da mettere sotto il sedile davanti. Verifica sempre le regole della tua tariffa sul sito easyJet." },
        { question: "C'è un limite di peso per la borsa gratuita easyJet?", answer: "Sì, 15 kg. In più devi poterla sollevare e sistemare da solo." },
        { question: "Uno zaino da 25 litri va bene per easyJet?", answer: "Di solito sì, se le misure esterne dichiarate rientrano in 45 × 36 × 20 cm. Controlla soprattutto la profondità con lo zaino pieno." },
        { question: "Quanto costa il bagaglio a mano grande easyJet?", answer: "Il bagaglio da 56 × 45 × 25 cm in cappelliera è a pagamento e il prezzo cambia in base al volo. È incluso con easyJet Plus e con la tariffa Inclusive Plus." },
        { question: "Posso usare lo zaino easyJet anche su Ryanair?", answer: "Solo se rientra anche in 40 × 30 × 20 cm. Uno zaino che sfrutta tutti i 45 × 36 × 20 cm è troppo grande per la borsa gratuita Ryanair." },
        { question: "Gli zaini “compatibili easyJet” sono garantiti?", answer: "No, è un'indicazione del venditore. Confronta le misure esterne reali con quelle ufficiali e misura lo zaino pieno prima di partire." },
      ],
      en: [
        { question: "What size is easyJet's free cabin bag?", answer: "45 × 36 × 20 cm, wheels and handles included, under the seat in front. Always check your fare's rules on easyJet's site." },
        { question: "Is there a weight limit for easyJet's free bag?", answer: "Yes, 15 kg. You also need to be able to lift and stow it yourself." },
        { question: "Is a 25 liter backpack OK for easyJet?", answer: "Usually, if its stated outer size is within 45 × 36 × 20 cm. Check the depth with the bag packed." },
        { question: "How much is easyJet's large cabin bag?", answer: "The 56 × 45 × 25 cm overhead bag is paid and the price depends on the flight. It's included with easyJet Plus and the Inclusive Plus fare." },
        { question: "Can I use my easyJet backpack on Ryanair?", answer: "Only if it also fits 40 × 30 × 20 cm. A backpack that uses the full 45 × 36 × 20 cm is too big for Ryanair's free bag." },
        { question: "Are “easyJet compatible” backpacks guaranteed?", answer: "No, it's the seller's claim. Compare the real outer size with the official one and measure the bag packed before you travel." },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose easyJet, the days and what you're bringing: we'll tell you if the free bag is enough.", it: "Scegli easyJet, i giorni e cosa porti: ti diciamo se la borsa gratuita basta." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "wizz-air-backpack-40x30x20",
    published: "2026-11-16",
    updated: "2026-11-16",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "Wizz Air free bag 40×30×20: sizes, 10 kg limit and what fits",
      it: "Bagaglio gratuito Wizz Air 40×30×20: misure, limite di 10 kg e cosa ci sta",
    },
    description: {
      en: "Wizz Air's free under-seat bag: 40×30×20 cm and up to 10 kg. How many liters fit, how much a packed bag really weighs, and when WIZZ Priority is worth it.",
      it: "Il bagaglio gratuito Wizz Air sotto il sedile: 40×30×20 cm e fino a 10 kg. Quanti litri entrano, quanto pesa davvero uno zaino pieno e quando conviene WIZZ Priority.",
    },
    sections: {
      it: [
        {
          heading: "Le misure ufficiali Wizz Air",
          paragraphs: [
            "Ogni passeggero Wizz Air può portare gratis un bagaglio a mano da mettere sotto il sedile davanti: una borsa per laptop, una borsetta o uno zaino piccolo. Il trolley in cappelliera invece richiede WIZZ Priority.",
            "Le regole dalla pagina ufficiale Wizz Air, verificate da noi il 12 novembre 2026:",
          ],
          table: airlineRulesTable("wizz-air", "it", {
            personal: "Gratuito per tutti",
            cabin: "Con WIZZ Priority (a pagamento)",
          }),
          tip: "Per Wizz Air maniglie e ruote non sono conteggiate, ma le ruote possono aggiungere al massimo 5 cm. Le regole possono cambiare: controlla sempre la tua prenotazione.",
        },
        {
          heading: "La differenza con Ryanair: il limite di 10 kg",
          paragraphs: [
            "Le misure sono le stesse della borsa gratuita Ryanair, 40 × 30 × 20 cm. La differenza è il peso: Wizz Air indica un massimo di 10 kg, Ryanair non indica un limite.",
            "Lo spazio utile reale in uno zaino di quella misura è di circa 18–20 litri: cerca uno zaino dichiarato tra 16 e 20 litri con misure esterne entro 40 × 30 × 20 cm.",
          ],
        },
        {
          heading: "Quanto pesa davvero uno zaino pieno per 3 giorni",
          paragraphs: [
            `Il limite di 10 kg spaventa, ma con i vestiti è difficile superarlo. Ecco una lista per tre giorni d'estate con volume e peso di ogni oggetto: in tutto ${kilos(kitWeight(ryanairSummerKit), "it")}, a cui aggiungere il peso dello zaino vuoto (di solito 0,5–1 kg).`,
          ],
          table: kitTable(ryanairSummerKit, 3, "it", true),
          tip: `Con un laptop da 15” (circa 1,6 kg) arrivi a circa ${kilos(kitWeight(ryanairSummerKit) + 1.6 + 1, "it")} contando anche lo zaino: ancora ben sotto i 10 kg. A pesare sono beauty, scarpe e libri, non le magliette.`,
        },
        {
          heading: "Cosa ci sta in 40×30×20",
          paragraphs: ["Con abiti leggeri e i capi più ingombranti addosso in volo, la borsa gratuita basta per un weekend lungo:"],
          table: {
            head: ["Capienza dichiarata", "Quanto ci sta", "Per Wizz Air"],
            rows: [
              ["Fino a 15 L", "Un giorno, o un weekend essenziale", "Entra facilmente, anche pieno"],
              ["16–20 L", "2–3 notti con abiti leggeri", "La scelta ideale, se le misure esterne rientrano"],
              ["21–24 L", "3–4 notti", "Al limite: solo se è squadrato e non troppo pieno"],
              ["Oltre 24 L", "Una settimana", "Troppo grande per la borsa gratuita"],
            ],
          },
          tip: "Le scarpe più pesanti, la giacca e il maglione indossali in volo: non contano né nelle misure né nel peso della borsa.",
        },
        {
          heading: "Zaino o trolley piccolo sotto il sedile?",
          paragraphs: [
            "Wizz Air non conta maniglie e ruote nelle misure, ma le ruote possono aggiungere al massimo 5 cm. Un trolley piccolo è quindi ammesso, però pesa di più a vuoto e ha meno spazio utile di uno zaino con le stesse misure esterne.",
            "Con un limite di 10 kg ogni chilo conta: uno zaino leggero, sotto 1 kg a vuoto, ti lascia più margine per il contenuto.",
          ],
          productPicks: true,
        },
        {
          heading: "Quando conviene WIZZ Priority",
          paragraphs: [
            "WIZZ Priority aggiunge un trolley da 55 × 40 × 23 cm e fino a 10 kg in cappelliera, oltre alla borsa gratuita. Conviene quando il viaggio supera i 3–4 giorni, quando porti scarpe in più o attrezzatura, o in inverno con capi pesanti.",
            "Se aggiungi il bagaglio, fallo in prenotazione: al gate il supplemento per una borsa che non entra nel misuratore costa di più.",
          ],
        },
        {
          heading: "In breve",
          paragraphs: [
            "La borsa gratuita Wizz Air misura 40 × 30 × 20 cm e può pesare fino a 10 kg. Uno zaino da 16–20 litri, leggero e squadrato, basta per 2–3 notti e resta lontano dal limite di peso. Misuralo pieno, soprattutto la profondità, e controlla sempre la tua tariffa.",
          ],
        },
      ],
      en: [
        {
          heading: "Wizz Air's official sizes",
          paragraphs: [
            "Every Wizz Air passenger can bring a free carry-on that goes under the seat in front: a laptop bag, a purse or a small backpack. The overhead trolley needs WIZZ Priority.",
            "The rules from Wizz Air's official page, checked by us on 12 November 2026:",
          ],
          table: airlineRulesTable("wizz-air", "en", {
            personal: "Free for everyone",
            cabin: "With WIZZ Priority (paid)",
          }),
          tip: "For Wizz Air handles and wheels aren't counted, but wheels may add at most 5 cm. Rules can change: always check your booking.",
        },
        {
          heading: "The difference from Ryanair: the 10 kg limit",
          paragraphs: [
            "The size is the same as Ryanair's free bag, 40 × 30 × 20 cm. The difference is weight: Wizz Air states a 10 kg maximum, Ryanair states no limit.",
            "The real usable space in a backpack that size is about 18–20 liters: look for a bag rated 16–20 liters with an outer size within 40 × 30 × 20 cm.",
          ],
        },
        {
          heading: "How much a packed bag for 3 days really weighs",
          paragraphs: [
            `The 10 kg limit sounds scary, but with clothes it's hard to exceed. Here's a 3-day summer list with the volume and weight of every item: ${kilos(kitWeight(ryanairSummerKit), "en")} in all, plus the empty bag (usually 0.5–1 kg).`,
          ],
          table: kitTable(ryanairSummerKit, 3, "en", true),
          tip: `With a 15” laptop (about 1.6 kg) you reach about ${kilos(kitWeight(ryanairSummerKit) + 1.6 + 1, "en")} including the bag: still well under 10 kg. Toiletries, shoes and books are what weigh, not T-shirts.`,
        },
        {
          heading: "What fits in 40×30×20",
          paragraphs: ["With light clothes and your bulkiest items worn on the plane, the free bag is enough for a long weekend:"],
          table: {
            head: ["Rated capacity", "What it holds", "For Wizz Air"],
            rows: [
              ["Up to 15 L", "A day, or a minimal weekend", "Fits easily, even full"],
              ["16–20 L", "2–3 nights with light clothes", "The sweet spot, if the outer size fits"],
              ["21–24 L", "3–4 nights", "Borderline: only if boxy and not overstuffed"],
              ["Over 24 L", "A week", "Too big for the free bag"],
            ],
          },
          tip: "Wear your heaviest shoes, jacket and sweater on the plane: they count towards neither the size nor the weight of the bag.",
        },
        {
          heading: "Backpack or small trolley under the seat?",
          paragraphs: [
            "Wizz Air doesn't count handles and wheels, but wheels may add at most 5 cm. A small trolley is allowed, but it weighs more empty and has less usable space than a backpack with the same outer size.",
            "With a 10 kg limit every kilo counts: a light backpack, under 1 kg empty, leaves more room for what's inside.",
          ],
          productPicks: true,
        },
        {
          heading: "When WIZZ Priority is worth it",
          paragraphs: [
            "WIZZ Priority adds a 55 × 40 × 23 cm trolley of up to 10 kg in the overhead bin, on top of the free bag. It's worth it for trips longer than 3–4 days, when you bring extra shoes or gear, or in winter with heavy clothes.",
            "If you add the bag, do it when booking: at the gate, the fee for a bag that doesn't fit the sizer costs more.",
          ],
        },
        {
          heading: "In short",
          paragraphs: [
            "Wizz Air's free bag is 40 × 30 × 20 cm and up to 10 kg. A light, boxy 16–20 liter backpack holds 2–3 nights and stays well under the weight limit. Measure it packed, especially the depth, and always check your fare.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Backpacks for Wizz Air's free bag", it: "Zaini per il bagaglio gratuito Wizz Air" },
      intro: {
        en: "16–20 L travel backpacks, checked against the 40×30×20 size when the maker states the dimensions. Lighter bags rank higher.",
        it: "Zaini da viaggio da 16–20 L, confrontati con le misure 40×30×20 quando il produttore le indica. Gli zaini leggeri salgono in classifica.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 16, max: 20 }, dimensionsCm: { height: 40, width: 30, depth: 20 }, lightweight: true },
    },
    faq: {
      it: [
        { question: "Qual è la misura del bagaglio gratuito Wizz Air?", answer: "40 × 30 × 20 cm, da mettere sotto il sedile davanti, con un peso massimo di 10 kg. Verifica sempre le regole della tua tariffa sul sito Wizz Air." },
        { question: "Lo zaino Wizz Air viene pesato?", answer: "Il limite è di 10 kg e il personale può controllarlo. Con abiti per 2–3 giorni di solito si resta tra 5 e 7 kg, zaino compreso." },
        { question: "Posso portare un trolley piccolo gratis su Wizz Air?", answer: "Sì, se rientra in 40 × 30 × 20 cm. Maniglie e ruote non sono conteggiate, ma le ruote possono aggiungere al massimo 5 cm." },
        { question: "Cosa include WIZZ Priority?", answer: "Un trolley da 55 × 40 × 23 cm e fino a 10 kg in cappelliera, oltre al bagaglio gratuito sotto il sedile." },
        { question: "Lo stesso zaino va bene per Ryanair?", answer: "Sì: la borsa gratuita Ryanair ha le stesse misure, 40 × 30 × 20 cm. Va bene anche per easyJet, che accetta fino a 45 × 36 × 20 cm." },
        { question: "La giacca conta nel peso?", answer: "No, se la indossi. Viaggia con scarpe, giacca e maglione più pesanti addosso: non contano né nelle misure né nel peso." },
      ],
      en: [
        { question: "What size is Wizz Air's free bag?", answer: "40 × 30 × 20 cm, under the seat in front, up to 10 kg. Always check your fare's rules on Wizz Air's site." },
        { question: "Is the Wizz Air bag weighed?", answer: "The limit is 10 kg and staff can check it. With clothes for 2–3 days you're usually between 5 and 7 kg, bag included." },
        { question: "Can I bring a small trolley for free on Wizz Air?", answer: "Yes, if it fits 40 × 30 × 20 cm. Handles and wheels aren't counted, but wheels may add at most 5 cm." },
        { question: "What does WIZZ Priority include?", answer: "A 55 × 40 × 23 cm trolley of up to 10 kg in the overhead bin, on top of the free under-seat bag." },
        { question: "Does the same backpack work for Ryanair?", answer: "Yes: Ryanair's free bag has the same size, 40 × 30 × 20 cm. It works for easyJet too, which allows up to 45 × 36 × 20 cm." },
        { question: "Does my jacket count towards the weight?", answer: "Not if you wear it. Travel in your heaviest shoes, jacket and sweater: they count towards neither size nor weight." },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose Wizz Air, the days and what you're bringing: we'll tell you if the free bag is enough.", it: "Scegli Wizz Air, i giorni e cosa porti: ti diciamo se la borsa gratuita basta." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "vueling-cabin-bag-55x40x20",
    published: "2026-11-16",
    updated: "2026-11-16",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "Vueling hand luggage: free 40×30×20 bag and the 55×40×20 cabin bag",
      it: "Bagaglio a mano Vueling: borsa gratuita 40×30×20 e trolley 55×40×20",
    },
    description: {
      en: "Vueling's free under-seat bag is 40×30×20 cm; the overhead bag is 55×40×20 cm and 10 kg, paid. Why 20 cm deep matters, what fits and which bag to buy.",
      it: "Con Vueling la borsa gratuita sotto il sedile è 40×30×20 cm; il trolley in cappelliera è 55×40×20 cm e 10 kg, a pagamento. Perché i 20 cm di profondità contano, cosa ci sta e quale bagaglio comprare.",
    },
    sections: {
      it: [
        {
          heading: "Le misure ufficiali Vueling",
          paragraphs: [
            "Con tutte le tariffe Vueling (Fly Light, Fly, Fly Grande e Fly Pro) porti gratis una borsa sotto il sedile. Il secondo bagaglio, quello in cappelliera, si paga con il servizio “2 bagagli” oppure è incluso scegliendo i posti Space.",
            "Le regole dalla pagina ufficiale Vueling, verificate da noi il 12 novembre 2026:",
          ],
          table: airlineRulesTable("vueling", "it", { personal: "Gratuita in tutte le tariffe", cabin: "Servizio 2 bagagli o posti Space" }),
          tip: "Le regole possono cambiare: controlla sempre la tua prenotazione sul sito Vueling.",
        },
        {
          heading: "Attenzione: il trolley Vueling è profondo 20 cm, non 23",
          paragraphs: [
            "Quasi tutte le compagnie accettano trolley da 55 × 40 × 23 cm, e la maggior parte dei trolley in vendita è fatta su quella misura. Vueling chiede invece 20 cm di profondità: 3 cm in meno, che un trolley pieno supera facilmente.",
            "Se voli spesso con Vueling, cerca un trolley con profondità dichiarata di 20 cm (ruote comprese) o un borsone morbido che puoi schiacciare. Uno spessore di 20 cm va bene anche per tutte le altre compagnie.",
          ],
        },
        {
          heading: "Cosa ci sta nei due bagagli",
          paragraphs: [
            "La borsa gratuita da 40 × 30 × 20 cm è la stessa di Ryanair: circa 18–20 litri utili, abbastanza per 2–3 notti con abiti leggeri. Il trolley da 55 × 40 × 20 cm aggiunge circa 30–35 litri.",
            `Ecco una settimana di vestiti, con volume e peso di ogni oggetto. Il planner consiglia ${kitRange(cabinWeekKit, 7)} : entra nel solo trolley, e la borsa sotto il sedile resta libera per laptop e beauty.`,
          ],
          table: kitTable(cabinWeekKit, 7, "it", true),
          tip: "Il limite del trolley Vueling è 10 kg: un trolley rigido pesa già 2,5–3,5 kg a vuoto. Se sei vicino al limite, preferisci un modello leggero o un borsone.",
        },
        {
          heading: "Quale bagaglio scegliere",
          paragraphs: [
            "Se viaggi solo con la borsa gratuita: uno zaino da 16–20 litri con misure esterne entro 40 × 30 × 20 cm, lo stesso che useresti con Ryanair o Wizz Air.",
            "Se paghi il servizio 2 bagagli: un trolley o borsone da 55 × 40 × 20 cm, leggero, più uno zaino piccolo sotto il sedile.",
          ],
          productPicks: true,
        },
        {
          heading: "In breve",
          paragraphs: [
            "Con Vueling la borsa sotto il sedile (40 × 30 × 20 cm) è sempre gratuita. Il trolley in cappelliera (55 × 40 × 20 cm, 10 kg) si paga. Occhio ai 20 cm di profondità: molti trolley “da cabina” sono da 23 cm e non passano.",
          ],
        },
      ],
      en: [
        {
          heading: "Vueling's official sizes",
          paragraphs: [
            "Every Vueling fare (Fly Light, Fly, Fly Grande and Fly Pro) includes a free under-seat bag. The second bag, for the overhead bin, comes with the paid “2 bags” service or with Space seats.",
            "The rules from Vueling's official page, checked by us on 12 November 2026:",
          ],
          table: airlineRulesTable("vueling", "en", { personal: "Free on every fare", cabin: "2-bag service or Space seats" }),
          tip: "Rules can change: always check your booking on Vueling's site.",
        },
        {
          heading: "Watch out: Vueling's cabin bag is 20 cm deep, not 23",
          paragraphs: [
            "Most airlines accept 55 × 40 × 23 cm cabin bags, and most cabin trolleys are built to that size. Vueling asks for 20 cm of depth: 3 cm less, which a packed trolley easily exceeds.",
            "If you fly Vueling often, look for a trolley with a stated depth of 20 cm (wheels included) or a soft duffel you can squeeze. A 20 cm depth works for every other airline too.",
          ],
        },
        {
          heading: "What fits in the two bags",
          paragraphs: [
            "The 40 × 30 × 20 cm free bag is the same as Ryanair's: about 18–20 usable liters, enough for 2–3 nights with light clothes. The 55 × 40 × 20 cm cabin bag adds about 30–35 liters.",
            `Here's a week of clothes, with the volume and weight of every item. The planner suggests ${kitRange(cabinWeekKit, 7)} : it fits in the cabin bag alone, leaving the under-seat bag for your laptop and toiletries.`,
          ],
          table: kitTable(cabinWeekKit, 7, "en", true),
          tip: "Vueling's cabin bag limit is 10 kg: a hard-shell trolley already weighs 2.5–3.5 kg empty. If you're close to the limit, pick a light model or a duffel.",
        },
        {
          heading: "Which bag to choose",
          paragraphs: [
            "Travelling with the free bag only: a 16–20 liter backpack with an outer size within 40 × 30 × 20 cm, the same you'd use on Ryanair or Wizz Air.",
            "Paying for the 2-bag service: a light 55 × 40 × 20 cm trolley or duffel, plus a small backpack under the seat.",
          ],
          productPicks: true,
        },
        {
          heading: "In short",
          paragraphs: [
            "On Vueling the under-seat bag (40 × 30 × 20 cm) is always free. The overhead bag (55 × 40 × 20 cm, 10 kg) is paid. Mind the 20 cm depth: many “cabin” trolleys are 23 cm and won't pass.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Backpacks for Vueling's free bag", it: "Zaini per la borsa gratuita Vueling" },
      intro: {
        en: "16–20 L travel backpacks, checked against the 40×30×20 size when the maker states the dimensions.",
        it: "Zaini da viaggio da 16–20 L, confrontati con le misure 40×30×20 quando il produttore le indica.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 16, max: 20 }, dimensionsCm: { height: 40, width: 30, depth: 20 } },
    },
    faq: {
      it: [
        { question: "Qual è la misura del bagaglio a mano gratuito Vueling?", answer: "40 × 30 × 20 cm, da mettere sotto il sedile davanti. È incluso in tutte le tariffe." },
        { question: "Quanto misura il trolley Vueling in cappelliera?", answer: "55 × 40 × 20 cm e fino a 10 kg. Si aggiunge con il servizio 2 bagagli o è incluso con i posti Space." },
        { question: "Un trolley 55×40×23 va bene per Vueling?", answer: "Sulla carta no: Vueling indica 20 cm di profondità. Se il trolley non entra nel misuratore, al gate può essere mandato in stiva a pagamento." },
        { question: "Lo zaino Ryanair va bene per Vueling?", answer: "Sì: la borsa gratuita ha le stesse misure, 40 × 30 × 20 cm." },
        { question: "Il trolley Vueling viene pesato?", answer: "Il limite è 10 kg e può essere controllato. Un trolley leggero ti lascia più margine per il contenuto." },
      ],
      en: [
        { question: "What size is Vueling's free hand luggage?", answer: "40 × 30 × 20 cm, under the seat in front. It's included in every fare." },
        { question: "What size is Vueling's overhead cabin bag?", answer: "55 × 40 × 20 cm and up to 10 kg. Add it with the 2-bag service, or get it with Space seats." },
        { question: "Is a 55×40×23 trolley OK on Vueling?", answer: "On paper, no: Vueling states 20 cm of depth. If the trolley doesn't fit the sizer, it may go in the hold for a fee at the gate." },
        { question: "Does a Ryanair backpack work on Vueling?", answer: "Yes: the free bag has the same size, 40 × 30 × 20 cm." },
        { question: "Is the Vueling cabin bag weighed?", answer: "The limit is 10 kg and it can be checked. A light trolley leaves more room for what's inside." },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose Vueling, the days and what you're bringing: we'll tell you which bag you need.", it: "Scegli Vueling, i giorni e cosa porti: ti diciamo quale bagaglio ti serve." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "ita-airways-hand-luggage",
    published: "2026-11-17",
    updated: "2026-11-17",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "ITA Airways hand luggage: 55×40×23 cabin bag, 8 kg and personal item",
      it: "Bagaglio a mano ITA Airways: trolley 55×40×23, 8 kg e accessorio personale",
    },
    description: {
      en: "ITA Airways allows a 55×40×23 cm cabin bag up to 8 kg plus a 40×30×15 cm personal item. How to stay under 8 kg, what fits for a week and which bags to choose.",
      it: "ITA Airways ammette un trolley 55×40×23 cm fino a 8 kg più un accessorio 40×30×15 cm. Come restare sotto gli 8 kg, cosa ci sta per una settimana e quali bagagli scegliere.",
    },
    sections: {
      it: [
        {
          heading: "Le misure ufficiali ITA Airways",
          paragraphs: [
            "In Economy ITA Airways prevede un bagaglio a mano in cappelliera e un accessorio personale sotto il sedile: una borsa, uno zaino piccolo o un porta laptop. Se il trolley sia incluso dipende dalla tariffa che compri.",
            "Le regole dalla pagina ufficiale ITA Airways, verificate da noi il 12 novembre 2026:",
          ],
          table: airlineRulesTable("ita-airways", "it", { personal: "Incluso", cabin: "In base alla tariffa" }),
          tip: "Con ITA le misure del trolley comprendono maniglie, tasche laterali e ruote. Alcune pagine meno recenti indicano 35 cm di larghezza invece di 40: controlla sempre la tua prenotazione.",
        },
        {
          heading: "Il vero limite è il peso: 8 kg",
          paragraphs: [
            "La misura 55 × 40 × 23 cm è quella standard, quindi quasi ogni trolley da cabina va bene. Il punto critico sono gli 8 kg: un trolley rigido pesa 2,5–3,5 kg a vuoto e ti lascia solo 5 kg per il contenuto.",
            "Un trolley morbido o un borsone da 1,5–2 kg cambia molto: guadagni 1–2 kg di vestiti. L'accessorio personale invece non ha un limite di peso indicato: lì vanno le cose pesanti come laptop e beauty.",
          ],
        },
        {
          heading: "Una settimana in cabina: volume e peso",
          paragraphs: [
            `Ecco una lista per sette giorni con volume e peso di ogni oggetto. In tutto pesa ${kilos(kitWeight(cabinWeekKit), "it")}, e il planner consiglia ${kitRange(cabinWeekKit, 7)} di spazio.`,
          ],
          table: kitTable(cabinWeekKit, 7, "it", true),
          tip: `Con un trolley rigido da 3 kg arriveresti a circa ${kilos(kitWeight(cabinWeekKit) + 3, "it")}: troppo. Sposta beauty, caricatori e documenti nell'accessorio e indossa le sneakers in volo, e il trolley torna sotto gli 8 kg.`,
        },
        {
          heading: "Come dividere tra trolley e accessorio",
          list: [
            "Nel trolley: vestiti, pigiama, scarpe leggere di ricambio.",
            "Nell'accessorio (40 × 30 × 15 cm): laptop, beauty con i liquidi, caricatori, powerbank, documenti.",
            "Addosso: scarpe più pesanti, giacca e maglione.",
          ],
          paragraphs: ["Così il trolley resta leggero e le cose che servono ai controlli di sicurezza sono già a portata di mano."],
        },
        {
          heading: "Quale bagaglio scegliere",
          paragraphs: [
            "Per il trolley: un modello da 55 × 40 × 23 cm, ruote comprese, che pesi sotto i 2,5 kg. Per l'accessorio: uno zaino da 12–15 litri, profondo al massimo 15 cm, che sotto il sedile entra senza problemi.",
          ],
          productPicks: true,
        },
        {
          heading: "In breve",
          paragraphs: [
            "Con ITA Airways porti un trolley da 55 × 40 × 23 cm fino a 8 kg (in base alla tariffa) più un accessorio da 40 × 30 × 15 cm. Le misure sono standard, il peso no: scegli un trolley leggero e metti le cose pesanti nell'accessorio.",
          ],
        },
      ],
      en: [
        {
          heading: "ITA Airways' official sizes",
          paragraphs: [
            "In Economy, ITA Airways allows a cabin bag for the overhead bin and a personal item under the seat: a handbag, small backpack or laptop bag. Whether the cabin bag is included depends on the fare you buy.",
            "The rules from ITA Airways' official page, checked by us on 12 November 2026:",
          ],
          table: airlineRulesTable("ita-airways", "en", { personal: "Included", cabin: "Depends on the fare" }),
          tip: "With ITA the cabin bag size includes handles, side pockets and wheels. A few older pages state a 35 cm width instead of 40: always check your booking.",
        },
        {
          heading: "The real limit is weight: 8 kg",
          paragraphs: [
            "55 × 40 × 23 cm is the standard size, so almost any cabin trolley fits. The tricky part is 8 kg: a hard-shell trolley weighs 2.5–3.5 kg empty and leaves you only 5 kg for what's inside.",
            "A soft trolley or duffel of 1.5–2 kg makes a big difference: you gain 1–2 kg of clothes. The personal item has no stated weight limit: that's where heavy things like your laptop and toiletries go.",
          ],
        },
        {
          heading: "A week in the cabin: volume and weight",
          paragraphs: [
            `Here's a 7-day list with the volume and weight of every item. It weighs ${kilos(kitWeight(cabinWeekKit), "en")} in all, and the planner suggests ${kitRange(cabinWeekKit, 7)} of space.`,
          ],
          table: kitTable(cabinWeekKit, 7, "en", true),
          tip: `With a 3 kg hard-shell trolley you'd reach about ${kilos(kitWeight(cabinWeekKit) + 3, "en")}: too much. Move toiletries, chargers and documents to the personal item and wear the sneakers on the plane, and the trolley is back under 8 kg.`,
        },
        {
          heading: "How to split between cabin bag and personal item",
          list: [
            "In the cabin bag: clothes, sleepwear, light spare shoes.",
            "In the personal item (40 × 30 × 15 cm): laptop, toiletries with liquids, chargers, power bank, documents.",
            "On you: your heaviest shoes, jacket and sweater.",
          ],
          paragraphs: ["The trolley stays light, and what you need at security is already at hand."],
        },
        {
          heading: "Which bags to choose",
          paragraphs: [
            "For the cabin bag: a 55 × 40 × 23 cm model, wheels included, weighing under 2.5 kg. For the personal item: a 12–15 liter backpack, at most 15 cm deep, that slides under the seat easily.",
          ],
          productPicks: true,
        },
        {
          heading: "In short",
          paragraphs: [
            "On ITA Airways you bring a 55 × 40 × 23 cm cabin bag up to 8 kg (depending on the fare) plus a 40 × 30 × 15 cm personal item. The size is standard, the weight isn't: pick a light trolley and put heavy things in the personal item.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Light cabin trolleys for ITA Airways", it: "Trolley leggeri per ITA Airways" },
      intro: {
        en: "Cabin trolleys within 55×40×23 cm when the maker states the dimensions. Lighter models rank higher, to stay under 8 kg.",
        it: "Trolley da cabina entro 55×40×23 cm quando il produttore indica le misure. I modelli leggeri salgono in classifica, per restare sotto gli 8 kg.",
      },
      criteria: { productKind: "cabin-trolley", capacityRangeLiters: { min: 30, max: 40 }, dimensionsCm: { height: 55, width: 40, depth: 23 }, lightweight: true },
    },
    faq: {
      it: [
        { question: "Quali sono le misure del bagaglio a mano ITA Airways?", answer: "55 × 40 × 23 cm, maniglie, tasche e ruote comprese, con un peso massimo di 8 kg. In più un accessorio personale da 40 × 30 × 15 cm." },
        { question: "Il bagaglio a mano è incluso in tutte le tariffe ITA?", answer: "Dipende dalla tariffa: controlla cosa include la tua al momento della prenotazione sul sito ITA Airways." },
        { question: "L'accessorio personale ITA ha un limite di peso?", answer: "La fonte ufficiale che abbiamo controllato non indica un peso per l'accessorio, solo le misure: 40 × 30 × 15 cm." },
        { question: "Come resto sotto gli 8 kg?", answer: "Scegli un trolley leggero (sotto 2,5 kg), metti laptop e beauty nell'accessorio e indossa in volo scarpe e giacca più pesanti." },
        { question: "Uno zaino da 40×30×20 va bene come accessorio ITA?", answer: "È più profondo del limite di 15 cm. Se è morbido e non troppo pieno di solito passa, ma per stare tranquillo scegli uno zaino profondo al massimo 15 cm." },
      ],
      en: [
        { question: "What size is ITA Airways hand luggage?", answer: "55 × 40 × 23 cm, handles, pockets and wheels included, up to 8 kg. Plus a 40 × 30 × 15 cm personal item." },
        { question: "Is the cabin bag included in every ITA fare?", answer: "It depends on the fare: check what yours includes when booking on ITA Airways' site." },
        { question: "Does the ITA personal item have a weight limit?", answer: "The official source we checked states no weight for the personal item, only the size: 40 × 30 × 15 cm." },
        { question: "How do I stay under 8 kg?", answer: "Pick a light trolley (under 2.5 kg), put your laptop and toiletries in the personal item, and wear your heaviest shoes and jacket on the plane." },
        { question: "Is a 40×30×20 backpack OK as an ITA personal item?", answer: "It's deeper than the 15 cm limit. A soft, not overstuffed one usually passes, but to be safe pick a backpack at most 15 cm deep." },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose ITA Airways, the days and what you're bringing: we'll tell you if the cabin bag is enough.", it: "Scegli ITA Airways, i giorni e cosa porti: ti diciamo se il bagaglio a mano basta." },
      href: "/luggage-configurator",
    },
  },
  {
    slug: "british-airways-cabin-bag-size",
    published: "2026-11-17",
    updated: "2026-11-17",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "British Airways cabin bag size and weight: 56×45×25 plus a free handbag",
      it: "Bagaglio a mano British Airways: misure 56×45×25 e borsa extra inclusa",
    },
    description: {
      en: "British Airways includes a 56×45×25 cm cabin bag and a 40×30×15 cm handbag or backpack on every fare. Weight, what fits for a week and which bags to choose.",
      it: "British Airways include un bagaglio a mano da 56×45×25 cm e una borsa o zaino da 40×30×15 cm in tutte le tariffe. Peso, cosa ci sta per una settimana e quali bagagli scegliere.",
    },
    sections: {
      it: [
        {
          heading: "Le misure ufficiali British Airways",
          paragraphs: [
            "British Airways è tra le compagnie più generose in cabina: con ogni biglietto, anche il più economico, porti un bagaglio a mano in cappelliera e una borsa o uno zaino sotto il sedile.",
            "Le regole dalla pagina ufficiale British Airways, verificate da noi il 12 novembre 2026:",
          ],
          table: airlineRulesTable("british-airways", "it", { personal: "Incluso", cabin: "Incluso" }),
          tip: "Le misure del bagaglio a mano comprendono ruote e maniglie. Sui voli in codeshare operati da altre compagnie valgono le loro regole: controlla chi opera il volo.",
        },
        {
          heading: "Quanto può pesare",
          paragraphs: [
            "British Airways è conosciuta per un limite molto alto: fino a 23 kg per bagaglio, a patto che tu riesca a sollevarlo da solo in cappelliera. La pagina che abbiamo controllato non riporta il peso, quindi verificalo nella tua prenotazione.",
            "In pratica il limite vero è lo spazio, non il peso: un trolley pieno da 56 × 45 × 25 cm raramente supera i 12–14 kg.",
          ],
        },
        {
          heading: "Cosa ci sta: una settimana e oltre",
          paragraphs: [
            `Un trolley da 56 × 45 × 25 cm ha circa 40–45 litri utili, più dei soliti 55 × 40 × 23. Ecco una lista per sette giorni: il planner consiglia ${kitRange(cabinWeekKit, 7)}, quindi ci sta con margine, anche senza usare la borsa sotto il sedile.`,
          ],
          table: kitTable(cabinWeekKit, 7, "it", true),
          tip: "Con la borsa extra da 40 × 30 × 15 cm (circa 12–15 litri) arrivi a 10–12 giorni con abiti leggeri, senza imbarcare nulla.",
        },
        {
          heading: "Un trolley 55×40×23 va bene?",
          paragraphs: [
            "Sì: è più piccolo del limite BA, quindi entra senza problemi. Se però voli spesso con British Airways, un trolley fino a 56 × 45 × 25 cm sfrutta tutto lo spazio.",
            "Attenzione: un trolley da 56 × 45 × 25 cm è troppo grande per molte altre compagnie, che accettano 55 × 40 × 23. Se voli anche low cost, il 55 × 40 × 23 resta la scelta più versatile.",
          ],
          productPicks: true,
        },
        {
          heading: "Sui voli pieni il trolley può finire in stiva",
          paragraphs: [
            "Sui voli molto pieni British Airways può chiedere di spostare in stiva alcuni bagagli a mano, gratis, al gate. Tieni sempre nella borsa sotto il sedile documenti, medicinali, laptop, powerbank e oggetti di valore.",
          ],
        },
        {
          heading: "In breve",
          paragraphs: [
            "Con British Airways porti un bagaglio a mano da 56 × 45 × 25 cm e una borsa da 40 × 30 × 15 cm, inclusi in ogni tariffa. Lo spazio basta per una settimana e oltre; il peso raramente è un problema. Se voli anche con altre compagnie, un trolley 55 × 40 × 23 va bene ovunque.",
          ],
        },
      ],
      en: [
        {
          heading: "British Airways' official sizes",
          paragraphs: [
            "British Airways is one of the most generous airlines in the cabin: every ticket, even the cheapest, includes a cabin bag for the overhead bin and a handbag or backpack under the seat.",
            "The rules from British Airways' official page, checked by us on 12 November 2026:",
          ],
          table: airlineRulesTable("british-airways", "en", { personal: "Included", cabin: "Included" }),
          tip: "The cabin bag size includes wheels and handles. On codeshare flights operated by other airlines, their rules apply: check who operates your flight.",
        },
        {
          heading: "How much it can weigh",
          paragraphs: [
            "British Airways is known for a very high limit: up to 23 kg per bag, as long as you can lift it into the overhead bin yourself. The page we checked doesn't state the weight, so confirm it in your booking.",
            "In practice the real limit is space, not weight: a packed 56 × 45 × 25 cm trolley rarely goes over 12–14 kg.",
          ],
        },
        {
          heading: "What fits: a week and more",
          paragraphs: [
            `A 56 × 45 × 25 cm trolley holds about 40–45 usable liters, more than the usual 55 × 40 × 23. Here's a 7-day list: the planner suggests ${kitRange(cabinWeekKit, 7)}, so it fits with room to spare, even without the under-seat bag.`,
          ],
          table: kitTable(cabinWeekKit, 7, "en", true),
          tip: "With the extra 40 × 30 × 15 cm bag (about 12–15 liters) you reach 10–12 days with light clothes, without checking anything.",
        },
        {
          heading: "Is a 55×40×23 trolley OK?",
          paragraphs: [
            "Yes: it's smaller than BA's limit, so it fits easily. If you fly British Airways often, though, a trolley up to 56 × 45 × 25 cm uses all the space.",
            "Careful: a 56 × 45 × 25 cm trolley is too big for many other airlines, which accept 55 × 40 × 23. If you also fly low cost, 55 × 40 × 23 stays the most versatile choice.",
          ],
          productPicks: true,
        },
        {
          heading: "On full flights the trolley may go in the hold",
          paragraphs: [
            "On very full flights British Airways may ask to move some cabin bags to the hold, free of charge, at the gate. Always keep documents, medicines, laptop, power bank and valuables in the under-seat bag.",
          ],
        },
        {
          heading: "In short",
          paragraphs: [
            "On British Airways you bring a 56 × 45 × 25 cm cabin bag and a 40 × 30 × 15 cm handbag, included on every fare. The space holds a week and more; weight is rarely a problem. If you fly other airlines too, a 55 × 40 × 23 trolley works everywhere.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Cabin trolleys for British Airways", it: "Trolley da cabina per British Airways" },
      intro: {
        en: "Cabin trolleys within 55×40×23 cm when the maker states the dimensions: they fit British Airways and almost every other airline.",
        it: "Trolley da cabina entro 55×40×23 cm quando il produttore indica le misure: vanno bene per British Airways e per quasi tutte le altre compagnie.",
      },
      criteria: { productKind: "cabin-trolley", capacityRangeLiters: { min: 35, max: 45 }, dimensionsCm: { height: 55, width: 40, depth: 23 } },
    },
    faq: {
      it: [
        { question: "Qual è la misura del bagaglio a mano British Airways?", answer: "56 × 45 × 25 cm, ruote e maniglie comprese, più una borsa o zaino da 40 × 30 × 15 cm sotto il sedile." },
        { question: "Il bagaglio a mano è incluso anche nella tariffa base BA?", answer: "Sì: con British Airways bagaglio a mano e borsa sono inclusi in tutte le tariffe, anche quelle senza bagaglio da stiva." },
        { question: "Quanto può pesare il bagaglio a mano British Airways?", answer: "BA è nota per un limite di 23 kg per bagaglio, purché tu lo sollevi da solo in cappelliera. Verificalo nella tua prenotazione." },
        { question: "Un trolley 55×40×23 va bene per British Airways?", answer: "Sì, è più piccolo del limite di 56 × 45 × 25 cm." },
        { question: "Il duty free conta nel bagaglio a mano?", answer: "Sì: gli acquisti duty free devono entrare nei due bagagli consentiti." },
      ],
      en: [
        { question: "What is the British Airways cabin bag size?", answer: "56 × 45 × 25 cm, wheels and handles included, plus a 40 × 30 × 15 cm handbag or backpack under the seat." },
        { question: "Is a cabin bag included on BA's basic fare?", answer: "Yes: on British Airways the cabin bag and handbag are included on every fare, even those without checked baggage." },
        { question: "How much can a British Airways cabin bag weigh?", answer: "BA is known for a 23 kg limit per bag, as long as you can lift it into the overhead bin yourself. Confirm it in your booking." },
        { question: "Is a 55×40×23 trolley OK for British Airways?", answer: "Yes, it's smaller than the 56 × 45 × 25 cm limit." },
        { question: "Does duty free count towards hand luggage?", answer: "Yes: duty free purchases must fit in your two allowed bags." },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose British Airways, the days and what you're bringing: we'll tell you if hand luggage is enough.", it: "Scegli British Airways, i giorni e cosa porti: ti diciamo se il bagaglio a mano basta." },
      href: "/luggage-configurator",
    },
  },
  {
    slug: "best-ryanair-backpacks-40x30x20",
    published: "2026-11-18",
    updated: "2026-11-18",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "Best Ryanair backpacks 40×30×20: what to check before buying",
      it: "Migliori zaini per Ryanair 40×30×20: cosa controllare prima di comprare",
    },
    description: {
      en: "How to pick a backpack for Ryanair's free 40×30×20 bag: shape, depth when packed, empty weight and opening. A checklist, the bag types compared and real backpacks that fit.",
      it: "Come scegliere lo zaino per la borsa gratuita Ryanair 40×30×20: forma, profondità da pieno, peso a vuoto e apertura. Checklist, tipi di zaino a confronto e zaini veri che rientrano.",
    },
    sections: {
      it: [
        {
          heading: "Le misure da rispettare",
          paragraphs: [
            "Con il biglietto base Ryanair porti gratis una sola borsa da mettere sotto il sedile davanti. Le regole dalla pagina ufficiale, verificate da noi il 12 novembre 2026:",
          ],
          table: airlineRulesTable("ryanair", "it", { personal: "Gratuita per tutti", cabin: "A pagamento (Priority e 2 bagagli a mano)" }),
          illustration: "sizer-40x30x20",
          tip: "Lo stesso zaino va bene anche per Wizz Air e Vueling (stesse misure) e per easyJet, che accetta fino a 45 × 36 × 20 cm.",
        },
        {
          heading: "Conta la misura esterna, non i litri",
          paragraphs: [
            "I litri dichiarati dai produttori sono generosi e calcolati in modo diverso da marca a marca: uno zaino da \"28 L\" può entrare nel misuratore, uno da \"20 L\" con tasche sporgenti no. Guarda sempre le misure esterne indicate dal produttore.",
            "Un parallelepipedo di 40 × 30 × 20 cm contiene 24 litri: è il massimo teorico. Nella pratica uno zaino che rientra davvero ha 18–22 litri utili.",
          ],
        },
        {
          heading: "Il punto debole: la profondità da pieno",
          paragraphs: [
            "Quasi tutti gli zaini respinti al gate sforano in profondità, non in altezza. Uno zaino morbido vuoto è profondo 18 cm; riempito fino all'orlo si gonfia e supera i 20 cm.",
          ],
          illustration: "packed-depth",
          tip: "Prima di partire riempilo come in viaggio e misuralo appoggiato a un muro: se la profondità supera i 20 cm, togli qualcosa o indossalo.",
        },
        {
          heading: "La checklist dello zaino giusto",
          paragraphs: ["Prima di comprare, controlla questi punti:"],
          table: {
            head: ["Cosa", "Perché conta", "Da cercare"],
            rows: [
              ["Forma squadrata", "Sfrutta tutto il misuratore, angoli compresi", "Pareti dritte, fondo piatto"],
              ["Profondità", "È la misura che sfora per prima", "20 cm dichiarati, meglio 18"],
              ["Peso a vuoto", "Meno peso dello zaino, più spazio per te", "Sotto 1 kg, ideale 0,5–0,8 kg"],
              ["Apertura a valigia", "Fai e disfi lo zaino come una valigia", "Zip su tre lati"],
              ["Cinghie di compressione", "Tengono la profondità sotto controllo", "Interne o esterne"],
              ["Tasca laptop", "Se lavori in viaggio", "Imbottita, verso la schiena"],
              ["Niente tasche rigide sporgenti", "Aggiungono centimetri", "Tasche piatte o interne"],
            ],
          },
        },
        {
          heading: "Tipi di zaino a confronto",
          paragraphs: [],
          table: {
            head: ["Tipo", "Pro", "Contro"],
            rows: [
              ["Zaino da cabina ultraleggero (es. CabinZero)", "Leggero, squadrato, apertura a valigia", "Tessuto morbido: si gonfia se lo riempi troppo"],
              ["Zaino porta PC 20 L", "Tasca imbottita, ordinato", "Spesso più pesante, poca capienza per i vestiti"],
              ["Zaino da escursionismo 20 L", "Comodo da portare, robusto", "Forma a goccia: spreca spazio nel misuratore"],
              ["Trolley sotto il sedile", "Si trascina", "Pesante a vuoto, meno spazio utile"],
            ],
          },
          tip: "Un esempio di misure dichiarate: il CabinZero Classic 28L è 39 × 29,5 × 20 cm e pesa 600 g. Il nostro confronto tra le misure CabinZero è nella guida dedicata.",
        },
        {
          heading: "Zaini che rientrano nelle misure",
          paragraphs: [
            "Qui sotto trovi zaini veri dai negozi, confrontati con le misure 40 × 30 × 20 quando il produttore le indica. Proponiamo anche zaini con più litri dichiarati, se le misure esterne rientrano.",
          ],
          productPicks: true,
        },
        {
          heading: "In breve",
          paragraphs: [
            "Per Ryanair cerca uno zaino squadrato con misure esterne entro 40 × 30 × 20 cm, leggero (sotto 1 kg) e con apertura a valigia. Ignora i litri dichiarati, controlla la profondità da pieno e misuralo prima di partire.",
          ],
        },
      ],
      en: [
        {
          heading: "The sizes to respect",
          paragraphs: [
            "On a basic Ryanair fare you bring one free bag that goes under the seat in front. The rules from the official page, checked by us on 12 November 2026:",
          ],
          table: airlineRulesTable("ryanair", "en", { personal: "Free for everyone", cabin: "Paid (Priority & 2 cabin bags)" }),
          illustration: "sizer-40x30x20",
          tip: "The same backpack works for Wizz Air and Vueling (same size) and for easyJet, which allows up to 45 × 36 × 20 cm.",
        },
        {
          heading: "Outer size counts, not liters",
          paragraphs: [
            "Makers' liters are generous and measured differently by each brand: a \"28 L\" backpack can fit the sizer, while a \"20 L\" one with bulging pockets doesn't. Always check the outer size the maker states.",
            "A 40 × 30 × 20 cm box holds 24 liters: that's the theoretical maximum. In practice a bag that really fits has 18–22 usable liters.",
          ],
        },
        {
          heading: "The weak spot: depth when packed",
          paragraphs: [
            "Most bags turned away at the gate fail on depth, not height. A soft backpack is 18 cm deep empty; stuffed to the brim it bulges past 20 cm.",
          ],
          illustration: "packed-depth",
          tip: "Before you go, pack it as for the trip and measure it against a wall: if it's deeper than 20 cm, take something out or wear it.",
        },
        {
          heading: "The checklist for the right bag",
          paragraphs: ["Before buying, check these points:"],
          table: {
            head: ["What", "Why it matters", "Look for"],
            rows: [
              ["Boxy shape", "Uses the whole sizer, corners included", "Straight sides, flat bottom"],
              ["Depth", "It's the first measurement to fail", "20 cm stated, 18 is better"],
              ["Empty weight", "Less bag weight, more room for you", "Under 1 kg, ideally 0.5–0.8 kg"],
              ["Clamshell opening", "Pack and unpack it like a suitcase", "Zip on three sides"],
              ["Compression straps", "Keep the depth in check", "Inside or outside"],
              ["Laptop sleeve", "If you work while travelling", "Padded, against your back"],
              ["No rigid bulging pockets", "They add centimetres", "Flat or internal pockets"],
            ],
          },
        },
        {
          heading: "Bag types compared",
          paragraphs: [],
          table: {
            head: ["Type", "Pros", "Cons"],
            rows: [
              ["Ultralight cabin backpack (e.g. CabinZero)", "Light, boxy, clamshell opening", "Soft fabric: bulges if overfilled"],
              ["20 L laptop backpack", "Padded sleeve, tidy", "Often heavier, little room for clothes"],
              ["20 L hiking daypack", "Comfortable, sturdy", "Teardrop shape: wastes space in the sizer"],
              ["Under-seat trolley", "You can wheel it", "Heavy empty, less usable space"],
            ],
          },
          tip: "An example of stated sizes: the CabinZero Classic 28L is 39 × 29.5 × 20 cm and weighs 600 g. Our comparison of CabinZero sizes is in its own guide.",
        },
        {
          heading: "Backpacks that fit the size",
          paragraphs: [
            "Below are real backpacks from shops, checked against 40 × 30 × 20 when the maker states the size. We also show bags rated at more liters, as long as their outer size fits.",
          ],
          productPicks: true,
        },
        {
          heading: "In short",
          paragraphs: [
            "For Ryanair, look for a boxy backpack with an outer size within 40 × 30 × 20 cm, light (under 1 kg) and with a clamshell opening. Ignore the stated liters, check the depth when packed and measure it before you go.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "Backpacks for Ryanair's free bag", it: "Zaini per la borsa gratuita Ryanair" },
      intro: {
        en: "Travel backpacks checked against 40×30×20 cm when the maker states the size. Lighter bags rank higher.",
        it: "Zaini da viaggio confrontati con 40×30×20 cm quando il produttore indica le misure. Gli zaini leggeri salgono in classifica.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 16, max: 22 }, dimensionsCm: { height: 40, width: 30, depth: 20 }, lightweight: true },
    },
    faq: {
      it: [
        { question: "Qual è il miglior zaino per Ryanair?", answer: "Quello con misure esterne entro 40 × 30 × 20 cm, forma squadrata, peso sotto 1 kg e apertura a valigia. Più dei litri o della marca conta che rientri nel misuratore anche pieno." },
        { question: "Uno zaino da 28 litri va bene per Ryanair?", answer: "Sì, se le misure esterne rientrano in 40 × 30 × 20 cm: per esempio il CabinZero Classic 28L dichiara 39 × 29,5 × 20 cm. Attenzione a non riempirlo troppo: la profondità aumenta." },
        { question: "Ryanair controlla davvero le misure dello zaino?", answer: "Al gate il personale può chiederti di metterlo nel misuratore. Se non entra, paghi il supplemento per spostarlo in stiva." },
        { question: "Le ruote e le maniglie contano?", answer: "Sì: per Ryanair la misura comprende tutto, maniglie, ruote e tasche esterne." },
        { question: "Meglio zaino o borsa morbida?", answer: "Lo zaino è più comodo da portare; una borsa morbida si adatta meglio al misuratore. Conta soprattutto che sia squadrata e non troppo piena." },
      ],
      en: [
        { question: "What's the best backpack for Ryanair?", answer: "One with an outer size within 40 × 30 × 20 cm, a boxy shape, under 1 kg and a clamshell opening. Fitting the sizer when packed matters more than liters or brand." },
        { question: "Is a 28 liter backpack OK for Ryanair?", answer: "Yes, if its outer size is within 40 × 30 × 20 cm: for example the CabinZero Classic 28L states 39 × 29.5 × 20 cm. Don't overfill it: the depth grows." },
        { question: "Does Ryanair really check backpack size?", answer: "At the gate staff may ask you to put it in the sizer. If it doesn't fit, you pay a fee to move it to the hold." },
        { question: "Do wheels and handles count?", answer: "Yes: for Ryanair the size includes everything, handles, wheels and outside pockets." },
        { question: "Backpack or soft bag?", answer: "A backpack is more comfortable to carry; a soft bag adapts better to the sizer. What matters most is a boxy shape and not overfilling it." },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose Ryanair, the days and what you're bringing: we'll tell you if the free bag is enough.", it: "Scegli Ryanair, i giorni e cosa porti: ti diciamo se la borsa gratuita basta." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "cabinzero-28l-36l-44l-which-size",
    published: "2026-11-19",
    updated: "2026-11-19",
    category: { en: "Airline baggage", it: "Bagaglio aereo" },
    title: {
      en: "CabinZero 28L, 36L or 44L: which size for which airline",
      it: "CabinZero 28L, 36L o 44L: quale scegliere per ogni compagnia",
    },
    description: {
      en: `The three CabinZero Classic sizes compared with the cabin rules of ${airlineCount} airlines: which one goes free under the seat, which needs the overhead bin, and why the liters can mislead.`,
      it: `Le tre misure CabinZero Classic confrontate con le regole di ${airlineCount} compagnie: quale va gratis sotto il sedile, quale serve in cappelliera e perché i litri possono ingannare.`,
    },
    sections: {
      it: [
        {
          heading: "Le tre misure in breve",
          paragraphs: [
            "CabinZero Classic esiste in tre taglie. Queste sono le misure e i pesi indicati sul sito del produttore, controllati il 19 novembre 2026:",
          ],
          table: cabinZeroModelTable("it"),
          illustration: "cabinzero-sizes",
          tip: "Per il 44L il sito indica due misure diverse (51 × 36 × 18 e 51 × 37 × 20 cm): nei confronti usiamo la più grande, per stare sul sicuro.",
        },
        {
          heading: "Quale CabinZero per quale compagnia",
          paragraphs: [
            "Abbiamo confrontato le misure di ogni modello con le regole ufficiali che abbiamo verificato per ogni compagnia. \"Sotto il sedile\" è la borsa inclusa nel biglietto; \"In cappelliera\" è il bagaglio a mano grande, che con le low cost spesso si paga.",
          ],
          table: cabinZeroAirlineTable("it"),
          tip: "Le regole cambiano e dipendono dalla tariffa: controlla sempre la tua prenotazione.",
        },
        {
          heading: "28L: lo zaino delle low cost",
          paragraphs: [
            "Con 39 × 29,5 × 20 cm il Classic 28L rientra nella borsa gratuita di Ryanair, Wizz Air, Vueling ed easyJet. È la scelta per chi vola con il biglietto base.",
            `Attenzione ai litri: il parallelepipedo esterno fa circa ${cz28Box}. I 28 L dichiarati si raggiungono solo riempiendolo molto, e a quel punto la profondità supera facilmente i 20 cm.`,
          ],
        },
        {
          heading: "36L: su misura per easyJet",
          paragraphs: [
            "Il 36L (45 × 31 × 20 cm) è pensato per la borsa gratuita easyJet, che arriva a 45 × 36 × 20 cm; rientra anche nell'oggetto personale di American Airlines. Per Ryanair, Wizz Air e Vueling invece è troppo alto: diventa un bagaglio in cappelliera a pagamento.",
          ],
        },
        {
          heading: "44L: quando paghi il bagaglio a mano",
          paragraphs: [
            "Il 44L ha le dimensioni di un trolley da cabina: entra in cappelliera con quasi tutte le compagnie, ma non è mai una borsa gratuita sotto il sedile. Ha senso se compri il bagaglio a mano o voli con una compagnia che lo include.",
            "Le eccezioni nelle regole che abbiamo verificato sono le compagnie con bagagli a mano più stretti: Air France, KLM e Delta accettano al massimo 35 cm di larghezza, American Airlines 36 cm, e il 44L ne misura 36–37. Ricorda anche i limiti di peso, 8–10 kg per molte compagnie.",
          ],
        },
        {
          heading: "Dove comprarlo",
          paragraphs: [
            "CabinZero si trova sul sito ufficiale e da diversi negozi di valigeria. Qui sotto i prodotti CabinZero dal catalogo dei negozi, con i prezzi aggiornati.",
          ],
          productPicks: true,
        },
        {
          heading: "In breve",
          paragraphs: [
            "Voli low cost con il biglietto base: 28L. Voli soprattutto easyJet: 36L. Paghi o hai incluso il bagaglio a mano: 44L, ma non con Air France, KLM, Delta e American Airlines, che vogliono bagagli più stretti. In tutti i casi misura lo zaino pieno.",
          ],
        },
      ],
      en: [
        {
          heading: "The three sizes at a glance",
          paragraphs: [
            "CabinZero Classic comes in three sizes. These are the sizes and weights stated on the maker's site, checked on 19 November 2026:",
          ],
          table: cabinZeroModelTable("en"),
          illustration: "cabinzero-sizes",
          tip: "For the 44L the site lists two different sizes (51 × 36 × 18 and 51 × 37 × 20 cm): we compare using the larger one, to be safe.",
        },
        {
          heading: "Which CabinZero for which airline",
          paragraphs: [
            "We compared each model's size with the official rules we verified for each airline. \"Under the seat\" is the bag included in the ticket; \"Overhead bin\" is the big cabin bag, which low-cost airlines often charge for.",
          ],
          table: cabinZeroAirlineTable("en"),
          tip: "Rules change and depend on your fare: always check your booking.",
        },
        {
          heading: "28L: the low-cost backpack",
          paragraphs: [
            "At 39 × 29.5 × 20 cm the Classic 28L fits the free bag of Ryanair, Wizz Air, Vueling and easyJet. It's the pick for basic fares.",
            `Mind the liters: the outer box is about ${cz28BoxEn}. You only reach the stated 28 L by stuffing it, and then the depth easily goes past 20 cm.`,
          ],
        },
        {
          heading: "36L: made for easyJet",
          paragraphs: [
            "The 36L (45 × 31 × 20 cm) is designed for easyJet's free bag, which allows up to 45 × 36 × 20 cm; it also fits American Airlines' personal item. For Ryanair, Wizz Air and Vueling it's too tall: it becomes a paid overhead bag.",
          ],
        },
        {
          heading: "44L: when you pay for a cabin bag",
          paragraphs: [
            "The 44L is cabin-trolley size: it goes in the overhead bin with almost every airline, but it's never a free under-seat bag. It makes sense if you buy a cabin bag or fly an airline that includes one.",
            "The exceptions in the rules we verified are airlines with narrower cabin bags: Air France, KLM and Delta allow at most 35 cm of width, American Airlines 36 cm, and the 44L is 36–37 cm. Also mind the weight limits, 8–10 kg for many airlines.",
          ],
        },
        {
          heading: "Where to buy",
          paragraphs: [
            "CabinZero sells on its official site and through several luggage shops. Below are CabinZero products from shop catalogs, with current prices.",
          ],
          productPicks: true,
        },
        {
          heading: "In short",
          paragraphs: [
            "Low-cost basic fares: 28L. Mostly easyJet: 36L. Paying for or included cabin bag: 44L, but not with Air France, KLM, Delta and American Airlines, which want narrower bags. In every case, measure the bag packed.",
          ],
        },
      ],
    },
    products: {
      heading: { en: "CabinZero backpacks in shops", it: "Zaini CabinZero nei negozi" },
      intro: {
        en: "CabinZero backpacks from the official store and luggage shops, closest to the size you need.",
        it: "Zaini CabinZero dal negozio ufficiale e dalle valigerie, i più vicini alla misura che ti serve.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 26, max: 46 }, text: "CabinZero" },
    },
    faq: {
      it: [
        { question: "Il CabinZero 28L va bene per Ryanair?", answer: "Sì: misura 39 × 29,5 × 20 cm e rientra nella borsa gratuita Ryanair da 40 × 30 × 20 cm. Non riempirlo troppo, o la profondità supera i 20 cm." },
        { question: "Il CabinZero 36L va bene per easyJet?", answer: "Sì: con 45 × 31 × 20 cm rientra nella borsa gratuita easyJet da 45 × 36 × 20 cm." },
        { question: "Il CabinZero 44L si può portare gratis?", answer: "Non come borsa sotto il sedile: ha le misure di un trolley da cabina. Va in cappelliera, che con le low cost di solito si paga." },
        { question: "Quanto pesa uno zaino CabinZero?", answer: "Secondo il produttore: 600 g il 28L, 700 g il 36L, 760 g il 44L." },
        { question: "Perché il 28L sembra più piccolo di 28 litri?", answer: `Il parallelepipedo esterno di 39 × 29,5 × 20 cm fa circa ${cz28Box}: i litri dichiarati contano il tessuto riempito al massimo.` },
      ],
      en: [
        { question: "Is the CabinZero 28L OK for Ryanair?", answer: "Yes: it measures 39 × 29.5 × 20 cm and fits Ryanair's free 40 × 30 × 20 cm bag. Don't overfill it, or the depth goes past 20 cm." },
        { question: "Is the CabinZero 36L OK for easyJet?", answer: "Yes: at 45 × 31 × 20 cm it fits easyJet's free 45 × 36 × 20 cm bag." },
        { question: "Can I bring the CabinZero 44L for free?", answer: "Not as an under-seat bag: it's cabin-trolley size. It goes in the overhead bin, which low-cost airlines usually charge for." },
        { question: "How much does a CabinZero backpack weigh?", answer: "According to the maker: 600 g for the 28L, 700 g for the 36L, 760 g for the 44L." },
        { question: "Why does the 28L look smaller than 28 liters?", answer: `The 39 × 29.5 × 20 cm outer box is about ${cz28BoxEn}: the stated liters count the fabric filled to the maximum.` },
      ],
    },
    cta: {
      label: { en: "Check what fits", it: "Verifica cosa ci sta" },
      text: { en: "Choose your airline, the days and what you're bringing: we'll tell you which size you need.", it: "Scegli la compagnia, i giorni e cosa porti: ti diciamo quale misura ti serve." },
      href: "/backpack-configurator",
    },
  },
  {
    slug: "christmas-hand-luggage-only",
    published: "2026-11-23",
    updated: "2026-11-23",
    category: { en: "Packing", it: "Come fare lo zaino" },
    title: {
      en: "Christmas with hand luggage only: what to pack (and where the gifts go)",
      it: "Natale con solo bagaglio a mano: cosa portare (e dove mettere i regali)",
    },
    description: {
      en: "Winter packing lists for a Christmas trip in the free 40×30×20 bag or a 55×40×20 trolley, how much room is left for gifts, what to wear on the plane and which food gifts count as liquids.",
      it: "Le liste invernali per un viaggio di Natale nella borsa gratuita 40×30×20 o nel trolley 55×40×20, quanto spazio resta per i regali, cosa indossare in volo e quali regali alimentari contano come liquidi.",
    },
    sections: {
      it: [
        {
          heading: "La risposta breve: sì, ma i regali cambiano i conti",
          paragraphs: [
            `Quattro giorni d'inverno stanno nella borsa gratuita da 40 × 30 × 20 cm, a patto di indossare in volo cappotto, stivali e maglione pesante. Con la lista qui sotto restano circa ${liters(christmasGiftRoom, "it")} per i regali: abbastanza per qualche pacchetto piccolo, non per un panettone.`,
            "Se resti cinque giorni e ti serve un vestito per la cena di Natale, la borsa gratuita non basta più: serve il trolley da 55 × 40 × 20 cm. E lì il limite diventa il peso, non lo spazio.",
            "Tutti i volumi vengono dal nostro configuratore, gli stessi che usiamo nelle altre liste.",
          ],
        },
        {
          heading: "Le misure da rispettare",
          paragraphs: [
            "Prendiamo Ryanair come riferimento: la borsa gratuita da 40 × 30 × 20 cm è la stessa di Wizz Air e Vueling, mentre easyJet concede 45 × 36 × 20 cm. Il trolley in cappelliera si paga quasi sempre a parte.",
          ],
          table: airlineRulesTable("ryanair", "it", { personal: "Inclusa", cabin: "A pagamento (Priority e 2 bagagli a mano)" }),
          tip: "A dicembre i voli sono pieni e i trolley a pagamento finiscono presto: se ti serve, aggiungilo quando prenoti, costa meno che al gate.",
        },
        {
          heading: "La lista per 4 giorni nella borsa gratuita",
          paragraphs: [
            "Pensata per Natale in famiglia, dal 23 al 26 dicembre: in volo indossi cappotto, stivali, jeans e il maglione più spesso. Nello zaino:",
          ],
          table: kitTable(christmasFreeBagKit, 4, "it"),
          illustration: "christmas-fill",
        },
        {
          heading: "Cosa indossare in volo",
          paragraphs: [
            `Quello che hai addosso non conta nelle misure. In inverno è il trucco più importante: cappotto, stivali e maglione occupano insieme circa ${liters(christmasWornLiters, "it")}, più di un terzo della borsa gratuita.`,
          ],
          illustration: "winter-wear",
          list: [
            "Il cappotto o il piumino: lo togli e lo pieghi sulle ginocchia una volta seduto.",
            "Gli stivali o le scarpe più pesanti: mai nello zaino.",
            "Il maglione più spesso, sopra una maglietta: in aereo puoi toglierlo.",
            "Sciarpa, berretto e guanti nelle tasche del cappotto.",
            "Jeans o pantaloni pesanti addosso, quelli leggeri nello zaino.",
          ],
        },
        {
          heading: "Quanto spazio resta per i regali",
          paragraphs: [
            "Il configuratore aggiunge ai vestiti un margine per i giorni di viaggio e per gli spazi vuoti. Quello che avanza è lo spazio per i regali. Ecco quattro casi:",
          ],
          table: christmasScenarioTable("it"),
          tip: "Se cappotto e stivali finiscono nello zaino, lo spazio per i regali sparisce del tutto. È l'errore che fa pagare più supplementi al gate a dicembre.",
        },
        {
          heading: "5 giorni con la cena di Natale: serve il trolley",
          paragraphs: [
            `Una camicia, scarpe eleganti e un secondo maglione fanno la differenza: la lista per cinque giorni non entra più nella borsa gratuita. Nel trolley da 55 × 40 × 20 cm ci sta con circa ${liters(christmasTrolleyRoom, "it")} in avanzo, ma conviene guardare il peso:`,
          ],
          table: kitTable(christmasCabinKit, 5, "it", true),
          tip: `Il trolley Ryanair può pesare al massimo ${ryanairCabinKg} kg. Con un trolley rigido da circa ${TROLLEY_EMPTY_KG} kg e questa lista restano solo ${kilos(christmasGiftKg, "it")} per i regali. Un borsone morbido o uno zaino da viaggio pesano meno e lasciano più margine.`,
        },
        {
          heading: "Regali ai controlli: cosa sapere",
          paragraphs: ["Con solo bagaglio a mano tutti i regali passano dai controlli di sicurezza. Le cose da sapere prima di fare i pacchetti:"],
          list: [
            "Marmellate, creme spalmabili, miele, olio, vino e liquori contano come liquidi: oltre i 100 ml non passano.",
            "Anche le palle di neve con il liquido dentro sono considerate liquidi.",
            "Panettone, pandoro, torrone e cioccolato sono solidi e passano, ma occupano molto spazio.",
            "I pacchetti incartati possono essere aperti se lo scanner non mostra bene il contenuto: meglio incartare all'arrivo o usare sacchetti regalo.",
            "Regali con batterie al litio, come power bank e cuffie, vanno comunque nel bagaglio a mano: è l'unico posto dove sono ammessi.",
            "Per i regali ingombranti conviene ordinarli online con consegna direttamente a destinazione.",
          ],
        },
        {
          heading: "Come sistemare lo zaino",
          paragraphs: ["In inverno i vestiti sono più spessi: l'ordine conta ancora di più."],
          list: [
            "Sul fondo, contro la schiena, i vestiti più pesanti arrotolati.",
            "Calze e intimo negli spazi vuoti e dentro le scarpe, se ne porti un paio.",
            "Sopra, i regali piccoli protetti tra i maglioni.",
            "In alto il beauty e la busta dei liquidi, da tirare fuori ai controlli.",
            "Tasche esterne quasi vuote: sono loro a far superare i 20 cm di profondità.",
          ],
          illustration: "packed-depth",
          productPicks: true,
        },
        {
          heading: "In breve",
          paragraphs: [
            `Per quattro giorni di Natale la borsa gratuita basta se indossi in volo cappotto, stivali e maglione: restano circa ${liters(christmasGiftRoom, "it")} per i regali. Per cinque giorni con la cena elegante serve il trolley, e lì attenzione al peso. Niente regali liquidi oltre i 100 ml, e incarta all'arrivo.`,
          ],
        },
      ],
      en: [
        {
          heading: "The short answer: yes, but gifts change the maths",
          paragraphs: [
            `Four winter days fit in the free 40 × 30 × 20 cm bag, as long as you wear your coat, boots and thick sweater on the plane. With the list below there's about ${liters(christmasGiftRoom, "en")} left for gifts: enough for a few small presents, not for a panettone.`,
            "If you stay five days and need an outfit for Christmas dinner, the free bag is no longer enough: you need the 55 × 40 × 20 cm trolley. And there the limit becomes weight, not space.",
            "All volumes come from our planner, the same ones we use in the other packing lists.",
          ],
        },
        {
          heading: "The sizes to stay within",
          paragraphs: [
            "Taking Ryanair as the reference: its free 40 × 30 × 20 cm bag is the same as Wizz Air's and Vueling's, while easyJet allows 45 × 36 × 20 cm. The overhead trolley almost always costs extra.",
          ],
          table: airlineRulesTable("ryanair", "en", { personal: "Included", cabin: "Paid (Priority & 2 cabin bags)" }),
          tip: "In December flights are full and paid cabin bags sell out early: if you need one, add it when booking, it costs less than at the gate.",
        },
        {
          heading: "The 4-day list for the free bag",
          paragraphs: [
            "Built for Christmas with family, 23 to 26 December: on the plane you wear your coat, boots, jeans and thickest sweater. In the backpack:",
          ],
          table: kitTable(christmasFreeBagKit, 4, "en"),
          illustration: "christmas-fill",
        },
        {
          heading: "What to wear on the plane",
          paragraphs: [
            `What you wear doesn't count towards the size. In winter it's the most important trick: coat, boots and sweater together take about ${liters(christmasWornLiters, "en")}, more than a third of the free bag.`,
          ],
          illustration: "winter-wear",
          list: [
            "Your coat or puffer jacket: take it off and fold it on your lap once seated.",
            "Your boots or heaviest shoes: never in the bag.",
            "Your thickest sweater, over a T-shirt: you can take it off on board.",
            "Scarf, beanie and gloves in the coat pockets.",
            "Jeans or heavy trousers on, light ones in the bag.",
          ],
        },
        {
          heading: "How much room is left for gifts",
          paragraphs: [
            "The planner adds a margin to the clothes for the trip length and for the gaps between items. Whatever is left is room for gifts. Four cases:",
          ],
          table: christmasScenarioTable("en"),
          tip: "If the coat and boots go in the bag, the room for gifts disappears entirely. It's the mistake behind most gate fees in December.",
        },
        {
          heading: "5 days with Christmas dinner: you need the trolley",
          paragraphs: [
            `A shirt, smart shoes and a second sweater make the difference: the five-day list no longer fits in the free bag. In a 55 × 40 × 20 cm trolley it fits with about ${liters(christmasTrolleyRoom, "en")} to spare, but watch the weight:`,
          ],
          table: kitTable(christmasCabinKit, 5, "en", true),
          tip: `Ryanair's cabin trolley can weigh up to ${ryanairCabinKg} kg. With a hard-shell trolley of about ${TROLLEY_EMPTY_KG} kg and this list, only ${kilos(christmasGiftKg, "en")} is left for gifts. A soft duffel or a travel backpack weighs less and leaves more margin.`,
        },
        {
          heading: "Gifts at security: what to know",
          paragraphs: ["With hand luggage only, every gift goes through security. What to know before you wrap:"],
          list: [
            "Jams, spreads, honey, oil, wine and spirits count as liquids: over 100 ml they won't get through.",
            "Snow globes with liquid inside count as liquids too.",
            "Panettone, pandoro, nougat and chocolate are solids and are allowed, but they take a lot of room.",
            "Wrapped presents may be opened if the scanner can't see what's inside: wrap them on arrival or use gift bags.",
            "Gifts with lithium batteries, like power banks and headphones, must travel in hand luggage anyway: it's the only place they're allowed.",
            "For bulky gifts, order online with delivery straight to your destination.",
          ],
        },
        {
          heading: "How to pack the bag",
          paragraphs: ["In winter clothes are thicker, so the order matters even more."],
          list: [
            "Heaviest clothes rolled at the bottom, against your back.",
            "Socks and underwear in the gaps, and inside shoes if you pack a pair.",
            "Small gifts on top, cushioned between sweaters.",
            "Toiletries and the liquids bag at the very top, ready for security.",
            "Outer pockets almost empty: they're what pushes the depth past 20 cm.",
          ],
          illustration: "packed-depth",
          productPicks: true,
        },
        {
          heading: "In short",
          paragraphs: [
            `For four days at Christmas the free bag is enough if you wear your coat, boots and sweater on the plane: about ${liters(christmasGiftRoom, "en")} is left for gifts. For five days with a smart dinner you need the trolley, and then watch the weight. No liquid gifts over 100 ml, and wrap on arrival.`,
          ],
        },
      ],
    },
    products: {
      heading: { en: "Backpacks for Christmas in 40×30×20", it: "Zaini per Natale in 40×30×20" },
      intro: {
        en: "Travel backpacks around 20 L, checked against the 40×30×20 cm free-bag size when the maker states the dimensions.",
        it: "Zaini da viaggio intorno ai 20 L, confrontati con le misure della borsa gratuita 40×30×20 cm quando il produttore le indica.",
      },
      criteria: { productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 18, max: 24 }, dimensionsCm: { height: 40, width: 30, depth: 20 } },
    },
    faq: {
      it: [
        { question: "Si può andare a casa per Natale solo con lo zaino gratuito?", answer: `Sì, per 3–4 giorni: la lista invernale occupa circa ${liters(neededLiters(christmasFreeBagKit, 4), "it")} con il margine, e la borsa 40 × 30 × 20 ne offre circa ${FREE_BAG_LITERS}. Indossa in volo cappotto, stivali e maglione.` },
        { question: "Posso portare il panettone nel bagaglio a mano?", answer: "Sì, è un alimento solido. Il problema è lo spazio: nella sua scatola occupa buona parte della borsa gratuita. Se viaggi solo con lo zaino, conviene comprarlo a destinazione." },
        { question: "Il vino o l'olio come regalo passano?", answer: "Non nel bagaglio a mano: sono liquidi e superano i 100 ml. Fanno eccezione gli acquisti al duty free dopo i controlli, nella busta sigillata, ma verifica le regole della compagnia." },
        { question: "I regali incartati vengono aperti ai controlli?", answer: "Possono esserlo, se lo scanner non mostra chiaramente il contenuto. Per evitarlo, incartali all'arrivo o usa sacchetti regalo che si aprono senza rovinarli." },
        { question: "Il cappotto conta come bagaglio?", answer: "No, se lo indossi. Il controllo riguarda la borsa, non quello che hai addosso: per questo in inverno conviene viaggiare con i capi più voluminosi." },
      ],
      en: [
        { question: "Can I go home for Christmas with just the free bag?", answer: `Yes, for 3–4 days: the winter list takes about ${liters(neededLiters(christmasFreeBagKit, 4), "en")} with the margin, and the 40 × 30 × 20 bag offers about ${FREE_BAG_LITERS}. Wear your coat, boots and sweater on the plane.` },
        { question: "Can I bring a panettone in hand luggage?", answer: "Yes, it's a solid food. The problem is space: in its box it takes up a good part of the free bag. If you're travelling with just a backpack, buy it at your destination." },
        { question: "Can I bring wine or olive oil as a gift?", answer: "Not in hand luggage: they're liquids over 100 ml. Duty-free purchases made after security, in the sealed bag, are the exception, but check your airline's rules." },
        { question: "Will wrapped gifts be opened at security?", answer: "They can be, if the scanner can't clearly show what's inside. To avoid it, wrap them on arrival or use gift bags that open without damage." },
        { question: "Does my coat count as a bag?", answer: "Not if you wear it. Staff check the bag, not what you have on: that's why in winter it pays to travel in your bulkiest clothes." },
      ],
    },
    cta: {
      label: { en: "Check your own list", it: "Prova con la tua lista" },
      text: { en: "Choose your airline, the days and what you're bringing: we'll tell you if the free bag is enough.", it: "Scegli la compagnia, i giorni e cosa porti: ti diciamo se la borsa gratuita basta." },
      href: "/backpack-configurator",
    },
  },
];

/**
 * Guides from the newest to the oldest (by publication date). Same date: the one added later to the
 * list comes first. Guides without a date go last.
 */
export function guidesNewestFirst(): TravelGuide[] {
  return guides
    .map((guide, index) => ({ guide, index }))
    .sort((a, b) => (b.guide.published ?? "").localeCompare(a.guide.published ?? "") || b.index - a.index)
    .map(({ guide }) => guide);
}
