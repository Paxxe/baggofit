import type { BaggageRule } from "@/lib/calculators/airline-compatibility";

export interface Airline {
  id: string;
  name: string;
  slug: string;
  country: string;
  website: string;
  active: boolean;
}

type Localized = { en: string; it: string };
type BaggageType = "personal-item" | "cabin-bag" | "checked-bag";

export interface AirlineBaggageRule extends BaggageRule {
  id: string;
  airlineId: string;
  baggageType: BaggageType;
  fareName: Localized;
  conditions: Localized;
}

export const airlines: Airline[] = [
  { id: "ryanair", name: "Ryanair", slug: "ryanair", country: "Ireland", website: "https://www.ryanair.com/", active: true },
  { id: "easyjet", name: "easyJet", slug: "easyjet", country: "United Kingdom", website: "https://www.easyjet.com/", active: true },
  { id: "wizz-air", name: "Wizz Air", slug: "wizz-air", country: "Hungary", website: "https://www.wizzair.com/", active: true },
  { id: "ita-airways", name: "ITA Airways", slug: "ita-airways", country: "Italy", website: "https://www.ita-airways.com/", active: true },
  { id: "vueling", name: "Vueling", slug: "vueling", country: "Spain", website: "https://www.vueling.com/", active: true },
  { id: "lufthansa", name: "Lufthansa", slug: "lufthansa", country: "Germany", website: "https://www.lufthansa.com/", active: true },
  { id: "british-airways", name: "British Airways", slug: "british-airways", country: "United Kingdom", website: "https://www.britishairways.com/", active: true },
  { id: "air-france", name: "Air France", slug: "air-france", country: "France", website: "https://www.airfrance.com/", active: true },
  { id: "klm", name: "KLM", slug: "klm", country: "Netherlands", website: "https://www.klm.com/", active: true },
  { id: "delta", name: "Delta Air Lines", slug: "delta", country: "United States", website: "https://www.delta.com/", active: true },
  { id: "american-airlines", name: "American Airlines", slug: "american-airlines", country: "United States", website: "https://www.aa.com/", active: true },
  { id: "united", name: "United Airlines", slug: "united", country: "United States", website: "https://www.united.com/", active: true },
];

export const baggageCategories = [
  { id: "personal-item", label: { en: "Personal item", it: "Oggetto personale" } },
  { id: "cabin-bag", label: { en: "Cabin bag", it: "Bagaglio a mano" } },
  { id: "checked-bag", label: { en: "Checked bag", it: "Bagaglio da stiva" } },
] as const;

/**
 * Rules checked by hand against the airline's official page. Only add a rule here after reading the
 * official source; record the date and URL so it can be re-checked (policies change often).
 */
type VerifiedRule = Pick<AirlineBaggageRule, "maxHeightCm" | "maxWidthCm" | "maxDepthCm" | "maxWeightKg" | "fareName" | "conditions">;

interface VerifiedAirlinePolicy {
  verifiedAt: string;
  sourceUrl: string;
  rules: Partial<Record<BaggageType, VerifiedRule>>;
}

const verifiedPolicies: Record<string, VerifiedAirlinePolicy> = {
  "ita-airways": {
    // Official ita-airways.com text read via search index (the site blocks automated reading). Most ITA pages and the FAQ say 55×40×23; a few older pages say 35 cm width.
    verifiedAt: "2026-11-12",
    sourceUrl: "https://www.ita-airways.com/it/it/book-and-prepare/travel-information/baggage/carry-on-baggage",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 15,
        maxWeightKg: null,
        fareName: { en: "Personal item, included", it: "Accessorio personale, incluso" },
        conditions: {
          en: "One personal item (handbag, small backpack or laptop bag) that fits under the seat.",
          it: "Un accessorio personale (borsa, zaino piccolo o porta laptop) da riporre sotto il sedile.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 55,
        maxWidthCm: 40,
        maxDepthCm: 23,
        maxWeightKg: 8,
        fareName: { en: "Carry-on bag (Economy, depending on fare)", it: "Bagaglio a mano (Economy, in base alla tariffa)" },
        conditions: {
          en: "One carry-on bag up to 8 kg; dimensions include handles, side pockets and wheels. A few older ITA pages state a 35 cm width: check your booking.",
          it: "Un bagaglio a mano fino a 8 kg; le misure includono maniglie, tasche laterali e ruote. Alcune pagine ITA meno recenti indicano 35 cm di larghezza: verifica la tua prenotazione.",
        },
      },
    },
  },
  vueling: {
    // Official help.vueling.com text read via search index (the site blocks automated reading).
    verifiedAt: "2026-11-12",
    sourceUrl: "https://help.vueling.com/hc/es/articles/19798835176081-Equipaje-de-mano-Maletas-de-mano",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 20,
        maxWeightKg: null,
        fareName: { en: "Free under-seat bag (all fares)", it: "Bagaglio sotto il sedile gratuito (tutte le tariffe)" },
        conditions: {
          en: "One under-seat bag, included in Fly Light, Fly, Fly Grande and Fly Pro fares.",
          it: "Un bagaglio sotto il sedile, incluso nelle tariffe Fly Light, Fly, Fly Grande e Fly Pro.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 55,
        maxWidthCm: 40,
        maxDepthCm: 20,
        maxWeightKg: 10,
        fareName: { en: "Overhead bin bag: “2 bags” service or Space seats (paid)", it: "Bagaglio in cappelliera: servizio “2 bagagli” o posti Space (a pagamento)" },
        conditions: {
          en: "A 10 kg bag for the overhead bin, in addition to the under-seat bag, with the 2-bag service, Space One/Space Plus/Space seats or Premium status.",
          it: "Un bagaglio da 10 kg in cappelliera, oltre a quello sotto il sedile, con il servizio 2 bagagli, i posti Space One/Space Plus/Space o lo status Premium.",
        },
      },
    },
  },
  lufthansa: {
    // Official lufthansa.com text read via search index (the site blocks automated reading). One older page lists a 10 cm deep personal item; the main page says 15 cm.
    verifiedAt: "2026-11-12",
    sourceUrl: "https://www.lufthansa.com/ao/en/carry-on-baggage",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 15,
        maxWeightKg: null,
        fareName: { en: "Personal item, included in all fares", it: "Oggetto personale, incluso in tutte le tariffe" },
        conditions: {
          en: "One personal item that fits under the seat in front. Economy Basic includes only this item.",
          it: "Un oggetto personale da riporre sotto il sedile davanti. La tariffa Economy Basic include solo questo.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 55,
        maxWidthCm: 40,
        maxDepthCm: 23,
        maxWeightKg: 8,
        fareName: { en: "Carry-on bag (Economy, not in Economy Basic)", it: "Bagaglio a mano (Economy, escluso Economy Basic)" },
        conditions: {
          en: "One 8 kg carry-on bag on short and medium-haul Economy fares, except Economy Basic (to be bought separately).",
          it: "Un bagaglio a mano da 8 kg nelle tariffe Economy di corto e medio raggio, esclusa Economy Basic (da acquistare a parte).",
        },
      },
    },
  },
  "british-airways": {
    // Official britishairways.com text read via search index (the site was unavailable to automated reading).
    verifiedAt: "2026-11-12",
    sourceUrl: "https://britishairways.com/en-de/information/baggage-essentials/hand-baggage-allowances",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 15,
        maxWeightKg: null,
        fareName: { en: "Handbag or laptop bag, included", it: "Borsa o porta laptop, incluso" },
        conditions: {
          en: "One handbag or laptop bag that goes under the seat in front of you and is guaranteed in the cabin.",
          it: "Una borsa o porta laptop da riporre sotto il sedile davanti, garantita in cabina.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 56,
        maxWidthCm: 45,
        maxDepthCm: 25,
        maxWeightKg: null,
        fareName: { en: "Cabin bag, included", it: "Bagaglio a mano, incluso" },
        conditions: {
          en: "One cabin bag including wheels and handles. You must be able to lift it into the overhead bin yourself; it may be moved to the hold on busy flights. The weight limit isn't stated in the source we checked.",
          it: "Un bagaglio a mano, ruote e maniglie comprese. Devi riuscire a sollevarlo da solo in cappelliera; sui voli pieni può essere spostato in stiva. Il limite di peso non è indicato nella fonte che abbiamo controllato.",
        },
      },
    },
  },
  "air-france": {
    // Official airfrance.fr text read via search index (automated reading timed out).
    verifiedAt: "2026-11-12",
    sourceUrl: "https://wwws.airfrance.fr/en/information/bagages/bagage-cabine-soute",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 15,
        maxWeightKg: null,
        fareName: { en: "Small bag, included", it: "Accessorio, incluso" },
        conditions: {
          en: "One small bag under the seat. It counts towards the 12 kg combined cabin weight.",
          it: "Un accessorio sotto il sedile. Rientra nei 12 kg complessivi della cabina.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 55,
        maxWidthCm: 35,
        maxDepthCm: 25,
        maxWeightKg: 12,
        fareName: { en: "Hand baggage (Economy, depending on fare)", it: "Bagaglio a mano (Economy, in base alla tariffa)" },
        conditions: {
          en: "Economy allows 0 to 1 hand baggage depending on the fare, plus the small bag: 12 kg in total for both. Dimensions include pockets, wheels and handles.",
          it: "In Economy da 0 a 1 bagaglio a mano a seconda della tariffa, più l'accessorio: 12 kg in totale per entrambi. Le misure includono tasche, ruote e maniglie.",
        },
      },
    },
  },
  klm: {
    // Official klm.com text read via search index (automated reading timed out).
    verifiedAt: "2026-11-12",
    sourceUrl: "https://www.klm.com/information/baggage/hand-baggage-allowance",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 15,
        maxWeightKg: null,
        fareName: { en: "Small bag, included in every ticket", it: "Accessorio, incluso in ogni biglietto" },
        conditions: {
          en: "One small bag (handbag, briefcase, camera or small laptop bag). On Economy Basic it is the only cabin item.",
          it: "Un accessorio (borsa, ventiquattrore, fotocamera o piccolo porta laptop). Con Economy Basic è l'unico bagaglio in cabina.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 55,
        maxWidthCm: 35,
        maxDepthCm: 25,
        maxWeightKg: 12,
        fareName: { en: "Hand baggage (Economy, not on Basic)", it: "Bagaglio a mano (Economy, escluso Basic)" },
        conditions: {
          en: "One piece of hand baggage for the overhead bin, including handles and wheels. Small bag and hand baggage together: max 12 kg.",
          it: "Un bagaglio a mano per la cappelliera, maniglie e ruote comprese. Accessorio e bagaglio a mano insieme: massimo 12 kg.",
        },
      },
    },
  },
  delta: {
    // Read directly from delta.com.
    verifiedAt: "2026-11-12",
    sourceUrl: "https://www.delta.com/us/en/baggage/carry-on-baggage",
    rules: {
      "personal-item": {
        maxHeightCm: null,
        maxWidthCm: null,
        maxDepthCm: null,
        maxWeightKg: null,
        fareName: { en: "Personal item, free", it: "Oggetto personale, gratuito" },
        conditions: {
          en: "One personal item (purse, briefcase, small backpack, laptop bag…) that fits under the seat. Delta doesn't publish exact dimensions for it.",
          it: "Un oggetto personale (borsa, ventiquattrore, zaino piccolo, porta laptop…) da riporre sotto il sedile. Delta non indica misure precise.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 56,
        maxWidthCm: 35,
        maxDepthCm: 23,
        maxWeightKg: null,
        fareName: { en: "Carry-on bag, free on Delta-operated flights", it: "Bagaglio a mano, gratuito sui voli operati da Delta" },
        conditions: {
          en: "22 × 14 × 9 in, max 45 linear inches (114 cm). No weight limit stated. Small Delta Connection aircraft allow personal items only.",
          it: "22 × 14 × 9 pollici, al massimo 114 cm di somma delle misure. Nessun limite di peso indicato. Sui piccoli aerei Delta Connection è ammesso solo l'oggetto personale.",
        },
      },
    },
  },
  "american-airlines": {
    // Official aa.com text read via search index (the site blocks automated reading). An older AA page converts 22×14×9 in to 59×39×23 cm; the current page says 56×36×23.
    verifiedAt: "2026-11-12",
    sourceUrl: "https://www.aa.com/web/i18n/travel-info/baggage/carry-on-baggage.html",
    rules: {
      "personal-item": {
        maxHeightCm: 45,
        maxWidthCm: 35,
        maxDepthCm: 20,
        maxWeightKg: null,
        fareName: { en: "Personal item, free", it: "Oggetto personale, gratuito" },
        conditions: {
          en: "18 × 14 × 8 in, must fit under the seat in front of you.",
          it: "18 × 14 × 8 pollici, deve stare sotto il sedile davanti.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 56,
        maxWidthCm: 36,
        maxDepthCm: 23,
        maxWeightKg: null,
        fareName: { en: "Carry-on bag, free", it: "Bagaglio a mano, gratuito" },
        conditions: {
          en: "22 × 14 × 9 in including handles and wheels; it must fit the airport sizer. No weight limit stated.",
          it: "22 × 14 × 9 pollici, maniglie e ruote comprese; deve entrare nel misuratore in aeroporto. Nessun limite di peso indicato.",
        },
      },
    },
  },
  "wizz-air": {
    verifiedAt: "2026-11-12",
    sourceUrl: "https://www.wizzair.com/en-gb/help-centre/booking-information-and-services/baggage/baggage-allowance",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 20,
        maxWeightKg: 10,
        fareName: { en: "Free for every passenger", it: "Gratuito per tutti" },
        conditions: {
          en: "One carry-on bag that fits under the seat in front of you (laptop bag, purse or small backpack). Handles and wheels aren't counted, but wheels may add at most 5 cm.",
          it: "Un bagaglio a mano da riporre sotto il sedile davanti (borsa per laptop, borsetta o zaino piccolo). Maniglie e ruote non sono conteggiate, ma le ruote possono aggiungere al massimo 5 cm.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 55,
        maxWidthCm: 40,
        maxDepthCm: 23,
        maxWeightKg: 10,
        fareName: { en: "Trolley bag with WIZZ Priority (paid)", it: "Trolley con WIZZ Priority (a pagamento)" },
        conditions: {
          en: "A trolley bag for the overhead compartment, in addition to the free carry-on, when you add WIZZ Priority. Wheels may add at most 5 cm.",
          it: "Un trolley da riporre nella cappelliera, oltre al bagaglio gratuito, se aggiungi WIZZ Priority. Le ruote possono aggiungere al massimo 5 cm.",
        },
      },
      "checked-bag": {
        maxHeightCm: 171,
        maxWidthCm: 149,
        maxDepthCm: 119,
        maxWeightKg: 32,
        fareName: { en: "Paid: 10, 20, 26 or 32 kg", it: "A pagamento: 10, 20, 26 o 32 kg" },
        conditions: {
          en: "Checked bags of 10, 20, 26 or 32 kg (up to 6 per passenger), at most 149 × 119 × 171 cm. The weight limit depends on the option you book.",
          it: "Bagagli da stiva da 10, 20, 26 o 32 kg (fino a 6 per passeggero), al massimo 149 × 119 × 171 cm. Il limite di peso dipende dall'opzione che prenoti.",
        },
      },
    },
  },
  easyjet: {
    verifiedAt: "2026-11-11",
    sourceUrl: "https://www.easyjet.com/it/aiuto/bagaglio/bagaglio-a-mano",
    // Checked-bag rules are on a separate page and haven't been verified yet.
    rules: {
      "personal-item": {
        maxHeightCm: 45,
        maxWidthCm: 36,
        maxDepthCm: 20,
        maxWeightKg: 15,
        fareName: { en: "Included for everyone", it: "Incluso per tutti" },
        conditions: {
          en: "One small cabin bag (wheels and handles included) that goes under the seat in front of you. You must be able to lift and carry it yourself.",
          it: "Un bagaglio a mano piccolo (ruote e maniglie comprese) da collocare sotto il sedile davanti a te. Devi poterlo sollevare e trasportare da solo.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 56,
        maxWidthCm: 45,
        maxDepthCm: 25,
        maxWeightKg: 15,
        fareName: { en: "Large cabin bag add-on (included with easyJet Plus / Inclusive Plus)", it: "Bagaglio a mano grande a pagamento (incluso con easyJet Plus / Inclusive Plus)" },
        conditions: {
          en: "A large cabin bag (wheels and handles included) for the overhead locker, in addition to the small bag, with Speedy Boarding. easyJet Plus members without one booked and Inclusive Plus fares can bring it if space allows, otherwise it goes in the hold.",
          it: "Un bagaglio a mano grande (ruote e maniglie comprese) da riporre nella cappelliera, oltre a quello piccolo, con Speedy Boarding. I soci easyJet Plus che non l’hanno prenotato e la tariffa Inclusive Plus possono portarlo se c’è spazio, altrimenti va in stiva.",
        },
      },
    },
  },
  ryanair: {
    verifiedAt: "2026-11-11",
    sourceUrl: "https://help.ryanair.com/hc/it/articles/12888036565521-Informativa-sui-bagagli-di-Ryanair",
    rules: {
      "personal-item": {
        maxHeightCm: 40,
        maxWidthCm: 30,
        maxDepthCm: 20,
        maxWeightKg: null,
        fareName: { en: "Included in all fares", it: "Incluso in tutte le tariffe" },
        conditions: {
          en: "One small bag (e.g. handbag or laptop bag) that fits under the seat in front of you. No weight limit is stated.",
          it: "Una borsa piccola (ad es. borsa a mano o per laptop) da riporre sotto il sedile di fronte. Non è indicato un limite di peso.",
        },
      },
      "cabin-bag": {
        maxHeightCm: 55,
        maxWidthCm: 40,
        maxDepthCm: 20,
        maxWeightKg: 10,
        fareName: { en: "“Priority & 2 cabin bags” add-on", it: "Opzione “Priorità e 2 bagagli a mano”" },
        conditions: {
          en: "A 10 kg bag for the overhead bin, in addition to the small under-seat bag, plus priority boarding. Paid add-on.",
          it: "Una valigia da 10 kg da riporre nella cappelliera, oltre alla borsa piccola sotto il sedile, con imbarco prioritario. Opzione a pagamento.",
        },
      },
      "checked-bag": {
        maxHeightCm: null,
        maxWidthCm: null,
        maxDepthCm: null,
        maxWeightKg: null,
        fareName: { en: "Paid add-on: 10, 20 or 23 kg", it: "Opzione a pagamento: 10, 20 o 23 kg" },
        conditions: {
          en: "Checked bags of 10, 20 (up to 3 per passenger) or 23 kg (up to 1 per passenger), dropped at the check-in desk. The source page doesn't state maximum dimensions.",
          it: "Bagagli da stiva da 10, 20 (fino a 3 per passeggero) o 23 kg (fino a 1 per passeggero), da consegnare al banco check-in. La pagina ufficiale non indica le dimensioni massime.",
        },
      },
    },
  },
};

export function getVerifiedPolicy(airlineId: string) {
  return verifiedPolicies[airlineId] ?? null;
}

export function getAirlineRules(airlineId: string): AirlineBaggageRule[] {
  const policy = verifiedPolicies[airlineId];
  return baggageCategories.map(({ id }) => {
    const verified = policy?.rules[id];
    if (policy && verified) {
      return { id: `${airlineId}-${id}`, airlineId, baggageType: id, ...verified, status: "verified" as const, verifiedAt: policy.verifiedAt, sourceUrl: policy.sourceUrl };
    }
    return {
      id: `${airlineId}-${id}`,
      airlineId,
      baggageType: id,
      fareName: { en: "Varies by fare and route", it: "Dipende da tariffa e tratta" },
      maxHeightCm: null,
      maxWidthCm: null,
      maxDepthCm: null,
      maxWeightKg: null,
      conditions: { en: "Check the airline's official policy for your booking and fare.", it: "Controlla la policy ufficiale della compagnia per la tua prenotazione e tariffa." },
      status: "unverified" as const,
      verifiedAt: null,
      sourceUrl: null,
    };
  });
}
