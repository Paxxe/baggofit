import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Backpack, Luggage } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

const copy = {
  it: {
    metaTitle: "Chi siamo",
    metaDescription: "Baggofit ti aiuta a trovare lo zaino o il trolley giusto per i tuoi viaggi e per tutti i giorni, confrontando prodotti da tantissimi negozi online.",
    title: "Lo zaino e il trolley giusti, senza girare cento siti.",
    lede: "Baggofit è un servizio gratuito che ti aiuta a trovare zaini e trolley adatti ai tuoi viaggi o all'uso di tutti i giorni. Ci dici come viaggi e cosa porti, noi calcoliamo la misura che ti serve e ti proponiamo i modelli giusti da tantissimi negozi online, tutti in un unico posto.",
    problemTitle: "Perché esiste Baggofit",
    problem: [
      "Scegliere uno zaino o un trolley sembra facile, finché non ci provi. Ogni sito usa misure diverse, i litri dichiarati non dicono quanto ci sta davvero, e le regole del bagaglio a mano cambiano da compagnia a compagnia.",
      "Il risultato? Ore passate ad aprire schede, confrontare tabelle e sperare che al gate il bagaglio entri nel misuratore. Baggofit nasce per togliere di mezzo questa fatica.",
    ],
    whatTitle: "Cosa facciamo per te",
    what: [
      ["Calcoliamo la misura giusta", "Partiamo da quello che porti davvero (vestiti, laptop, beauty, scarpe) e dalla durata del viaggio, e ti diciamo quanti litri ti servono. Niente “prendi il più grande, non si sa mai”."],
      ["Controlliamo le regole delle compagnie", "Per le compagnie aeree principali verifichiamo le misure del bagaglio a mano sulle pagine ufficiali e indichiamo la data del controllo. Se una regola non è verificata, lo diciamo."],
      ["Cerchiamo nei negozi per te", "Ti proponiamo zaini e trolley reali da tantissimi negozi online, dai negozi ufficiali dei brand agli shop specializzati, già filtrati per capienza e misure."],
      ["Ti mandiamo dal negozio", "Non vendiamo nulla: quando trovi il modello giusto, compri direttamente sul sito del negozio, con i suoi prezzi, le sue spedizioni e i suoi resi."],
    ],
    usesTitle: "Per viaggiare e per tutti i giorni",
    uses: [
      ["In viaggio", "Weekend, settimana al mare, trasferta di lavoro: trovi lo zaino o il trolley che rientra nel bagaglio a mano della tua compagnia, senza supplementi al gate."],
      ["Tutti i giorni", "Ufficio, università, palestra: trovi lo zaino della capienza giusta per quello che porti ogni giorno, con lo scomparto per il tuo laptop."],
    ],
    howTitle: "Come funziona",
    steps: [
      ["Racconta il tuo viaggio", "Durata, compagnia aerea, oppure l'uso quotidiano."],
      ["Scegli cosa porti", "Una lista già pronta che modifichi in pochi tocchi."],
      ["Ricevi la tua misura", "Capienza consigliata e, se voli, il controllo delle misure."],
      ["Scegli tra i modelli", "Prodotti veri da tanti negozi, con filtri per prezzo e marca."],
    ],
    promisesTitle: "Le nostre promesse",
    promises: [
      ["Stime oneste", "La capienza è una stima ragionata, non una garanzia: forma e imbottiture cambiano lo spazio utile. Ti spieghiamo sempre come l'abbiamo calcolata."],
      ["Niente regole inventate", "Non diciamo mai che un bagaglio “va bene” per una compagnia senza misure verificate e dimensioni reali del prodotto."],
      ["Prezzi reali", "Prezzi e disponibilità arrivano dai negozi. Se un negozio vende in un'altra valuta, ti mostriamo la conversione e lo segnaliamo."],
      ["Nessun account", "Non serve registrarsi: le tue scelte restano nel tuo browser e puoi condividerle con un link."],
    ],
    ctaTitle: "Pronto a trovare il tuo?",
    backpack: "Configuratore zaino",
    luggage: "Configuratore trolley",
  },
  en: {
    metaTitle: "About Baggofit",
    metaDescription: "Baggofit helps you find the right backpack or suitcase for your trips and everyday life, comparing products from lots of online stores.",
    title: "The right backpack and suitcase, without visiting a hundred sites.",
    lede: "Baggofit is a free service that helps you find backpacks and suitcases that suit your trips or everyday life. Tell us how you travel and what you carry: we work out the size you need and show you the right models from lots of online stores, all in one place.",
    problemTitle: "Why Baggofit exists",
    problem: [
      "Choosing a backpack or a suitcase looks easy until you try. Every site measures differently, advertised liters don't tell you what really fits, and cabin baggage rules change from airline to airline.",
      "The result? Hours of open tabs, comparing tables and hoping the bag fits the sizer at the gate. Baggofit exists to take that hassle away.",
    ],
    whatTitle: "What we do for you",
    what: [
      ["We work out the right size", "We start from what you actually carry (clothes, laptop, toiletries, shoes) and how long you're away, and tell you how many liters you need. No “get the biggest, just in case”."],
      ["We check airline rules", "For the main airlines we check cabin baggage sizes on their official pages and show the date of the check. If a rule isn't verified, we say so."],
      ["We search the stores for you", "We show you real backpacks and suitcases from lots of online stores, from brands' official shops to specialist retailers, already filtered by capacity and size."],
      ["We send you to the store", "We don't sell anything: when you find the right model, you buy it on the store's own site, with its prices, shipping and returns."],
    ],
    usesTitle: "For travel and for every day",
    uses: [
      ["Travel", "Weekend away, a week at the beach, a business trip: find the backpack or suitcase that fits your airline's cabin allowance, with no fees at the gate."],
      ["Every day", "Office, university, gym: find a backpack with the right capacity for what you carry every day, with a sleeve for your laptop."],
    ],
    howTitle: "How it works",
    steps: [
      ["Tell us about your trip", "Length, airline, or everyday use."],
      ["Choose what you carry", "A ready-made list you adjust in a few taps."],
      ["Get your size", "Suggested capacity and, if you fly, a size check."],
      ["Pick from the models", "Real products from many stores, with price and brand filters."],
    ],
    promisesTitle: "Our promises",
    promises: [
      ["Honest estimates", "Capacity is a reasoned estimate, not a guarantee: shape and padding change usable space. We always explain how we worked it out."],
      ["No made-up rules", "We never say a bag “fits” an airline without verified rules and the product's real dimensions."],
      ["Real prices", "Prices and availability come from the stores. If a store sells in another currency, we show the conversion and flag it."],
      ["No account", "No sign-up needed: your choices stay in your browser and you can share them with a link."],
    ],
    ctaTitle: "Ready to find yours?",
    backpack: "Backpack planner",
    luggage: "Suitcase planner",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const t = copy[locale === "it" ? "it" : "en"];
  return { title: t.metaTitle, description: t.metaDescription, alternates: { canonical: `/${locale}/about`, languages: { en: "/en/about", it: "/it/about" } } };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const lang = locale as "en" | "it";
  const messages = getMessages(locale);
  const t = copy[lang];
  const ctas = (
    <div className="about-ctas">
      <Link className="button button-primary" href={`/${lang}/backpack-configurator`} data-track="cta_click" data-track-location="about" data-track-target="backpack"><Backpack size={18} />{t.backpack}<ArrowRight size={16} /></Link>
      <Link className="button button-outline" href={`/${lang}/luggage-configurator`} data-track="cta_click" data-track-location="about" data-track-target="luggage"><Luggage size={18} />{t.luggage}<ArrowRight size={16} /></Link>
    </div>
  );
  return (
    <>
      <SiteHeader locale={lang} messages={messages} switchPath="/about" />
      <main className="content-page about-page">
        <p className="eyebrow"><span className="eyebrow-line" />BAGGOFIT</p>
        <h1>{t.title}</h1>
        <p className="content-lede">{t.lede}</p>
        {ctas}

        <h2>{t.problemTitle}</h2>
        {t.problem.map((paragraph) => <p key={paragraph} className="about-text">{paragraph}</p>)}

        <h2>{t.whatTitle}</h2>
        <div className="content-columns">{t.what.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div>

        <h2>{t.usesTitle}</h2>
        <div className="content-columns">{t.uses.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div>

        <h2>{t.howTitle}</h2>
        <ol className="about-steps">{t.steps.map(([title, body], index) => <li key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{body}</p></li>)}</ol>

        <h2>{t.promisesTitle}</h2>
        <div className="content-columns">{t.promises.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</div>

        <div className="about-final">
          <h2>{t.ctaTitle}</h2>
          {ctas}
        </div>
      </main>
      <SiteFooter locale={lang} messages={messages} />
    </>
  );
}
