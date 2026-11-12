import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return { title: locale === "it" ? "Informativa sulla privacy" : "Privacy" };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const messages = getMessages(locale);
  const italian = locale === "it";
  return <><SiteHeader locale={locale as "en" | "it"} messages={messages} /><main className="content-page"><p className="eyebrow"><span className="eyebrow-line" />BAGGOFIT</p><h1>{italian ? "Privacy, senza complicazioni." : "Privacy, without the fuss."}</h1><p className="content-lede">{italian ? "La configurazione del viaggio viene salvata nel browser del tuo dispositivo. Non serve un account e non chiediamo dati personali." : "Your trip configuration is stored in your browser. No account is needed and we do not ask for personal information."}</p><div className="content-columns"><section><h2>{italian ? "Dati salvati sul dispositivo" : "Data stored on your device"}</h2><p>{italian ? "Baggofit usa l'archiviazione locale per ricordare la configurazione tra le visite. Puoi cancellarla azzerando il configuratore o eliminando i dati del sito dal browser." : "Baggofit uses local storage to remember your configuration between visits. You can clear it by restarting the configurator or removing this site's data in your browser."}</p></section><section><h2>{italian ? "Link condivisi" : "Shared links"}</h2><p>{italian ? "Quando scegli di copiare un link, le impostazioni del viaggio sono codificate nell'indirizzo. Chiunque abbia il link può leggerle: evita di includere informazioni personali." : "When you copy a share link, your trip settings are encoded in its URL. Anyone with the link can read them, so do not include personal information."}</p></section><section><h2>{italian ? "Servizi esterni" : "External services"}</h2><p>{italian ? "I link ai siti delle compagnie aeree aprono servizi esterni soggetti alle rispettive informative." : "Links to airline websites open external services governed by their own privacy notices."}</p></section><section><h2>{italian ? "Contatti" : "Contact"}</h2><p>{italian ? "Questa informativa è una bozza per l'MVP; aggiungi i dati del titolare e una revisione legale prima del lancio pubblico." : "This is an MVP draft. Add the operator's contact details and obtain legal review before public launch."}</p></section></div></main><SiteFooter locale={locale as "en" | "it"} messages={messages} /></>;
}