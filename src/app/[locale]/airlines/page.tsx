import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { airlines, getVerifiedPolicy } from "@/lib/data/airlines";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const title = locale === "it" ? "Guide bagagli delle compagnie aeree" : "Airline baggage guides";
  return { title, description: locale === "it" ? "Consulta le fonti ufficiali e le categorie di bagaglio per le principali compagnie aeree." : "Browse official baggage-policy sources and baggage categories for major airlines.", alternates: { canonical: `/${locale}/airlines`, languages: { en: "/en/airlines", it: "/it/airlines" } } };
}

export default async function AirlineDirectory({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const messages = getMessages(locale);
  const italian = locale === "it";
  return <><SiteHeader locale={locale as "en" | "it"} messages={messages} /><main className="content-page"><p className="eyebrow"><span className="eyebrow-line" />{italian ? "PRIMA DI PARTIRE" : "BEFORE YOU FLY"}</p><h1>{italian ? "Regole bagagli, dalla fonte giusta." : "Baggage rules, from the right source."}</h1><p className="content-lede">{italian ? "Le franchigie dipendono da tariffa, tratta e data. Queste guide ti portano alla fonte ufficiale: non pubblichiamo misure non verificate." : "Allowances can depend on fare, route, and date. These guides point you to the official source; we do not publish unverified dimensions."}</p><div className="airline-directory">{airlines.map((airline) => <article className="airline-card" key={airline.id}><div><h2>{airline.name}</h2><p>{airline.country}</p>{getVerifiedPolicy(airline.id) && <span className="airline-card-verified"><BadgeCheck size={13} />{italian ? "Misure verificate" : "Sizes verified"}</span>}</div><Link href={`/${locale}/airlines/${airline.slug}`}>{italian ? "Apri la guida" : "Open guide"}<ArrowRight size={14} /></Link></article>)}</div></main><SiteFooter locale={locale as "en" | "it"} messages={messages} /></>;
}