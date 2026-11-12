import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return { title: locale === "it" ? "Chi siamo" : "About Baggofit", description: locale === "it" ? "Il nostro approccio a capienza e bagagli aerei." : "How Baggofit approaches backpack capacity and airline baggage rules." };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const messages = getMessages(locale);
  const italian = locale === "it";
  return <><SiteHeader locale={locale as "en" | "it"} messages={messages} /><main className="content-page"><p className="eyebrow"><span className="eyebrow-line" />BAGGOFIT</p><h1>{italian ? "Viaggia leggero, con le informazioni giuste." : "Travel lighter, with better information."}</h1><p className="content-lede">{italian ? "Baggofit aiuta a stimare la capienza utile di uno zaino a partire dal viaggio e dagli oggetti che vuoi portare." : "Baggofit helps you estimate backpack capacity from your trip and the items you plan to carry."}</p><div className="content-columns"><section><h2>{italian ? "Stime, non promesse" : "Estimates, not promises"}</h2><p>{italian ? "I volumi degli oggetti e la capienza sono approssimativi. Forma, imbottiture e scomparti cambiano lo spazio utile." : "Item volumes and capacity are estimates. Shape, padding, and compartments affect how much a backpack can actually hold."}</p></section><section><h2>{italian ? "Regole aeree verificate" : "Verified airline rules"}</h2><p>{italian ? "Le policy variano e cambiano. Non dichiareremo uno zaino compatibile senza regole aggiornate e dimensioni esterne reali." : "Policies vary and change. We do not call a backpack compatible without current verified rules and real external dimensions."}</p></section></div></main><SiteFooter locale={locale as "en" | "it"} messages={messages} /></>;
}