import Link from "next/link";
import { ArrowDown, ArrowRight, Backpack, Check, Compass, Luggage, Ruler } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { Messages } from "@/lib/i18n";
import { BackpackStory } from "@/components/backpack-story";
import { HomeAirlines, HomeGuides, HomePlanners, HomeStats } from "@/components/home-sections";
import { HomeShowcase } from "@/components/home-showcase";
import { Suspense } from "react";

const copy = {
  en: {
    intro: { tag: "A little less guesswork. A lot more go.", title: "Your whole day, in its element.", body: "From the morning commute to a week away, find the backpack that carries just what you need." },
    cta: "Find your fit",
    secondary: "See how it works",
    story: [
      { tag: "02 / THE PACK", title: "Your essentials, in orbit.", body: "The things you reach for find their place, one by one." },
      { tag: "03 / THE READY", title: "Click. All set.", body: "A comfortable fit. A clear plan. And you're out the door." },
      { tag: "04 / THE GO", title: "Off you go.", body: "Packed for your real life, wherever it takes you." },
    ],
    scroll: "SCROLL TO PACK",
    howEyebrow: "A better fit, without the fuss",
    howTitle: "Three little steps. One big exhale.",
    steps: [
      ["Pick your kind of day", "Everyday essentials or a trip somewhere new? Start where you are."],
      ["Add what matters", "Build your list from the things you actually carry."],
      ["Meet your match", "Get a clear capacity estimate, with the assumptions out in the open."],
    ],
    noteEyebrow: "Baggofit, by design",
    noteTitle: "A good fit feels like you.",
    noteBody: "No one-size-fits-all answers. Just a thoughtful starting point for the way you move through the world.",
    notes: ["Your list stays editable", "No account, no fuss", "Airline rules are never guessed"],
    tagLabel: "READY TO GO",
    finalEyebrow: "READY WHEN YOU ARE",
    finalTitle: "Make room for your kind of day.",
    official: "Airline rules change. Always check the official policy for your booking.",
    finalBackpack: "Backpack planner",
    finalLuggage: "Suitcase planner",
  },
  it: {
    intro: { tag: "Meno dubbi. Più voglia di andare.", title: "Tutta la tua giornata, al suo posto.", body: "Dal tragitto del mattino a una settimana fuori, trova lo zaino che porta proprio quello che ti serve." },
    cta: "Trova la tua misura",
    secondary: "Scopri come funziona",
    story: [
      { tag: "02 / SI PREPARA", title: "Le cose giuste, in orbita.", body: "Gli oggetti che usi trovano spazio, uno alla volta." },
      { tag: "03 / CI SIAMO", title: "Click. Tutto chiuso.", body: "Una misura comoda, un piano chiaro. E si esce." },
      { tag: "04 / SI VA", title: "Pronti, via.", body: "Preparato per la vita vera, ovunque ti porti." },
    ],
    scroll: "SCORRI PER PREPARARE",
    howEyebrow: "La misura giusta, senza complicazioni",
    howTitle: "Tre piccoli passi. E si respira.",
    steps: [
      ["Scegli la tua giornata", "Oggetti quotidiani o un viaggio nuovo? Partiamo da te."],
      ["Aggiungi ciò che conta", "Crea la lista con quello che porti davvero."],
      ["Trova la tua misura", "Una stima chiara della capienza, con tutte le ipotesi spiegate."],
    ],
    noteEyebrow: "Baggofit, fatto con cura",
    noteTitle: "La misura giusta ti somiglia.",
    noteBody: "Niente risposte uguali per tutti. Solo un punto di partenza ragionato per il tuo modo di muoverti nel mondo.",
    notes: ["La lista resta modificabile", "Nessun account", "Le regole aeree non si inventano"],
    tagLabel: "PRONTO A PARTIRE",
    finalEyebrow: "QUANDO VUOI TU",
    finalTitle: "Fai spazio alla tua giornata.",
    official: "Le regole aeree cambiano. Verifica sempre la policy ufficiale della prenotazione.",
    finalBackpack: "Configuratore zaino",
    finalLuggage: "Configuratore trolley",
  },
} as const;

export function CartoonHome({ locale, messages }: { locale: Locale; messages: Messages }) {
  const t = copy[locale];
  const icons = [Compass, Ruler, Check];
  return (
    <div className="cartoon-home">
      <SiteHeader locale={locale} messages={messages} />
      <main>
        <BackpackStory
          locale={locale}
          intro={t.intro}
          chapters={t.story}
          scrollLabel={t.scroll}
          actions={<>
            <Link className="cartoon-button cartoon-button-primary" href={`/${locale}/backpack-configurator`}>{t.cta}<ArrowRight size={17} /></Link>
            <a className="cartoon-text-link" href="#how">{t.secondary}<ArrowDown size={15} /></a>
          </>}
        />

        <HomeStats locale={locale} />
        <HomePlanners locale={locale} />
        {/* Real products from real stores; streams in so it never blocks the page. */}
        <Suspense fallback={null}>
          <HomeShowcase locale={locale} />
        </Suspense>

        <section className="cartoon-how" id="how">
          <div className="cartoon-section-heading"><p className="cartoon-eyebrow"><span />{t.howEyebrow}</p><h2>{t.howTitle}</h2></div>
          <div className="cartoon-steps">{t.steps.map(([title, body], index) => {
            const Icon = icons[index];
            return <article className={`cartoon-step cartoon-step-${index + 1}`} key={title}>
              <div className="step-top"><span className="step-number">0{index + 1}</span><span className="step-icon"><Icon size={24} strokeWidth={2} /></span></div>
              <h3>{title}</h3><p>{body}</p>
            </article>;
          })}</div>
        </section>

        <HomeAirlines locale={locale} />
        <HomeGuides locale={locale} />

        <section className="cartoon-note">
          <div className="note-illustration" aria-hidden="true">
            <div className="note-ring" />
            <div className="note-tag"><span className="note-tag-hole" /><span className="note-tag-label">{t.tagLabel}</span><span className="note-tag-lines"><i /><i /><i /></span></div>
            <div className="note-star">✳</div><div className="note-star note-star-2">✳</div>
          </div>
          <div className="note-copy"><p className="cartoon-eyebrow"><span />{t.noteEyebrow}</p><h2>{t.noteTitle}</h2><p>{t.noteBody}</p><ul>{t.notes.map((note) => <li key={note}><span className="note-check"><Check size={14} strokeWidth={3} /></span>{note}</li>)}</ul></div>
        </section>

        <section className="cartoon-last-call"><p className="cartoon-eyebrow"><span />{t.finalEyebrow}</p><h2>{t.finalTitle}</h2><div className="cartoon-final-actions">
          <Link className="cartoon-button cartoon-button-ink" href={`/${locale}/backpack-configurator`}><Backpack size={19} />{t.finalBackpack}<ArrowRight size={17} /></Link>
          <Link className="cartoon-button cartoon-button-sun" href={`/${locale}/luggage-configurator`}><Luggage size={19} />{t.finalLuggage}<ArrowRight size={17} /></Link>
        </div><p className="cartoon-official">{t.official}</p></section>
      </main>
      <SiteFooter locale={locale} messages={messages} />
    </div>
  );
}
