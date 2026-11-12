import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, CircleHelp } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { airlines, baggageCategories, getAirlineRules, getVerifiedPolicy, type AirlineBaggageRule } from "@/lib/data/airlines";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export function generateStaticParams() {
  return airlines.map(({ slug }) => ({ slug }));
}

const formatDate = (iso: string, locale: "en" | "it") =>
  new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

const sizeLabel = (rule: AirlineBaggageRule) =>
  rule.maxHeightCm && rule.maxWidthCm && rule.maxDepthCm ? `${rule.maxHeightCm} × ${rule.maxWidthCm} × ${rule.maxDepthCm} cm` : null;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const airline = airlines.find((item) => item.slug === slug);
  if (!airline) notFound();
  const italian = locale === "it";
  const policy = getVerifiedPolicy(airline.id);
  if (policy) {
    const rules = getAirlineRules(airline.id);
    const personal = rules.find((rule) => rule.baggageType === "personal-item");
    const cabin = rules.find((rule) => rule.baggageType === "cabin-bag");
    const sizes = [personal && sizeLabel(personal), cabin && sizeLabel(cabin)].filter(Boolean).join(italian ? " e " : " and ");
    return {
      title: italian ? `Misure bagaglio a mano ${airline.name}` : `${airline.name} cabin baggage size`,
      description: italian
        ? `Misure bagaglio ${airline.name} verificate sulla fonte ufficiale: ${sizes}. Scopri quale zaino rientra.`
        : `${airline.name} baggage sizes checked against the official source: ${sizes}. Find a backpack that fits.`,
      alternates: { canonical: `/${locale}/airlines/${slug}`, languages: { en: `/en/airlines/${slug}`, it: `/it/airlines/${slug}` } },
    };
  }
  return {
    title: italian ? `Bagagli ${airline.name}: fonti ufficiali` : `${airline.name} baggage: official sources`,
    description: italian ? `Consulta le fonti ufficiali per le regole sui bagagli di ${airline.name}. Le misure non sono ancora verificate.` : `Find official baggage policy sources for ${airline.name}. Dimensions are not yet verified by Baggofit.`,
    // Thin pages stay out of search results until their rules are verified.
    robots: { index: false, follow: true },
  };
}

export default async function AirlineDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const airline = airlines.find((item) => item.slug === slug);
  if (!airline) notFound();
  const messages = getMessages(locale);
  const language = locale as "en" | "it";
  const italian = language === "it";
  const rules = getAirlineRules(airline.id);
  const policy = getVerifiedPolicy(airline.id);

  return <>
    <SiteHeader locale={language} messages={messages} />
    <main className="content-page">
      <Link className="back-home" href={`/${locale}/airlines`}><ArrowLeft size={15} />{italian ? "Tutte le compagnie" : "All airlines"}</Link>
      <p className="eyebrow" style={{ marginTop: 26 }}><span className="eyebrow-line" />{italian ? "GUIDA BAGAGLI" : "BAGGAGE GUIDE"}</p>
      <h1>{policy ? (italian ? `Misure bagagli ${airline.name}` : `${airline.name} baggage sizes`) : airline.name}</h1>
      <p className="content-lede">{policy
        ? (italian ? `Le misure qui sotto sono state controllate sulla pagina ufficiale di ${airline.name}. Tariffe e condizioni possono cambiare: verifica sempre la tua prenotazione prima di partire.` : `The limits below were checked against ${airline.name}'s official page. Fares and conditions can change: always check your booking before you travel.`)
        : (italian ? `Le franchigie di ${airline.name} possono variare in base a tariffa, tratta e data del viaggio. Verifica sempre i dettagli della tua prenotazione.` : `${airline.name} baggage allowances may vary by fare, route, and travel date. Always check the details for your booking.`)}</p>

      {policy && <p className="verified-badge"><BadgeCheck size={18} />{italian ? `Verificato il ${formatDate(policy.verifiedAt, language)}` : `Checked on ${formatDate(policy.verifiedAt, language)}`} · <a className="official-link" href={policy.sourceUrl} target="_blank" rel="noreferrer">{italian ? "fonte ufficiale" : "official source"}<ArrowUpRight size={14} /></a></p>}

      <div className="baggage-rules">
        {rules.map((rule) => {
          const size = sizeLabel(rule);
          const category = baggageCategories.find((item) => item.id === rule.baggageType)?.label[language];
          return <article className={`baggage-rule baggage-rule-${rule.baggageType} ${rule.status === "verified" ? "is-verified" : ""}`} key={rule.id}>
            <p className="baggage-rule-type">{category}</p>
            {rule.status === "verified"
              ? <>
                  <p className="baggage-rule-size">{size ?? (italian ? "Misure non indicate" : "Size not stated")}</p>
                  <p className="baggage-rule-weight">{rule.maxWeightKg ? `${italian ? "Peso massimo" : "Max weight"}: ${rule.maxWeightKg} kg` : (italian ? "Peso: non indicato" : "Weight: not stated")}</p>
                  <p className="baggage-rule-fare">{rule.fareName[language]}</p>
                  <p className="baggage-rule-notes">{rule.conditions[language]}</p>
                </>
              : <p className="baggage-rule-notes"><CircleHelp size={15} /> {italian ? "Non ancora verificato: consulta il sito ufficiale per tariffa e tratta." : "Not verified yet: consult the official site for your fare and route."}</p>}
          </article>;
        })}
      </div>

      <div className="airline-actions">
        <Link className="button button-primary" href={`/${locale}/backpack-configurator`}>{italian ? "Trova uno zaino che rientra" : "Find a backpack that fits"}<ArrowRight size={16} /></Link>
        <a className="button button-outline" href={policy?.sourceUrl ?? airline.website} target="_blank" rel="noreferrer">{italian ? "Verifica sul sito ufficiale" : "Check the official policy"}<ArrowUpRight size={15} /></a>
      </div>
    </main>
    <SiteFooter locale={language} messages={messages} />
  </>;
}
