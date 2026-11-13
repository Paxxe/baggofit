"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { z } from "zod";
import { AlertTriangle, ArrowLeft, ArrowRight, Backpack, Check, RotateCcw, Search, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import { packingCategories, packingItems } from "@/lib/data/packing-items";
import { airlines, getAirlineRules, getVerifiedPolicy } from "@/lib/data/airlines";
import { estimateLuggage, suggestedSuitcaseQuantity, trimToAllowance, type LuggageKind, type Season, type SuitcaseSize } from "@/lib/calculators/luggage-estimate";
import type { Messages } from "@/lib/i18n";
import type { BackpackSearchCriteria } from "@/lib/products/provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PackingIcon } from "@/components/packing-icons";
import { flyIntoBag } from "@/components/packing-backpack";
import { LuggageScale, PackingSuitcase } from "@/components/packing-suitcase";
import { ProductMatches } from "@/components/product-matches";
import { VolumeAlert } from "@/components/volume-alert";
import { maxVolumeLiters, volumeStatus } from "@/lib/calculators/airline-compatibility";

const storageKey = "luggagefit-luggage-v1";
const stateSchema = z.object({
  kind: z.enum(["cabin-trolley", "checked-suitcase"]).nullable(),
  tripDays: z.number().int().min(1).max(90),
  season: z.enum(["summer", "mid", "winter"]),
  laundry: z.boolean(),
  airlineId: z.string(),
  allowanceKg: z.number().min(5).max(40).nullable(),
  quantities: z.record(z.string(), z.number().int().min(0).max(99)),
  customized: z.boolean(),
  lightweight: z.boolean(),
});
type LuggageState = z.infer<typeof stateSchema>;

const suggested = (days: number, season: Season, laundry: boolean, kind: LuggageKind = "checked-suitcase") =>
  Object.fromEntries(packingItems.map((item) => [item.id, suggestedSuitcaseQuantity(item.id, days, season, laundry, kind)]));

const estimateFor = (state: Pick<LuggageState, "kind" | "tripDays" | "season">, quantities: Record<string, number>) =>
  estimateLuggage({
    kind: state.kind ?? "checked-suitcase",
    tripDays: state.tripDays,
    season: state.season,
    items: packingItems.map((item) => ({ quantity: quantities[item.id] ?? 0, volumeLiters: item.volumeLiters, weightKg: item.weightKg, category: item.category })),
  });

/** The allowance in force: the visitor's pick, else the verified cabin weight limit of the airline. */
function effectiveAllowance(state: Pick<LuggageState, "kind" | "airlineId" | "allowanceKg">) {
  if (state.allowanceKg !== null) return state.allowanceKg;
  if (state.airlineId === "none" || state.kind !== "cabin-trolley") return null;
  const rule = getAirlineRules(state.airlineId).find((item) => item.baggageType === "cabin-bag");
  return rule?.status === "verified" ? rule.maxWeightKg : null;
}

/**
 * Starting list for the current answers: tailored to the luggage kind and trimmed so it never
 * starts over the weight allowance. A list the visitor edited is left alone.
 */
function plannedQuantities(state: LuggageState) {
  const base = suggested(state.tripDays, state.season, state.laundry, state.kind ?? "checked-suitcase");
  const allowance = effectiveAllowance(state);
  return allowance === null ? base : trimToAllowance(base, allowance, (quantities) => estimateFor(state, quantities).totalWeightKg);
}

const initialState = (): LuggageState => ({
  kind: null,
  tripDays: 7,
  season: "mid",
  laundry: false,
  airlineId: "none",
  allowanceKg: null,
  quantities: suggested(7, "mid", false),
  customized: false,
  lightweight: true,
});

const copy = {
  en: {
    kicker: "Trolley & suitcase planner",
    title: "Your suitcase, sized right.",
    intro: "Volume and weight: a few answers, a clear size and the allowance to book.",
    steps: ["What you'll take", "The trip", "Airline", "What you'll pack", "Your fit"],
    stepOf: "Step", of: "of", next: "Continue", back: "Back", restart: "Start over", calculate: "See my fit",
    kindTitle: "What are you travelling with?",
    kindHelp: "We'll size it and check the weight against your allowance.",
    cabin: "Cabin trolley", cabinHelp: "Carry-on that rolls into the overhead bin. Usually 55 cm and 7–15 kg.",
    checked: "Checked suitcase", checkedHelp: "Goes in the hold. Medium (~65 cm) or large (~75 cm), 15–23 kg.",
    tripTitle: "How long, and when?", days: "days", exactDays: "Exact number of days",
    season: "Season", seasons: { summer: "Summer", mid: "Spring / autumn", winter: "Winter" } as Record<Season, string>,
    laundry: "Can you do laundry there?", yes: "Yes", no: "No",
    laundryHelp: "With laundry we plan clothes for a week at most.",
    airlineTitle: "Which airline?", airlineHelp: "With verified rules we check size and weight for you.",
    searchAirline: "Search airline", noAirline: "No airline / not flying", verified: "✓ Sizes verified", unverified: "Rules unverified",
    allowance: "Weight allowance", allowanceHelpCabin: "Weight limit of your cabin trolley.", allowanceHelpChecked: "The checked bag you booked (or plan to book).",
    noLimit: "No limit",
    packingTitle: "What will you pack?", packingHelp: "We filled in a starting list for your trip. Adjust it: the suitcase and the scale react.",
    reset: "Reset list", perItem: "item",
    resultKicker: "Your fit", resultTitle: "Suggested capacity",
    sizes: { cabin: "Cabin size · 55 cm", medium: "Medium · ~65 cm", large: "Large · ~75 cm", "extra-large": "Extra large · ~80 cm" } as Record<SuitcaseSize, string>,
    weightLabel: "Estimated weight, suitcase included",
    exceedsCabin: "This list is more than a cabin trolley can hold. Consider a checked suitcase or pack lighter.",
    overWeight: (over: number) => `About ${over.toLocaleString("en-GB", { maximumFractionDigits: 1 })} kg over your allowance. Book a bigger allowance or leave something at home.`,
    nearWeight: "Close to your allowance: a light suitcase helps.",
    okWeight: "Comfortably within your allowance.",
    lightweight: "Prefer light suitcases", ruleTitle: "Airline check",
    ruleVerified: (size: string) => `Cabin limit: ${size}. Products are filtered to fit it.`,
    ruleMissing: "No verified size for this airline yet, so check the official policy before you buy.",
    ruleNoSize: (fare: string) => `Verified rule: ${fare}. The official page doesn't state maximum dimensions for this bag, so check the size with the airline.`,
    emptyCase: (kg: number) => `includes ~${kg} kg for the empty suitcase`,
    backpackLink: "Travelling with a backpack instead?",
    itemsPlusCase: (items: string, kind: string, empty: string, total: string) => `Items ${items} kg + empty ${kind} ~${empty} kg = ${total} kg`,
    trolleyWord: "trolley", suitcaseWord: "suitcase",
    cabinLightNote: "Travel-light list: clothes for up to 5 days, and your jacket and main shoes are worn on board, so they're not in the trolley.",
    trimmedNote: (kg: number) => `The suggested list is sized to stay within ${kg} kg.`,
    asideWaiting: "Weight and capacity appear when you build your list.",
    emptyList: "Add items to see the capacity",
    beta: "Beta",
  },
  it: {
    kicker: "Configuratore trolley e valigie",
    title: "La valigia giusta, su misura.",
    intro: "Volume e peso: poche risposte, una taglia chiara e la franchigia da prenotare.",
    steps: ["Cosa porti", "Il viaggio", "Compagnia", "Cosa metti dentro", "Il risultato"],
    stepOf: "Passo", of: "di", next: "Continua", back: "Indietro", restart: "Ricomincia", calculate: "Vedi il risultato",
    kindTitle: "Con cosa viaggi?",
    kindHelp: "Calcoliamo la taglia e controlliamo il peso rispetto alla tua franchigia.",
    cabin: "Trolley da cabina", cabinHelp: "Va in cappelliera. Di solito 55 cm e 7–15 kg.",
    checked: "Valigia da stiva", checkedHelp: "Va in stiva. Media (~65 cm) o grande (~75 cm), 15–23 kg.",
    tripTitle: "Quanto dura, e quando?", days: "giorni", exactDays: "Numero esatto di giorni",
    season: "Stagione", seasons: { summer: "Estate", mid: "Primavera / autunno", winter: "Inverno" } as Record<Season, string>,
    laundry: "Potrai fare il bucato?", yes: "Sì", no: "No",
    laundryHelp: "Con il bucato prevediamo vestiti al massimo per una settimana.",
    airlineTitle: "Con quale compagnia?", airlineHelp: "Con le regole verificate controlliamo misure e peso al posto tuo.",
    searchAirline: "Cerca compagnia", noAirline: "Nessuna compagnia / non volo", verified: "✓ Misure verificate", unverified: "Regole non verificate",
    allowance: "Franchigia di peso", allowanceHelpCabin: "Limite di peso del tuo trolley da cabina.", allowanceHelpChecked: "Il bagaglio da stiva che hai prenotato (o vuoi prenotare).",
    noLimit: "Nessun limite",
    packingTitle: "Cosa metti in valigia?", packingHelp: "Abbiamo preparato una lista di partenza per il tuo viaggio. Modificala: la valigia e la bilancia reagiscono.",
    reset: "Azzera la lista", perItem: "pezzo",
    resultKicker: "Il risultato", resultTitle: "Capienza consigliata",
    sizes: { cabin: "Taglia cabina · 55 cm", medium: "Media · ~65 cm", large: "Grande · ~75 cm", "extra-large": "Extra large · ~80 cm" } as Record<SuitcaseSize, string>,
    weightLabel: "Peso stimato, valigia inclusa",
    exceedsCabin: "Questa lista è troppo per un trolley da cabina. Valuta una valigia da stiva o porta meno cose.",
    overWeight: (over: number) => `Superi la franchigia di circa ${over.toLocaleString("it-IT", { maximumFractionDigits: 1 })} kg. Prenota una franchigia più alta o lascia qualcosa a casa.`,
    nearWeight: "Sei vicino al limite: una valigia leggera ti aiuta.",
    okWeight: "Sei comodamente dentro la franchigia.",
    lightweight: "Preferisci valigie leggere", ruleTitle: "Controllo compagnia",
    ruleVerified: (size: string) => `Limite cabina: ${size}. I prodotti sono filtrati per rientrarci.`,
    ruleMissing: "Per questa compagnia non abbiamo ancora misure verificate: controlla la policy ufficiale prima di acquistare.",
    ruleNoSize: (fare: string) => `Regola verificata: ${fare}. La pagina ufficiale non indica misure massime per questo bagaglio, quindi verifica la taglia con la compagnia.`,
    emptyCase: (kg: number) => `include ~${kg} kg di valigia vuota`,
    backpackLink: "Viaggi con lo zaino invece?",
    itemsPlusCase: (items: string, kind: string, empty: string, total: string) => `Oggetti ${items} kg + ${kind} vuoto ~${empty} kg = ${total} kg`,
    trolleyWord: "trolley", suitcaseWord: "valigia",
    cabinLightNote: "Lista “viaggio leggero”: vestiti al massimo per 5 giorni, e giacca e scarpe principali le indossi in volo, quindi non sono nel trolley.",
    trimmedNote: (kg: number) => `La lista suggerita è pensata per stare nei ${kg} kg.`,
    asideWaiting: "Peso e capienza compaiono quando prepari la lista.",
    emptyList: "Aggiungi oggetti per vedere la capienza",
    beta: "Beta",
  },
} as const;

const cabinAllowances = [7, 8, 10, 12, 15];
const checkedAllowances = [10, 15, 20, 23, 32];

export function LuggageConfigurator({ locale, messages }: { locale: Locale; messages: Messages }) {
  const t = copy[locale];
  const [state, setState] = useState<LuggageState>(initialState);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? stateSchema.safeParse(JSON.parse(saved)) : null;
      if (parsed?.success) startTransition(() => setState(parsed.data));
    } catch {
      localStorage.removeItem(storageKey);
    }
    startTransition(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, loaded]);

  const kind: LuggageKind = state.kind ?? "checked-suitcase";
  const estimate = useMemo(
    () =>
      estimateLuggage({
        kind,
        tripDays: state.tripDays,
        season: state.season,
        items: packingItems.map((item) => ({ quantity: state.quantities[item.id] ?? 0, volumeLiters: item.volumeLiters, weightKg: item.weightKg, category: item.category })),
      }),
    [kind, state.tripDays, state.season, state.quantities],
  );

  const hasItems = Object.values(state.quantities).some((quantity) => quantity > 0);
  const kg = (value: number) => value.toLocaleString(locale === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 });
  const ruleType = kind === "cabin-trolley" ? "cabin-bag" : "checked-bag";
  const rule = state.airlineId === "none" ? null : getAirlineRules(state.airlineId).find((item) => item.baggageType === ruleType) ?? null;
  const verifiedSize = rule?.status === "verified" && rule.maxHeightCm && rule.maxWidthCm && rule.maxDepthCm ? { height: rule.maxHeightCm, width: rule.maxWidthCm, depth: rule.maxDepthCm } : null;
  // Allowance: what the visitor picked, else the verified cabin weight limit.
  const allowanceKg = state.allowanceKg ?? (rule?.status === "verified" ? rule.maxWeightKg : null);
  const overBy = allowanceKg !== null ? estimate.totalWeightKg - allowanceKg : 0;
  const referenceLiters = kind === "cabin-trolley" ? 40 : 85;
  // Cabin trolley + verified airline size: warn when the list needs more liters than the allowance holds.
  const volumeLimit = kind === "cabin-trolley" ? maxVolumeLiters(rule) : null;
  const volumeState = volumeLimit ? volumeStatus(estimate.recommendedCapacityLiters, volumeLimit) : undefined;
  const airlineName = airlines.find((airline) => airline.id === state.airlineId)?.name ?? "";
  const volumeAlert = (compact = false) =>
    volumeLimit && volumeState && verifiedSize ? (
      <VolumeAlert locale={locale} status={volumeState} neededLiters={estimate.recommendedCapacityLiters} limitLiters={volumeLimit} airline={airlineName} allowance={t.cabin} size={`${verifiedSize.height} × ${verifiedSize.width} × ${verifiedSize.depth} cm`} compact={compact} planner="luggage" />
    ) : null;

  const criteria: BackpackSearchCriteria = {
    productKind: kind,
    capacityRangeLiters: estimate.suggestedCapacityRangeLiters,
    lightweight: state.lightweight,
    dimensionsCm: verifiedSize ?? undefined,
  };

  const update = (patch: Partial<LuggageState>) => setState((current) => ({ ...current, ...patch }));
  const replan = (patch: Partial<LuggageState>) =>
    setState((current) => {
      const next = { ...current, ...patch };
      return next.customized ? next : { ...next, quantities: plannedQuantities(next) };
    });
  const changeQuantity = (id: string, delta: number) => {
    if (delta > 0 && !(state.quantities[id] ?? 0)) track("packing_item_add", { planner: "luggage", item_id: id });
    setState((current) => ({ ...current, customized: true, quantities: { ...current.quantities, [id]: Math.max(0, (current.quantities[id] ?? 0) + delta) } }));
  };
  const restart = () => {
    track("configurator_restart", { planner: "luggage" });
    setState(initialState());
    setStep(0);
    localStorage.removeItem(storageKey);
  };

  const steps = ["kind", "trip", "airline", "packing", "result"] as const;
  const current = steps[step];
  /** Moves between steps and reports the funnel (configurator_step, configurator_complete). */
  const goTo = (next: number) => {
    setStep(next);
    const name = steps[next];
    if (!name || next === step) return;
    track("configurator_step", { planner: "luggage", step: name, step_number: next + 1, mode: kind });
    if (name === "result") {
      track("configurator_complete", {
        planner: "luggage",
        mode: kind,
        trip_days: state.tripDays,
        season: state.season,
        airline: state.airlineId,
        allowance_kg: allowanceKg ?? undefined,
        liters_min: estimate.suggestedCapacityRangeLiters.min,
        liters_max: estimate.suggestedCapacityRangeLiters.max,
        size: estimate.size,
        total_kg: Math.round(estimate.totalWeightKg * 10) / 10,
        over_weight: allowanceKg !== null && overBy > 0,
        volume_status: volumeState,
      });
    }
  };
  const chooseKind = (option: LuggageKind) => {
    if (state.kind === null) track("configurator_start", { planner: "luggage", mode: option });
    replan({ kind: option, allowanceKg: null });
  };
  const chooseAirline = (airlineId: string) => {
    if (airlineId !== state.airlineId) track("airline_select", { planner: "luggage", airline: airlineId, verified: airlineId !== "none" && !!getVerifiedPolicy(airlineId) });
    replan({ airlineId, allowanceKg: null });
  };
  const allowanceOptions = kind === "cabin-trolley" ? cabinAllowances : checkedAllowances;
  const filteredAirlines = airlines.filter((airline) => airline.name.toLowerCase().includes(query.toLowerCase()));
  const weightNote = allowanceKg === null ? null : overBy > 0 ? t.overWeight(overBy) : overBy > -allowanceKg * 0.1 ? t.nearWeight : t.okWeight;

  return <>
    <SiteHeader locale={locale} messages={messages} switchPath="/luggage-configurator" />
    <main className="config-page luggage-page"><div className="config-shell">
      <Link className="back-home" href={`/${locale}/backpack-configurator`}><Backpack size={15} />{t.backpackLink}</Link>
      <div className="config-intro"><p className="eyebrow"><span className="eyebrow-line" />{t.kicker} <span className="beta-pill">{t.beta}</span></p><h1>{t.title}</h1><p>{t.intro}</p></div>
      <div className="progress-row" aria-label={`${t.stepOf} ${step + 1} ${t.of} ${steps.length}`}><div className="progress-track">{steps.map((name, index) => <span key={name} className={`progress-segment ${index <= step ? "is-active" : ""}`} />)}</div><div className="progress-meta"><span>{t.stepOf} <strong>0{step + 1}</strong> {t.of} 0{steps.length}</span><span>{t.steps[step]}</span></div></div>

      <div className="config-layout">
        <section className="config-panel" aria-live="polite">
          {current === "kind" && <div className="step-content">
            <p className="step-kicker">01 / {t.steps[0]}</p><h2>{t.kindTitle}</h2><p className="step-help">{t.kindHelp}</p>
            <div className="purpose-grid">
              {(["cabin-trolley", "checked-suitcase"] as const).map((option, index) => <button key={option} type="button" className={`purpose-choice ${state.kind === option ? "is-selected" : ""}`} aria-pressed={state.kind === option} onClick={() => chooseKind(option)}>
                <span className="purpose-number">0{index + 1}</span><strong>{option === "cabin-trolley" ? t.cabin : t.checked}</strong><span>{option === "cabin-trolley" ? t.cabinHelp : t.checkedHelp}</span><span className="radio-dot" />
              </button>)}
            </div>
          </div>}

          {current === "trip" && <div className="step-content">
            <p className="step-kicker">02 / {t.steps[1]}</p><h2>{t.tripTitle}</h2>
            <div className="duration-options">{[[2, "1–3"], [5, "4–6"], [7, "7"], [10, "8–12"], [14, "13+"]].map(([days, label]) => <button key={label} type="button" className={`choice-tile ${state.tripDays === days ? "is-selected" : ""}`} onClick={() => replan({ tripDays: days as number })}>{label} {t.days}</button>)}</div>
            <label className="field-label" htmlFor="luggage-days">{t.exactDays}</label><div className="number-field"><input id="luggage-days" type="number" min="1" max="90" value={state.tripDays} onChange={(event) => replan({ tripDays: Math.min(90, Math.max(1, Number(event.target.value) || 1)) })} /><span>{t.days}</span></div>
            <h3 className="sub-question">{t.season}</h3>
            <div className="style-options">{(["summer", "mid", "winter"] as const).map((season, index) => <button key={season} type="button" className={`style-choice ${state.season === season ? "is-selected" : ""}`} onClick={() => replan({ season })}><span className="style-marker">0{index + 1}</span><span>{t.seasons[season]}</span><span className="radio-dot" /></button>)}</div>
            <h3 className="sub-question">{t.laundry}</h3>
            <div className="segmented-options"><button type="button" className={state.laundry ? "is-selected" : ""} onClick={() => replan({ laundry: true })}>{t.yes}</button><button type="button" className={!state.laundry ? "is-selected" : ""} onClick={() => replan({ laundry: false })}>{t.no}</button></div>
            <p className="field-hint">{t.laundryHelp}</p>
          </div>}

          {current === "airline" && <div className="step-content">
            <p className="step-kicker">03 / {t.steps[2]}</p><h2>{t.airlineTitle}</h2><p className="step-help">{t.airlineHelp}</p>
            <label className="search-field"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchAirline} /></label>
            <div className="airline-options" role="radiogroup" aria-label={t.airlineTitle}>
              <button type="button" role="radio" aria-checked={state.airlineId === "none"} className={`airline-choice no-airline ${state.airlineId === "none" ? "is-selected" : ""}`} onClick={() => chooseAirline("none")}><span className="radio-dot" /><span>{t.noAirline}</span></button>
              {filteredAirlines.map((airline) => <button type="button" role="radio" aria-checked={state.airlineId === airline.id} key={airline.id} className={`airline-choice ${state.airlineId === airline.id ? "is-selected" : ""}`} onClick={() => chooseAirline(airline.id)}><span className="radio-dot" /><span>{airline.name}</span>{getVerifiedPolicy(airline.id) ? <span className="rule-state is-verified">{t.verified}</span> : <span className="rule-state">{t.unverified}</span>}</button>)}
            </div>
            <h3 className="sub-question">{t.allowance}</h3>
            <p className="field-hint">{kind === "cabin-trolley" ? t.allowanceHelpCabin : t.allowanceHelpChecked}</p>
            <div className="allowance-options">
              {allowanceOptions.map((kg) => <button key={kg} type="button" className={`choice-tile ${allowanceKg === kg ? "is-selected" : ""}`} onClick={() => replan({ allowanceKg: kg })}>{kg} kg</button>)}
              <button type="button" className={`choice-tile ${allowanceKg === null ? "is-selected" : ""}`} onClick={() => replan({ allowanceKg: null })}>{t.noLimit}</button>
            </div>
          </div>}

          {current === "packing" && <div className="step-content">
            <p className="step-kicker">04 / {t.steps[3]}</p>
            <div className="step-title-row"><div><h2>{t.packingTitle}</h2><p className="step-help">{t.packingHelp}</p></div><button className="text-button" type="button" onClick={() => setState((current) => ({ ...current, customized: false, quantities: plannedQuantities({ ...current, customized: false }) }))}><RotateCcw size={14} />{t.reset}</button></div>
            {kind === "cabin-trolley" && !state.customized && <p className="packing-note">{t.cabinLightNote}{allowanceKg !== null && <> {t.trimmedNote(allowanceKg)}</>}</p>}
            {volumeAlert()}
            {Object.entries(packingCategories).map(([category, labels]) => <div className="packing-group" key={category}><h3>{labels[locale]}</h3><div className="packing-list">
              {packingItems.filter((item) => item.category === category).map((item) => {
                const count = state.quantities[item.id] ?? 0;
                return <div className={`packing-item ${count > 0 ? "has-items" : ""}`} key={item.id}>
                  <span className="packing-icon-wrap"><PackingIcon id={item.id} size={44} className="packing-icon" /></span>
                  <div className="packing-item-info"><span className="packing-item-name">{item.label[locale]}</span><span className="item-volume">~{item.volumeLiters} L · {item.weightKg} kg / {t.perItem}</span></div>
                  <div className="quantity-control">
                    <button type="button" aria-label={`− ${item.label[locale]}`} onClick={() => changeQuantity(item.id, -1)} disabled={count <= 0}>−</button>
                    <output key={count} className="quantity-pop">{count}</output>
                    <button type="button" aria-label={`+ ${item.label[locale]}`} onClick={(event) => { changeQuantity(item.id, 1); flyIntoBag(event.currentTarget.closest(".packing-item")?.querySelector(".packing-icon")); }}>+</button>
                  </div>
                </div>;
              })}
            </div></div>)}
            <div className="packing-total"><span>{t.itemsPlusCase(kg(estimate.itemsWeightKg), kind === "cabin-trolley" ? t.trolleyWord : t.suitcaseWord, kg(estimate.emptyCaseKg), kg(estimate.totalWeightKg))}</span><strong>{kg(estimate.totalWeightKg)} kg · {estimate.packedVolumeLiters} L</strong></div>
            <div className="floating-bag"><PackingSuitcase liters={estimate.packedVolumeLiters} referenceLiters={referenceLiters} size={78} status={volumeState} />{volumeState && volumeState !== "ok" && <span className={`floating-bag-flag is-${volumeState}`}>!</span>}</div>
          </div>}

          {current === "result" && <div className="step-content result-step">
            <p className="step-kicker">05 / {t.resultKicker}</p>
            <div className="result-hero">
              <div className="result-bag-visual"><PackingSuitcase liters={estimate.packedVolumeLiters} referenceLiters={referenceLiters} size={170} status={volumeState} /></div>
              <div className="result-capacity">
                <p className="eyebrow">{t.resultTitle}</p>
                {hasItems ? <>
                  <h2>{estimate.suggestedCapacityRangeLiters.min}<span>–</span>{estimate.suggestedCapacityRangeLiters.max}<small> L</small></h2>
                  <p className="size-pill">{t.sizes[estimate.size]}</p>
                </> : <p className="aside-empty">{t.emptyList}</p>}
              </div>
            </div>
            {volumeAlert()}
            {kind === "cabin-trolley" && estimate.exceedsCabin && <div className="result-note is-warning"><AlertTriangle size={17} /><p>{t.exceedsCabin}</p></div>}
            <div className="weight-block">
              <LuggageScale weightKg={estimate.totalWeightKg} allowanceKg={allowanceKg} label={`${t.weightLabel} (${t.emptyCase(estimate.emptyCaseKg)})`} locale={locale} />
              {weightNote && <p className={`weight-note ${overBy > 0 ? "is-over" : ""}`}>{overBy > 0 ? <AlertTriangle size={16} /> : <Check size={16} />}{weightNote}</p>}
            </div>
            {state.airlineId !== "none" && <div className="rule-panel"><div className="rule-panel-heading"><span className="rule-icon"><ShieldCheck size={17} /></span><div><h3>{t.ruleTitle}</h3></div></div><p>{verifiedSize ? t.ruleVerified(`${verifiedSize.height} × ${verifiedSize.width} × ${verifiedSize.depth} cm`) : rule?.status === "verified" ? t.ruleNoSize(rule.fareName[locale]) : t.ruleMissing}</p></div>}
            <label className="lightweight-toggle"><input type="checkbox" checked={state.lightweight} onChange={(event) => update({ lightweight: event.target.checked })} />{t.lightweight}</label>
            <ProductMatches locale={locale} criteria={criteria} />
          </div>}

          <div className="config-nav">
            {step > 0 ? <button className="button button-outline" type="button" onClick={() => goTo(step - 1)}><ArrowLeft size={16} />{t.back}</button> : <span />}
            {current === "result"
              ? <button className="button button-outline" type="button" onClick={restart}><RotateCcw size={15} />{t.restart}</button>
              : <button className="button button-dark" type="button" disabled={current === "kind" && state.kind === null} onClick={() => goTo(Math.min(step + 1, steps.length - 1))}>{current === "packing" ? t.calculate : t.next}<ArrowRight size={16} /></button>}
          </div>
        </section>

        <aside className="config-aside">
          <div className="aside-top"><span className="aside-label">{state.kind ? (kind === "cabin-trolley" ? t.cabin : t.checked) : t.kicker}</span><span className="aside-dot" /></div>
          <div className="aside-bag"><PackingSuitcase liters={estimate.packedVolumeLiters} referenceLiters={referenceLiters} size={180} status={volumeState} /></div>
          {volumeAlert(true)}
          {step >= 3 ? <>
            <LuggageScale weightKg={estimate.totalWeightKg} allowanceKg={allowanceKg} label={t.weightLabel} locale={locale} />
            <div className="aside-capacity"><span>{t.resultTitle}</span>{hasItems ? <strong>{estimate.suggestedCapacityRangeLiters.min}<small>–{estimate.suggestedCapacityRangeLiters.max} L</small></strong> : <strong className="aside-empty">{t.emptyList}</strong>}</div>
          </> : <p className="aside-waiting">{t.asideWaiting}</p>}
          <div className="aside-stat"><span>{t.sizes[estimate.size].split(" · ")[0]}</span><strong>{t.sizes[estimate.size].split(" · ")[1] ?? ""}</strong></div>
        </aside>
      </div>
    </div></main>
    <SiteFooter locale={locale} messages={messages} />
  </>;
}
