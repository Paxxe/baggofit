"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { productItem, pushEcommerce, track, trackProductClick } from "@/lib/analytics";
import { ArrowLeft, ArrowRight, ArrowUpRight, Laptop, MapPin, Ruler, SlidersHorizontal, Sparkles, Star, Store, Weight, X } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import type { BackpackProduct, BackpackSearchCriteria, MatchReason, ProductKind } from "@/lib/products/provider";
import { supportedCountries, type CountrySource } from "@/lib/products/markets";
import type { ProductFacets, ProductFilters, ProductSort } from "@/lib/products/refine";

const countryStorageKey = "luggagefit-country";

function readStoredCountry() {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage.getItem(countryStorageKey) ?? undefined;
  } catch {
    return undefined;
  }
}

const copy = {
  en: {
    title: "Backpacks that match",
    titles: { backpack: "Backpacks that match", "cabin-trolley": "Cabin trolleys that match", "checked-suitcase": "Suitcases that match" } satisfies Record<ProductKind, string>,
    lead: "Picked from brands' official stores in the Shopify catalog, based on your answers.",
    loading: "Looking through the stores…",
    empty: "No product matches all your answers yet. Try a different backpack type or packing style.",
    error: "The stores couldn't be reached right now. Try again in a moment.",
    view: "View in store",
    shipsTo: "Ships to",
    sortBy: "Sort by",
    sorts: { relevance: "Best match", "price-asc": "Price: low to high", "price-desc": "Price: high to low", rating: "Best rated" } satisfies Record<ProductSort, string>,
    price: "Price",
    anyPrice: "Any",
    upTo: (value: string) => `Up to ${value}`,
    from: (value: string) => `From ${value}`,
    brand: "Brand",
    allBrands: "All brands",
    fitsOnly: (count: number) => `Only confirmed to fit the airline (${count})`,
    clearFilters: "Clear filters",
    ofTotal: (shown: number, total: number) => `${shown} of ${total}`,
    filters: "Filters",
    soldBy: "Sold by",
    converted: "converted",
    convertedHint: "Converted at today's ECB rate. The store may show a different amount (duties, shipping).",
    found: (count: number) => `${count} results`,
    pageOf: (page: number, pages: number) => `Page ${page} of ${pages}`,
    previous: "Previous",
    next: "Next",
    pagination: "Result pages",
    detected: "detected automatically",
    note: "Prices and availability come from each brand's store and may change. Capacity and sizes are read from the product data and may be approximate: check the maker's specs before buying.",
    reasons: {
      "capacity-in-range": "Capacity in your range",
      "capacity-close": "Capacity close to your range",
      "capacity-over-fits-size": "Rated larger, but within the airline size",
      "laptop-size-confirmed": "Fits your laptop",
      "laptop-sleeve": "Laptop sleeve (size not stated)",
      "fits-airline-size": "Within the airline size",
      "size-unverified": "Check size for your airline",
      "type-match": "Your kind of backpack",
      lightweight: "Lightweight",
      "capacity-estimated": "Capacity estimated from size",
    } satisfies Record<MatchReason, string>,
  },
  it: {
    title: "Zaini che corrispondono",
    titles: { backpack: "Zaini che corrispondono", "cabin-trolley": "Trolley da cabina che corrispondono", "checked-suitcase": "Valigie che corrispondono" } satisfies Record<ProductKind, string>,
    lead: "Scelti tra i negozi ufficiali dei brand nel catalogo Shopify, in base alle tue risposte.",
    loading: "Cerchiamo nei negozi…",
    empty: "Nessun prodotto corrisponde ancora a tutte le tue risposte. Prova un altro tipo di zaino o stile di viaggio.",
    error: "Al momento non riusciamo a raggiungere i negozi. Riprova tra poco.",
    view: "Vedi nel negozio",
    shipsTo: "Spedizione in",
    sortBy: "Ordina per",
    sorts: { relevance: "Più adatti", "price-asc": "Prezzo crescente", "price-desc": "Prezzo decrescente", rating: "Più apprezzati" } satisfies Record<ProductSort, string>,
    price: "Prezzo",
    anyPrice: "Tutti",
    upTo: (value: string) => `Fino a ${value}`,
    from: (value: string) => `Da ${value}`,
    brand: "Brand",
    allBrands: "Tutti i brand",
    fitsOnly: (count: number) => `Solo misure compatibili con la compagnia (${count})`,
    clearFilters: "Azzera filtri",
    ofTotal: (shown: number, total: number) => `${shown} di ${total}`,
    filters: "Filtri",
    soldBy: "Venduto da",
    converted: "convertito",
    convertedHint: "Convertito al cambio BCE di oggi. Il negozio può mostrare un importo diverso (dazi, spedizione).",
    found: (count: number) => `${count} risultati`,
    pageOf: (page: number, pages: number) => `Pagina ${page} di ${pages}`,
    previous: "Precedente",
    next: "Successiva",
    pagination: "Pagine dei risultati",
    detected: "rilevato automaticamente",
    note: "Prezzi e disponibilità arrivano dal negozio di ogni brand e possono cambiare. Capienza e misure sono ricavate dai dati del prodotto e possono essere approssimative: verifica le specifiche prima di acquistare.",
    reasons: {
      "capacity-in-range": "Capienza nel tuo intervallo",
      "capacity-close": "Capienza vicina al tuo intervallo",
      "capacity-over-fits-size": "Litri dichiarati più alti, ma nelle misure",
      "laptop-size-confirmed": "Ci sta il tuo laptop",
      "laptop-sleeve": "Tasca laptop (misura non indicata)",
      "fits-airline-size": "Nelle misure della compagnia",
      "size-unverified": "Verifica le misure per la compagnia",
      "type-match": "Il tuo tipo di zaino",
      lightweight: "Leggera",
      "capacity-estimated": "Capienza stimata dalle misure",
    } satisfies Record<MatchReason, string>,
  },
} as const;

type State = { status: "loading" } | { status: "ready"; products: BackpackProduct[]; total: number; page: number; pageCount: number } | { status: "error" };

const PAGE_SIZE = 6;

/** Compact page list: 1 … 4 5 6 … 10 */
function pageList(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index > 0 && value - sorted[index - 1] > 1 ? ["gap" as const, value] : [value]));
}
type Market = { country: string; currency: string; source: CountrySource };

/** Price bands per product type (in the shop currency, normally EUR). */
const priceBands: Record<ProductKind, [number | undefined, number | undefined][]> = {
  backpack: [[undefined, 80], [80, 150], [150, undefined]],
  "cabin-trolley": [[undefined, 100], [100, 200], [200, undefined]],
  "checked-suitcase": [[undefined, 120], [120, 250], [250, undefined]],
};
const noFilters: ProductFilters = { sort: "relevance" };

export function ProductMatches({ locale, criteria, heading, lead, listName }: { locale: Locale; criteria: BackpackSearchCriteria; /** Overrides for editorial use (articles) */ heading?: string; lead?: string; /** Analytics list name (where the results are shown) */ listName?: string }) {
  const kind = criteria.productKind ?? "backpack";
  const list = listName ?? `configurator_${kind}`;
  const t = copy[locale];
  const [state, setState] = useState<State>({ status: "loading" });
  // Country picked by the visitor (remembered); otherwise the server detects it.
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(readStoredCountry);
  const [market, setMarket] = useState<Market | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // The page resets to 1 whenever the answers, language or country change.
  const [filters, setFilters] = useState<ProductFilters>(noFilters);
  const [facets, setFacets] = useState<{ facets: ProductFacets; unfilteredTotal: number } | null>(null);
  const searchKey = useMemo(() => JSON.stringify({ ...criteria, locale, country: selectedCountry, filters }), [criteria, locale, selectedCountry, filters]);
  const filtersActive = filters.priceMin !== undefined || filters.priceMax !== undefined || !!filters.brand || !!filters.fitsOnly || (filters.sort ?? "relevance") !== "relevance";
  const updateFilters = (patch: Partial<ProductFilters>) => {
    for (const [filter, value] of Object.entries(patch)) track("product_filter", { product_kind: kind, filter, value: value === undefined ? "any" : String(value), list_name: list });
    setFilters((current) => ({ ...current, ...patch }));
  };
  const [pageState, setPageState] = useState({ key: searchKey, page: 1 });
  const page = pageState.key === searchKey ? pageState.page : 1;
  const body = useMemo(() => JSON.stringify({ ...JSON.parse(searchKey), page, pageSize: PAGE_SIZE }), [searchKey, page]);

  const goToPage = (next: number) => {
    track("product_page", { product_kind: kind, page: next, list_name: list });
    setPageState({ key: searchKey, page: next });
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const countryNames = useMemo(() => {
    const names = new Intl.DisplayNames([locale === "it" ? "it-IT" : "en-GB"], { type: "region" });
    return supportedCountries.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [locale]);

  const chooseCountry = (country: string) => {
    track("country_change", { country, list_name: list });
    setSelectedCountry(country);
    try {
      window.localStorage.setItem(countryStorageKey, country);
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    // Debounced so editing answers doesn't fire a request per keystroke.
    const timer = window.setTimeout(async () => {
      setState({ status: "loading" });
      try {
        const response = await fetch("/api/backpacks", { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { products: BackpackProduct[]; total: number; unfilteredTotal: number; facets: ProductFacets; page: number; pageCount: number; market?: Market };
        if (data.market) setMarket(data.market);
        setFacets({ facets: data.facets, unfilteredTotal: data.unfilteredTotal });
        setState({ status: "ready", products: data.products, total: data.total, page: data.page, pageCount: data.pageCount });
        track("product_results", { product_kind: kind, list_name: list, results: data.total, page: data.page, country: data.market?.country, empty: data.total === 0 });
        pushEcommerce("view_item_list", { item_list_name: list, items: data.products.map((product, index) => productItem(product, (data.page - 1) * PAGE_SIZE + index, list, kind)) });
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: "error" });
        if (!(error instanceof DOMException)) console.warn("[product-matches]", error);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [body, kind, list]);

  const currency = market?.currency ?? "EUR";
  const formatMoney = (value: number) => new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const formatPrice = (product: BackpackProduct) =>
    product.price === undefined
      ? null
      : product.currency
        ? new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-US", { style: "currency", currency: product.currency, maximumFractionDigits: product.price % 1 ? 2 : 0 }).format(product.price)
        : product.price.toFixed(2);

  return (
    <section className="product-matches" ref={sectionRef} aria-live="polite" aria-busy={state.status === "loading"}>
      <div className="product-matches-heading">
        <span className="product-matches-icon"><Sparkles size={16} /></span>
        <div><h3>{heading ?? t.titles[kind]}</h3><p>{lead ?? t.lead}</p></div>
      </div>
      <div className="product-market">
        <MapPin size={14} />
        <label htmlFor="product-country">{t.shipsTo}</label>
        <select id="product-country" value={selectedCountry ?? market?.country ?? ""} onChange={(event) => chooseCountry(event.target.value)}>
          {!selectedCountry && !market && <option value="">…</option>}
          {countryNames.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
        </select>
        {market && (market.source === "ip" || market.source === "language") && !selectedCountry && <span>{t.detected}</span>}
        {state.status === "ready" && <strong className="product-count">{filtersActive && facets ? t.ofTotal(state.total, facets.unfilteredTotal) : t.found(state.total)}</strong>}
      </div>
      {facets && (facets.unfilteredTotal > 0 || filtersActive) && <div className="product-filters" aria-label={t.filters}>
        <div className="filter-field">
          <label htmlFor="product-sort"><SlidersHorizontal size={14} />{t.sortBy}</label>
          <select id="product-sort" value={filters.sort ?? "relevance"} onChange={(event) => updateFilters({ sort: event.target.value as ProductSort })}>
            {(Object.keys(t.sorts) as ProductSort[]).map((sort) => <option key={sort} value={sort}>{t.sorts[sort]}</option>)}
          </select>
        </div>
        {(facets.facets.brands.length > 0 || filters.brand) && <div className="filter-field">
          <label htmlFor="product-brand">{t.brand}</label>
          <select id="product-brand" value={filters.brand ?? ""} onChange={(event) => updateFilters({ brand: event.target.value || undefined })}>
            <option value="">{t.allBrands}</option>
            {facets.facets.brands.map((brand) => <option key={brand.name} value={brand.name}>{brand.name} ({brand.count})</option>)}
          </select>
        </div>}
        <div className="filter-field filter-prices" role="group" aria-label={t.price}>
          <span className="filter-label">{t.price}</span>
          <div className="price-chips">
            <button type="button" className={filters.priceMin === undefined && filters.priceMax === undefined ? "is-selected" : ""} onClick={() => updateFilters({ priceMin: undefined, priceMax: undefined })}>{t.anyPrice}</button>
            {priceBands[kind].map(([min, max]) => {
              const label = min === undefined ? t.upTo(formatMoney(max!)) : max === undefined ? t.from(formatMoney(min)) : `${formatMoney(min)}–${formatMoney(max)}`;
              const selected = filters.priceMin === min && filters.priceMax === max;
              return <button type="button" key={label} className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => updateFilters({ priceMin: min, priceMax: max })}>{label}</button>;
            })}
          </div>
        </div>
        {criteria.dimensionsCm && facets.facets.fitsCount > 0 && <label className="filter-toggle"><input type="checkbox" checked={!!filters.fitsOnly} onChange={(event) => updateFilters({ fitsOnly: event.target.checked || undefined })} />{t.fitsOnly(facets.facets.fitsCount)}</label>}
        {filtersActive && <button type="button" className="filter-clear" onClick={() => { track("product_filter", { product_kind: kind, filter: "clear_all", list_name: list }); setFilters(noFilters); }}><X size={14} />{t.clearFilters}</button>}
      </div>}
      {state.status === "ready" && state.pageCount > 1 && <div className="product-pager-top" aria-label={t.pagination}>
        <button type="button" className="page-arrow" aria-label={t.previous} onClick={() => goToPage(state.page - 1)} disabled={state.page <= 1}><ArrowLeft size={18} strokeWidth={2.6} /></button>
        <span>{t.pageOf(state.page, state.pageCount)}</span>
        <button type="button" className="page-arrow" aria-label={t.next} onClick={() => goToPage(state.page + 1)} disabled={state.page >= state.pageCount}><ArrowRight size={18} strokeWidth={2.6} /></button>
      </div>}

      {state.status === "loading" && <div className="product-grid" aria-label={t.loading}>{Array.from({ length: PAGE_SIZE }, (_, key) => key).map((key) => <div className="product-card is-skeleton" key={key}><div className="product-image" /><span /><span /></div>)}</div>}
      {state.status === "error" && <p className="product-matches-message">{t.error}</p>}
      {state.status === "ready" && state.products.length === 0 && <p className="product-matches-message">{t.empty}</p>}
      {state.status === "ready" && state.products.length > 0 && <div className="product-grid">
        {state.products.map((product, index) => <article className="product-card" key={product.id}>
          <div className="product-image">
            {product.imageUrl ? <Image src={product.imageUrl} alt={product.title} fill sizes="(max-width: 700px) 50vw, 220px" /> : null}
            {product.capacityLiters !== undefined && <span className="product-capacity">{product.capacityEstimated ? "~" : ""}{product.capacityLiters} L</span>}
          </div>
          <p className="product-brand">{product.maker ?? product.brand}</p>
          <h4>{product.title}</h4>
          <div className="product-specs">
            {product.laptopInches && <span><Laptop size={13} />{product.laptopInches}&quot;</span>}
            {product.emptyWeightKg !== undefined && <span><Weight size={13} />{product.emptyWeightKg.toLocaleString(locale === "it" ? "it-IT" : "en-US")} kg</span>}
            {product.rating && <span className="product-rating"><Star size={13} />{product.rating.value.toLocaleString(locale === "it" ? "it-IT" : "en-US", { maximumFractionDigits: 1 })} ({product.rating.count})</span>}
            {product.dimensions && <span><Ruler size={13} />{Math.round(product.dimensions.height)}×{Math.round(product.dimensions.width)}×{Math.round(product.dimensions.depth)} cm</span>}
          </div>
          {product.maker && product.brand && product.maker !== product.brand && <p className="product-store"><Store size={12} />{t.soldBy} {product.brand}</p>}
          <ul className="product-reasons">{product.matchReasons?.map((reason) => <li className={`reason-${reason}`} key={reason}>{t.reasons[reason]}</li>)}</ul>
          <div className="product-footer">
            <span className="product-price">
              <strong>{product.originalPrice !== undefined ? "~" : ""}{formatPrice(product)}</strong>
              {product.originalPrice !== undefined && product.originalCurrency && <small title={t.convertedHint}>{new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-US", { style: "currency", currency: product.originalCurrency, maximumFractionDigits: product.originalPrice % 1 ? 2 : 0 }).format(product.originalPrice)} · {t.converted}</small>}
            </span>
            {product.productUrl && <a href={product.productUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackProductClick(product, (state.page - 1) * PAGE_SIZE + index, list, kind)}>{t.view}<ArrowUpRight size={14} /></a>}
          </div>
        </article>)}
      </div>}
      {state.status === "ready" && state.pageCount > 1 && <nav className="product-pagination" aria-label={t.pagination}>
        <button type="button" className="page-step" onClick={() => goToPage(state.page - 1)} disabled={state.page <= 1}><ArrowLeft size={18} strokeWidth={2.6} /><span>{t.previous}</span></button>
        <ol>
          {pageList(state.page, state.pageCount).map((item, index) => item === "gap"
            ? <li key={`gap-${index}`} className="page-gap" aria-hidden="true">…</li>
            : <li key={item}><button type="button" className={item === state.page ? "is-current" : ""} aria-current={item === state.page ? "page" : undefined} aria-label={t.pageOf(item, state.pageCount)} onClick={() => goToPage(item)}>{item}</button></li>)}
        </ol>
        <button type="button" className="page-step" onClick={() => goToPage(state.page + 1)} disabled={state.page >= state.pageCount}><span>{t.next}</span><ArrowRight size={18} strokeWidth={2.6} /></button>
      </nav>}
      <p className="product-matches-note">{t.note}</p>
    </section>
  );
}
