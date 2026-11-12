import type { BackpackSearchCriteria } from "@/lib/products/provider";

type Lang = "en" | "it";

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
];
