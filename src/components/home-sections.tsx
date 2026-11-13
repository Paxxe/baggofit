import Link from "next/link";
import { ArrowRight, BadgeCheck, Plane } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import { packingItems } from "@/lib/data/packing-items";
import { airlines, getAirlineRules, getVerifiedPolicy, type AirlineBaggageRule } from "@/lib/data/airlines";
import { guides } from "@/lib/data/guides";
import { PackingBackpack } from "@/components/packing-backpack";
import { PackingSuitcase } from "@/components/packing-suitcase";

const size = (rule: AirlineBaggageRule | undefined) =>
  rule?.status === "verified" && rule.maxHeightCm && rule.maxWidthCm && rule.maxDepthCm ? `${rule.maxHeightCm}×${rule.maxWidthCm}×${rule.maxDepthCm}` : null;

const verifiedAirlines = () =>
  airlines
    .filter((airline) => getVerifiedPolicy(airline.id))
    .map((airline) => {
      const rules = getAirlineRules(airline.id);
      const personal = rules.find((rule) => rule.baggageType === "personal-item");
      const cabin = rules.find((rule) => rule.baggageType === "cabin-bag");
      return { airline, personal: size(personal), cabin: size(cabin), cabinKg: cabin?.status === "verified" ? cabin.maxWeightKg : null };
    });

/** Strip of real numbers from the site's data (no invented figures). */
export function HomeStats({ locale }: { locale: Locale }) {
  const it = locale === "it";
  const stats = [
    { value: String(verifiedAirlines().length), label: it ? "compagnie aeree con misure verificate" : "airlines with verified sizes" },
    { value: String(packingItems.length), label: it ? "oggetti con volume e peso stimati" : "items with estimated volume and weight" },
    { value: "2", label: it ? "configuratori: zaino e valigia" : "planners: backpack and suitcase" },
    { value: "200", label: it ? "zaini e valigie per ricerca, dai negozi ufficiali" : "backpacks and suitcases per search, from official stores" },
  ];
  return (
    <section className="home-stats" aria-label={it ? "Baggofit in numeri" : "Baggofit in numbers"}>
      {stats.map((stat) => <div key={stat.label} className="home-stat"><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
    </section>
  );
}

export function HomePlanners({ locale }: { locale: Locale }) {
  const it = locale === "it";
  const planners = [
    {
      href: `/${locale}/backpack-configurator`,
      tone: "tomato",
      visual: <PackingBackpack liters={18} size={130} />,
      title: it ? "Configuratore zaino" : "Backpack planner",
      text: it ? "Per tutti i giorni o per un viaggio con il solo bagaglio a mano." : "For everyday carry or a cabin-bag-only trip.",
      points: it ? ["Capienza giusta in litri", "Avviso se superi le misure della compagnia", "Zaini reali che rientrano"] : ["The right capacity in liters", "Alert when you exceed the airline size", "Real backpacks that fit"],
      cta: it ? "Trova il tuo zaino" : "Find your backpack",
    },
    {
      href: `/${locale}/luggage-configurator`,
      tone: "cobalt",
      visual: <PackingSuitcase liters={26} referenceLiters={40} size={130} />,
      title: it ? "Configuratore valigia" : "Suitcase planner",
      text: it ? "Trolley da cabina o valigia da stiva: taglia e peso, prima di prenotare." : "Cabin trolley or checked suitcase: size and weight, before you book.",
      points: it ? ["Taglia: cabina, media o grande", "Pesa-valigia con la tua franchigia", "Trolley e valigie dai negozi ufficiali"] : ["Size: cabin, medium or large", "Luggage scale with your allowance", "Trolleys and suitcases from official stores"],
      cta: it ? "Trova la tua valigia" : "Find your suitcase",
    },
  ];
  return (
    <section className="home-planners">
      <div className="cartoon-section-heading"><p className="cartoon-eyebrow"><span />{it ? "Due strumenti, un obiettivo" : "Two tools, one goal"}</p><h2>{it ? "Zaino o valigia? Partiamo da qui." : "Backpack or suitcase? Start here."}</h2></div>
      <div className="home-planner-grid">
        {planners.map((planner) => (
          <Link key={planner.href} href={planner.href} className={`home-planner home-planner-${planner.tone}`} data-track="cta_click" data-track-location="home_planners" data-track-target={planner.tone === "tomato" ? "backpack" : "luggage"}>
            <div className="home-planner-visual">{planner.visual}</div>
            <div className="home-planner-copy">
              <h3>{planner.title}</h3>
              <p>{planner.text}</p>
              <ul>{planner.points.map((point) => <li key={point}>{point}</li>)}</ul>
              <span className="home-planner-cta">{planner.cta}<ArrowRight size={16} /></span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeAirlines({ locale }: { locale: Locale }) {
  const it = locale === "it";
  const rows = verifiedAirlines();
  return (
    <section className="home-airlines">
      <div className="cartoon-section-heading">
        <p className="cartoon-eyebrow"><span />{it ? "Controllate sulle fonti ufficiali" : "Checked against official sources"}</p>
        <h2>{it ? "Misure del bagaglio a mano, a colpo d'occhio." : "Cabin bag sizes, at a glance."}</h2>
      </div>
      <div className="home-airline-grid">
        {rows.map(({ airline, personal, cabin, cabinKg }) => (
          <Link key={airline.id} href={`/${locale}/airlines/${airline.slug}`} className="home-airline">
            <span className="home-airline-name"><Plane size={16} />{airline.name}</span>
            <dl>
              <div><dt>{it ? "Sotto il sedile" : "Under the seat"}</dt><dd>{personal ? `${personal} cm` : "—"}</dd></div>
              <div><dt>{it ? "In cappelliera" : "Overhead bin"}</dt><dd>{cabin ? `${cabin} cm` : "—"}{cabinKg ? ` · ${cabinKg} kg` : ""}</dd></div>
            </dl>
          </Link>
        ))}
      </div>
      <p className="home-airlines-note"><BadgeCheck size={16} />{it ? "Tariffe e regole cambiano: ogni scheda riporta fonte e data di verifica." : "Fares and rules change: every page shows its source and check date."} <Link href={`/${locale}/airlines`}>{it ? "Tutte le compagnie" : "All airlines"}<ArrowRight size={14} /></Link></p>
    </section>
  );
}

export function HomeGuides({ locale }: { locale: Locale }) {
  const it = locale === "it";
  const latest = [...guides].sort((a, b) => (b.published ?? "").localeCompare(a.published ?? "")).slice(0, 3);
  return (
    <section className="home-guides">
      <div className="cartoon-section-heading">
        <p className="cartoon-eyebrow"><span />{it ? "Dalle guide" : "From the guides"}</p>
        <h2>{it ? "Viaggia leggero, con criterio." : "Travel light, with intention."}</h2>
      </div>
      <div className="home-guide-grid">
        {latest.map((guide) => (
          <Link key={guide.slug} href={`/${locale}/guides/${guide.slug}`} className="home-guide">
            {guide.category && <span className="home-guide-tag">{guide.category[locale]}</span>}
            <h3>{guide.title[locale]}</h3>
            <p>{guide.description[locale]}</p>
            <span className="home-guide-link">{it ? "Leggi la guida" : "Read the guide"}<ArrowRight size={15} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
