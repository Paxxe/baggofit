import type { BackpackSearchCriteria } from "@/lib/products/provider";
import { airlines, getVerifiedPolicy } from "./airlines";

type Lang = "en" | "it";

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
}

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
  cta?: { label: Record<Lang, string>; text: Record<Lang, string>; href: "/backpack-configurator" | "/luggage-configurator" };
}

export const guides: TravelGuide[] = [
  {
    slug: "how-to-measure-a-backpack",
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
    published: "2026-11-15",
    updated: "2026-11-15",
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
    published: "2026-11-15",
    updated: "2026-11-15",
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
];
