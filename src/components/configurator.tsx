"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Copy, RotateCcw, Search, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import { backpackItems as packingItems, packingCategories, suggestedQuantity } from "@/lib/data/packing-items";
import { airlines, baggageCategories, getAirlineRules, getVerifiedPolicy } from "@/lib/data/airlines";
import { estimateBackpackCapacity, type PackingStyle } from "@/lib/calculators/backpack-capacity";
import { checkAirlineCompatibility, maxVolumeLiters, volumeStatus } from "@/lib/calculators/airline-compatibility";
import { VolumeAlert } from "@/components/volume-alert";
import type { Messages } from "@/lib/i18n";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ProductMatches } from "@/components/product-matches";
import { PackingIcon } from "@/components/packing-icons";
import { PackingBackpack, flyIntoBag } from "@/components/packing-backpack";
import type { BackpackCategory, BackpackSearchCriteria } from "@/lib/products/provider";

const backpackCategories: (BackpackCategory | undefined)[] = ["everyday", "travel", "laptop", "hiking", undefined];
const laptopInches = [13, 14, 15, 16, 17];

const storageKey = "luggagefit-config-v1";
const configSchema = z.object({
  searchType: z.enum(["trip", "everyday"]).nullable(),
  tripDays: z.number().int().min(1).max(365),
  tripType: z.number().int().min(0).max(4),
  airlineId: z.string(),
  baggageType: z.string(),
  quantities: z.record(z.string(), z.number().int().min(0).max(99)),
  packingCustomized: z.boolean(),
  backpackType: z.number().int().min(0).max(4),
  packingStyle: z.number().int().min(0).max(2),
  hasLaptop: z.boolean(),
  laptopSize: z.number().int().min(0).max(4),
  dimensions: z.object({ height: z.string(), width: z.string(), depth: z.string(), weight: z.string() }),
});

type ConfigState = z.infer<typeof configSchema>;

function suggestedPacking(days: number, tripType: number): Record<string, number> {
  const quantities = Object.fromEntries(packingItems.map((item) => [item.id, suggestedQuantity(item.id, days)]));
  if (tripType === 1) {
    quantities.shirt = Math.max(quantities.shirt, Math.ceil(days / 3));
    quantities["formal-shoes"] = 1;
  }
  if (tripType === 2) {
    quantities.sandals = 1;
    quantities.shorts = Math.max(quantities.shorts, 2);
  }
  if (tripType === 3) {
    quantities.boots = 1;
    quantities.sweater = Math.max(quantities.sweater, 1);
  }
  return quantities;
}

function suggestedEverydayPacking(): Record<string, number> {
  const quantities = Object.fromEntries(packingItems.map((item) => [item.id, 0]));
  quantities.chargers = 1;
  quantities["power-bank"] = 1;
  quantities.documents = 1;
  quantities.bottle = 1;
  quantities.accessories = 1;
  return quantities;
}

function initialConfig(): ConfigState {
  return {
    searchType: null,
    tripDays: 5,
    tripType: 4,
    airlineId: "none",
    baggageType: "personal-item",
    quantities: suggestedPacking(5, 4),
    packingCustomized: false,
    backpackType: 1,
    packingStyle: 1,
    hasLaptop: false,
    laptopSize: 1,
    dimensions: { height: "", width: "", depth: "", weight: "" },
  };
}

export function Configurator({ locale, messages }: { locale: Locale; messages: Messages }) {
  const t = messages.config;
  const [config, setConfig] = useState<ConfigState>(initialConfig);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("config");
    try {
      if (shared) {
        const decoded = window.atob(shared.replace(/-/g, "+").replace(/_/g, "/"));
        const parsed = configSchema.safeParse(JSON.parse(decodeURIComponent(decoded)));
        if (parsed.success) startTransition(() => setConfig(parsed.data));
      } else {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = configSchema.safeParse(JSON.parse(saved));
          if (parsed.success) startTransition(() => setConfig(parsed.data));
        }
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
    startTransition(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(config));
  }, [config, loaded]);

  const selectedAirline = airlines.find((airline) => airline.id === config.airlineId);
  const selectedRule = selectedAirline
    ? getAirlineRules(selectedAirline.id).find((rule) => rule.baggageType === config.baggageType) ?? null
    : null;
  const estimate = estimateBackpackCapacity({
    usageMode: config.searchType === "everyday" ? "everyday" : "trip",
    tripDays: config.searchType === "everyday" ? undefined : config.tripDays,
    packingStyle: (["minimalist", "balanced", "extra-space"] as PackingStyle[])[config.packingStyle],
    items: packingItems.map((item) => ({
      name: item.id,
      quantity: config.quantities[item.id] ?? 0,
      volumeLiters: item.volumeLiters,
    })),
  });
  const dimensions = [config.dimensions.height, config.dimensions.width, config.dimensions.depth].every(Boolean)
    ? { height: Number(config.dimensions.height), width: Number(config.dimensions.width), depth: Number(config.dimensions.depth) }
    : null;
  const compatibility = checkAirlineCompatibility({
    rule: selectedRule,
    backpackDimensions: dimensions,
    backpackWeightKg: config.dimensions.weight ? Number(config.dimensions.weight) : null,
  });
  const packedVolume = estimate.estimatedPackedVolumeLiters;
  // Verified airline size → approximate liters; warn as soon as the list needs more than that.
  // Only cabin allowances: checked-bag size limits (e.g. Wizz Air 149×119×171 cm) aren't a useful volume check.
  const volumeLimit = config.searchType === "trip" && selectedRule?.baggageType !== "checked-bag" ? maxVolumeLiters(selectedRule) : null;
  const neededLiters = estimate.recommendedUsableCapacityLiters;
  const volumeState = volumeLimit ? volumeStatus(neededLiters, volumeLimit) : undefined;
  const volumeAlert = (compact = false) =>
    volumeLimit && volumeState && selectedAirline && selectedRule ? (
      <VolumeAlert
        locale={locale}
        status={volumeState}
        neededLiters={neededLiters}
        limitLiters={volumeLimit}
        airline={selectedAirline.name}
        allowance={baggageCategories.find((category) => category.id === selectedRule.baggageType)?.label[locale] ?? ""}
        size={`${selectedRule.maxHeightCm} × ${selectedRule.maxWidthCm} × ${selectedRule.maxDepthCm} cm`}
        compact={compact}
        planner="backpack"
      />
    ) : null;
  const productCriteria: BackpackSearchCriteria = {
    capacityRangeLiters: estimate.suggestedCapacityRangeLiters,
    backpackType: backpackCategories[config.backpackType],
    laptopRequired: config.hasLaptop,
    laptopInches: config.hasLaptop ? laptopInches[config.laptopSize] : undefined,
    dimensionsCm: config.searchType === "trip" && selectedRule && (selectedRule.maxHeightCm || selectedRule.maxWidthCm || selectedRule.maxDepthCm)
      ? { height: selectedRule.maxHeightCm ?? undefined, width: selectedRule.maxWidthCm ?? undefined, depth: selectedRule.maxDepthCm ?? undefined }
      : undefined,
  };
  const assumptions = [
    t.assumptionItemVolume,
    config.searchType === "everyday" ? t.assumptionEverydayBuffer : t.assumptionTripBuffer,
    t.assumptionCapacity,
  ];
  const stepNames: string[] = config.searchType === "everyday"
    ? ["purpose", "packing", "preferences", "result"]
    : ["purpose", "trip", "airline", "packing", "preferences", "result"];
  const currentStep = stepNames[step] ?? "purpose";
  const stepTitles = config.searchType === "everyday" ? t.stepsEveryday : t.stepsTrip;

  /** Moves between steps and reports the funnel (configurator_step, configurator_complete). */
  function goTo(next: number) {
    setStep(next);
    const name = stepNames[next];
    if (!name || next === step) return;
    track("configurator_step", { planner: "backpack", step: name, step_number: next + 1, mode: config.searchType });
    if (name === "result") {
      track("configurator_complete", {
        planner: "backpack",
        mode: config.searchType,
        trip_days: config.searchType === "trip" ? config.tripDays : undefined,
        airline: config.airlineId === "none" ? "none" : config.airlineId,
        baggage_type: config.airlineId === "none" ? undefined : config.baggageType,
        liters_min: estimate.suggestedCapacityRangeLiters.min,
        liters_max: estimate.suggestedCapacityRangeLiters.max,
        items_count: Object.values(config.quantities).reduce((sum, quantity) => sum + quantity, 0),
        volume_status: volumeState,
        laptop: config.hasLaptop,
      });
    }
  }

  function selectAirline(airlineId: string) {
    update({ airlineId });
    if (airlineId !== config.airlineId) track("airline_select", { planner: "backpack", airline: airlineId, verified: airlineId !== "none" && !!getVerifiedPolicy(airlineId) });
  }

  function update(patch: Partial<ConfigState>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  function selectPurpose(searchType: "trip" | "everyday") {
    if (config.searchType === null) track("configurator_start", { planner: "backpack", mode: searchType });
    setConfig((current) => ({
      ...current,
      searchType,
      airlineId: searchType === "everyday" ? "none" : current.airlineId,
      quantities: current.packingCustomized
        ? current.quantities
        : searchType === "everyday"
          ? suggestedEverydayPacking()
          : suggestedPacking(current.tripDays, current.tripType),
      backpackType: current.searchType === searchType ? current.backpackType : searchType === "everyday" ? 0 : 1,
    }));
  }

  function updateDuration(days: number) {
    setConfig((current) => ({
      ...current,
      tripDays: days,
      quantities: current.packingCustomized ? current.quantities : suggestedPacking(days, current.tripType),
    }));
  }

  function updateTripType(index: number) {
    setConfig((current) => ({
      ...current,
      tripType: index,
      quantities: current.packingCustomized ? current.quantities : suggestedPacking(current.tripDays, index),
    }));
  }

  function changeQuantity(id: string, delta: number) {
    if (delta > 0 && !(config.quantities[id] ?? 0)) track("packing_item_add", { planner: "backpack", item_id: id });
    setConfig((current) => ({
      ...current,
      packingCustomized: true,
      quantities: { ...current.quantities, [id]: Math.max(0, (current.quantities[id] ?? 0) + delta) },
    }));
  }

  function resetPacking() {
    setConfig((current) => ({
      ...current,
      packingCustomized: false,
      quantities: current.searchType === "everyday"
        ? suggestedEverydayPacking()
        : suggestedPacking(current.tripDays, current.tripType),
    }));
  }

  async function copyShareLink() {
    const url = new URL(window.location.href);
    const encoded = window.btoa(encodeURIComponent(JSON.stringify(config))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    url.searchParams.set("config", encoded);
    await navigator.clipboard.writeText(url.toString());
    track("share_link_copy", { planner: "backpack" });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function restart() {
    track("configurator_restart", { planner: "backpack" });
    setConfig(initialConfig());
    setStep(0);
    localStorage.removeItem(storageKey);
    window.history.replaceState({}, "", `/${locale}/backpack-configurator`);
  }

  const filteredAirlines = airlines.filter((airline) => airline.name.toLowerCase().includes(query.toLowerCase()));
  return <>
    <SiteHeader locale={locale} messages={messages} compact />
    <main className="config-page"><div className="config-shell">
      <Link className="back-home" href={`/${locale}`}><ArrowLeft size={15} />{locale === "it" ? "Torna alla home" : "Back to home"}</Link>
      <div className="config-intro"><p className="eyebrow"><span className="eyebrow-line" />{t.kicker}</p><h1>{t.title}</h1><p>{t.intro}</p></div>
      <div className="progress-row" aria-label={`${t.stepOf} ${step + 1} ${t.of} ${stepTitles.length}`}><div className="progress-track">{stepTitles.map((label, index) => <span key={label} className={`progress-segment ${index <= step ? "is-active" : ""}`} />)}</div><div className="progress-meta"><span>{t.stepOf} <strong>0{step + 1}</strong> {t.of} 0{stepTitles.length}</span><span>{stepTitles[step]}</span></div></div>
      <div className="config-layout">
        <section className="config-panel" aria-live="polite">
          {currentStep === "purpose" && <div className="step-content">
            <p className="step-kicker">01 / {stepTitles[0]}</p><h2>{t.purposeTitle}</h2><p className="step-help">{t.purposeHelp}</p>
            <div className="purpose-grid">
              <button type="button" className={`purpose-choice ${config.searchType === "trip" ? "is-selected" : ""}`} aria-pressed={config.searchType === "trip"} onClick={() => selectPurpose("trip")}><span className="purpose-number">01</span><strong>{t.travelPurpose}</strong><span>{t.travelPurposeHelp}</span><span className="radio-dot" /></button>
              <button type="button" className={`purpose-choice ${config.searchType === "everyday" ? "is-selected" : ""}`} aria-pressed={config.searchType === "everyday"} onClick={() => selectPurpose("everyday")}><span className="purpose-number">02</span><strong>{t.everydayPurpose}</strong><span>{t.everydayPurposeHelp}</span><span className="radio-dot" /></button>
            </div>
            <Link className="secondary-planner-link" href={`/${locale}/luggage-configurator`}>{locale === "it" ? "Viaggi con trolley o valigia? Prova il configuratore valigie" : "Travelling with a trolley or suitcase? Try the luggage planner"}<ArrowRight size={14} /></Link>
          </div>}

          {currentStep === "trip" && <div className="step-content">
            <p className="step-kicker">0{step + 1} / {stepTitles[step]}</p><h2>{t.tripDuration}</h2>
            <div className="duration-options">{[
              { range: [1, 2], label: locale === "it" ? "1–2 giorni" : "1–2 days" },
              { range: [3, 4], label: locale === "it" ? "3–4 giorni" : "3–4 days" },
              { range: [5, 7], label: locale === "it" ? "5–7 giorni" : "5–7 days" },
              { range: [8, 14], label: locale === "it" ? "8–14 giorni" : "8–14 days" },
              { range: [15, 30], label: locale === "it" ? "Oltre 14 giorni" : "More than 14 days" },
            ].map(({ range, label }) => <button key={label} className={`choice-tile ${config.tripDays >= range[0] && config.tripDays <= range[1] ? "is-selected" : ""}`} onClick={() => updateDuration(range[0])} type="button">{label}</button>)}</div>
            <label className="field-label" htmlFor="exact-days">{t.exactDays}</label><div className="number-field"><input id="exact-days" type="number" min="1" max="365" value={config.tripDays} onChange={(event) => updateDuration(Math.max(1, Number(event.target.value) || 1))} /><span>{t.days}</span></div>
            <h3 className="sub-question">{t.tripType}</h3><div className="option-list">{t.tripTypes.map((type, index) => <button type="button" className={`option-row ${config.tripType === index ? "is-selected" : ""}`} key={type} onClick={() => updateTripType(index)}><span className="radio-dot" />{type}</button>)}</div>
          </div>}

          {currentStep === "airline" && <div className="step-content">
            <p className="step-kicker">0{step + 1} / {stepTitles[step]}</p><h2>{t.airlineTitle}</h2><p className="step-help">{t.airlineHelp}</p>
            <label className="search-field"><Search size={17} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchAirline} /></label>
            <div className="airline-options" role="radiogroup" aria-label={t.airlineTitle}>
              <button type="button" role="radio" aria-checked={config.airlineId === "none"} className={`airline-choice no-airline ${config.airlineId === "none" ? "is-selected" : ""}`} onClick={() => selectAirline("none")}><span className="radio-dot" /><span>{t.noAirline}</span><span className="rule-state">{locale === "it" ? "Senza restrizioni" : "No restrictions"}</span></button>
              {filteredAirlines.map((airline) => <button type="button" role="radio" aria-checked={config.airlineId === airline.id} className={`airline-choice ${config.airlineId === airline.id ? "is-selected" : ""}`} key={airline.id} onClick={() => selectAirline(airline.id)}><span className="radio-dot" /><span>{airline.name}</span>{getVerifiedPolicy(airline.id) ? <span className="rule-state is-verified">{locale === "it" ? "✓ Misure verificate" : "✓ Sizes verified"}</span> : <span className="rule-state">{locale === "it" ? "Regole non verificate" : "Rules unverified"}</span>}</button>)}
              {filteredAirlines.length === 0 && <p className="empty-search">{locale === "it" ? "Nessuna compagnia trovata." : "No airlines found."}</p>}
            </div>
            {config.airlineId !== "none" && <div className="field-block"><label className="field-label" htmlFor="baggage-type">{t.baggageType}</label><select id="baggage-type" value={config.baggageType} onChange={(event) => update({ baggageType: event.target.value })}>{baggageCategories.map((category) => <option key={category.id} value={category.id}>{category.label[locale]}</option>)}</select></div>}
          </div>}

          {currentStep === "packing" && <div className="step-content">
            <p className="step-kicker">0{step + 1} / {stepTitles[step]}</p><div className="step-title-row"><div><h2>{t.packingTitle}</h2><p className="step-help">{config.searchType === "everyday" ? t.everydayPackingHelp : t.packingHelp}</p></div><button className="text-button" onClick={resetPacking} type="button"><RotateCcw size={14} />{t.reset}</button></div>
            {volumeAlert()}
            {Object.entries(packingCategories).map(([category, labels]) => <div className="packing-group" key={category}><h3>{labels[locale]}</h3><div className="packing-list">{packingItems.filter((item) => item.category === category).map((item) => <div className={`packing-item ${(config.quantities[item.id] ?? 0) > 0 ? "has-items" : ""}`} key={item.id}><span className="packing-icon-wrap"><PackingIcon id={item.id} size={44} className="packing-icon" /></span><div className="packing-item-info"><span className="packing-item-name">{item.label[locale]}</span><span className="item-volume">~{item.volumeLiters} L / {locale === "it" ? "pezzo" : "item"}</span></div><div className="quantity-control"><button type="button" aria-label={`${locale === "it" ? "Rimuovi" : "Remove"} ${item.label[locale]}`} onClick={() => changeQuantity(item.id, -1)} disabled={(config.quantities[item.id] ?? 0) <= 0}>−</button><output key={config.quantities[item.id] ?? 0} className="quantity-pop" aria-label={`${item.label[locale]} quantity`}>{config.quantities[item.id] ?? 0}</output><button type="button" aria-label={`${locale === "it" ? "Aggiungi" : "Add"} ${item.label[locale]}`} onClick={(event) => { changeQuantity(item.id, 1); flyIntoBag(event.currentTarget.closest(".packing-item")?.querySelector(".packing-icon")); }}>+</button></div></div>)}</div></div>)}
            <div className="packing-total"><span>{t.estimatedPacked}</span><strong>{packedVolume.toFixed(1)} L</strong></div>
            {/* Mobile: the sidebar is far below the list, so a small bag floats in view to catch the items. */}
            <div className="floating-bag"><PackingBackpack liters={packedVolume} size={72} status={volumeState} />{volumeState && volumeState !== "ok" && <span className={`floating-bag-flag is-${volumeState}`}>!</span>}</div>
          </div>}

          {currentStep === "preferences" && <div className="step-content">
            <p className="step-kicker">0{step + 1} / {stepTitles[step]}</p><h2>{t.preferencesTitle}</h2>
            <label className="field-label" htmlFor="backpack-type">{t.backpackType}</label><select id="backpack-type" value={config.backpackType} onChange={(event) => update({ backpackType: Number(event.target.value) })}>{t.backpackTypes.map((type, index) => <option key={type} value={index}>{type}</option>)}</select>
            <h3 className="sub-question">{t.packingStyle}</h3><div className="style-options">{t.packingStyles.map((style, index) => <button key={style} className={`style-choice ${config.packingStyle === index ? "is-selected" : ""}`} type="button" onClick={() => update({ packingStyle: index })}><span className="style-marker">0{index + 1}</span><span>{style}</span><span className="radio-dot" /></button>)}</div>
            <h3 className="sub-question">{t.laptop}</h3><div className="segmented-options"><button type="button" className={config.hasLaptop ? "is-selected" : ""} onClick={() => update({ hasLaptop: true, quantities: { ...config.quantities, laptop: Math.max(1, config.quantities.laptop ?? 0) }, packingCustomized: true })}>{t.yes}</button><button type="button" className={!config.hasLaptop ? "is-selected" : ""} onClick={() => update({ hasLaptop: false, quantities: { ...config.quantities, laptop: 0 }, packingCustomized: true })}>{t.no}</button></div>
            {config.hasLaptop && <div className="field-block"><label className="field-label" htmlFor="laptop-size">{locale === "it" ? "Dimensione dello schermo" : "Laptop screen size"}</label><select id="laptop-size" value={config.laptopSize} onChange={(event) => update({ laptopSize: Number(event.target.value) })}>{t.laptopSizes.map((size, index) => <option key={size} value={index}>{size}</option>)}</select><p className="field-hint">{locale === "it" ? "La diagonale non garantisce la compatibilità: controlla le misure effettive del laptop." : "Screen diagonal alone doesn't guarantee fit. Check your laptop's actual dimensions."}</p></div>}
          </div>}

          {currentStep === "result" && <div className="step-content result-step">
            <p className="step-kicker">0{step + 1} / {stepTitles[step]}</p><div className="result-hero"><div className="result-bag-visual"><PackingBackpack liters={packedVolume} size={170} status={volumeState} /></div><div className="result-capacity"><p className="eyebrow">{config.searchType === "everyday" ? t.everydayResultTitle : t.resultTitle}</p><h2>{estimate.suggestedCapacityRangeLiters.min}<span>–</span>{estimate.suggestedCapacityRangeLiters.max}<small> L</small></h2><p>{config.searchType === "everyday" ? t.everydayResultLead : t.resultLead}</p><div className="capacity-meter"><span style={{ width: `${Math.min(100, Math.max(14, (packedVolume / estimate.suggestedCapacityRangeLiters.max) * 100))}%` }} /></div><div className="meter-labels"><span>{t.packingVolume}</span><strong>{packedVolume.toFixed(1)} L</strong></div></div></div>
            {volumeAlert()}
            <div className="result-note"><ShieldCheck size={17} /><p>{t.capacityNote}</p></div>
            <ProductMatches locale={locale} criteria={productCriteria} />
            <div className="summary-block"><h3>{config.searchType === "everyday" ? t.everydaySummary : t.summary}</h3><div className="summary-grid"><div><span>{config.searchType === "everyday" ? t.use : t.trip}</span><strong>{config.searchType === "everyday" ? t.everydayUse : `${config.tripDays} ${t.days}`}</strong></div>{config.searchType === "trip" && <><div><span>{t.airline}</span><strong>{selectedAirline?.name ?? t.noAirline}</strong></div><div><span>{t.allowance}</span><strong>{selectedAirline ? baggageCategories.find((category) => category.id === config.baggageType)?.label[locale] : "—"}</strong></div></>}<div><span>{t.margin}</span><strong>{Math.round(estimate.capacityMargin * 100)}%</strong></div></div></div>
            {config.searchType === "trip" && selectedAirline && <><div className="rule-panel"><div className="rule-panel-heading"><span className="rule-icon"><ShieldCheck size={17} /></span><div><h3>{t.ruleTitle}</h3><span className="status-pill"><span />{selectedRule?.status === "verified" ? (locale === "it" ? "Regola verificata" : "Verified rule") : t.unverified}</span></div></div>{selectedRule?.status === "verified" ? <>
              <div className="rule-limits">{selectedRule.maxHeightCm && selectedRule.maxWidthCm && selectedRule.maxDepthCm ? <span>{selectedRule.maxHeightCm} × {selectedRule.maxWidthCm} × {selectedRule.maxDepthCm} cm</span> : null}{selectedRule.maxWeightKg ? <span>{selectedRule.maxWeightKg} kg</span> : null}<span>{selectedRule.fareName[locale]}</span></div>
              <p>{selectedRule.conditions[locale]} {locale === "it" ? "Inserisci le misure esterne del tuo zaino qui sotto per controllare se rientra." : "Enter your backpack's external size below to check whether it fits."}</p>
            </> : <p>{t.unverifiedText}</p>}<a className="official-link" href={selectedRule?.sourceUrl ?? selectedAirline.website} target="_blank" rel="noreferrer">{locale === "it" ? `Visita il sito ufficiale di ${selectedAirline.name}` : `Visit ${selectedAirline.name}'s official site`}<ArrowRight size={14} /></a></div>
            <div className="dimensions-block"><h3>{t.dimensionTitle}</h3><p className="step-help">{t.dimensionHelp}</p><div className="dimension-fields">{(["height", "width", "depth", "weight"] as const).map((key) => <label key={key}><span>{t[key]}</span><input type="number" min="0" step="0.1" inputMode="decimal" value={config.dimensions[key]} onChange={(event) => update({ dimensions: { ...config.dimensions, [key]: event.target.value } })} /></label>)}</div><p className={`fit-status is-${compatibility.status}`}><span className="status-dot" />{compatibility.status === "cannot-verify" ? t.unverified : compatibility.status === "compatible" ? (locale === "it" ? "Compatibile" : "Compatible") : (locale === "it" ? "Non compatibile" : "Not compatible")}</p></div></>}
            {config.searchType === "everyday" && <div className="result-note"><Check size={17} /><p>{t.noAirlineCheck}</p></div>}
            <details className="assumptions-details"><summary>{t.assumptions}<span>+</span></summary><ul>{assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul><p>{t.margin}: {Math.round(estimate.capacityMargin * 100)}% · {t.preferenceSummary}: {t.backpackTypes[config.backpackType]}</p></details>
            <div className="result-actions"><button className="button button-outline" type="button" onClick={() => goTo(stepNames.indexOf("packing"))}><ArrowLeft size={15} />{t.editPacking}</button>{config.searchType === "trip" && <button className="button button-outline" type="button" onClick={() => goTo(stepNames.indexOf("airline"))}>{t.changeAirline}</button>}<button className="button button-dark" type="button" onClick={copyShareLink}><Copy size={15} />{copied ? t.copied : t.copy}</button></div>
          </div>}

          <div className="config-nav">{step > 0 && currentStep !== "result" ? <button className="button button-outline" type="button" onClick={() => goTo(step - 1)}><ArrowLeft size={16} />{t.back}</button> : currentStep === "result" ? <button className="button button-outline" type="button" onClick={restart}><RotateCcw size={15} />{t.restart}</button> : <span />}{currentStep !== "result" && <button className="button button-dark" type="button" disabled={currentStep === "purpose" && config.searchType === null} onClick={() => goTo(Math.min(step + 1, stepNames.length - 1))}>{currentStep === "preferences" ? t.calculate : t.next}<ArrowRight size={16} /></button>}</div>
        </section>
        <aside className="config-aside" aria-label={config.searchType === "everyday" ? t.everydaySummary : config.searchType === "trip" ? t.summary : t.purposeTitle}>
          <div className="aside-top"><span className="aside-label">{config.searchType === "everyday" ? t.everydaySummary : config.searchType === "trip" ? t.summary : t.purposeTitle}</span><span className="aside-dot" /></div>
          <div className="aside-bag"><PackingBackpack liters={packedVolume} size={190} status={volumeState} /></div>
          {volumeAlert(true)}
          <div className="aside-capacity"><span>{locale === "it" ? "Capienza utile consigliata" : "Suggested usable capacity"}</span><strong>{config.searchType ? estimate.suggestedCapacityRangeLiters.min : "—"}<small>{config.searchType ? `–${estimate.suggestedCapacityRangeLiters.max} L` : ""}</small></strong></div>
          {config.searchType && <><div className="aside-stat"><span>{config.searchType === "everyday" ? t.use : t.trip}</span><strong>{config.searchType === "everyday" ? t.everydayUse : `${config.tripDays} ${t.days}`}</strong></div>{config.searchType === "trip" && <div className="aside-stat"><span>{t.airline}</span><strong>{selectedAirline?.name ?? (locale === "it" ? "Nessuna" : "None selected")}</strong></div>}<div className="aside-stat"><span>{t.estimatedPacked}</span><strong>{packedVolume.toFixed(1)} L</strong></div></>}
          <div className="aside-foot"><span className="aside-foot-icon"><Check size={14} /></span><span>{config.searchType ? (locale === "it" ? "La stima si aggiorna mentre modifichi i dettagli." : "Your estimate updates as you make changes.") : t.purposePending}</span></div>
        </aside>
      </div>
    </div></main>
    <SiteFooter locale={locale} messages={messages} />
  </>;
}