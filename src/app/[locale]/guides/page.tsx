import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { guides } from "@/lib/data/guides";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return { title: locale === "it" ? "Guide per preparare i bagagli" : "Travel packing guides", description: locale === "it" ? "Consigli pratici per misurare lo zaino e capire la capienza utile." : "Practical guidance on measuring backpacks and understanding usable capacity.", alternates: { canonical: `/${locale}/guides`, languages: { en: "/en/guides", it: "/it/guides" } } };
}

export default async function GuideDirectory({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  const messages = getMessages(locale);
  const language = locale as "en" | "it";
  const italian = language === "it";
  return <><SiteHeader locale={language} messages={messages} /><main className="content-page"><p className="eyebrow"><span className="eyebrow-line" />{italian ? "VIAGGIA CON CRITERIO" : "TRAVEL WITH INTENTION"}</p><h1>{italian ? "Guide essenziali per fare la valigia." : "Essential guides for packing well."}</h1><p className="content-lede">{italian ? "Informazioni pratiche per scegliere lo zaino e controllare il bagaglio prima di partire." : "Practical information for choosing a backpack and checking your baggage before you go."}</p><div className="guide-list">{guides.map((guide) => <article className="guide-card" key={guide.slug}>{guide.category && <span className="guide-card-meta">{guide.category[language]}</span>}<h2>{guide.title[language]}</h2><p>{guide.description[language]}</p><Link href={`/${locale}/guides/${guide.slug}`}>{italian ? "Leggi la guida" : "Read guide"}<ArrowRight size={14} /></Link></article>)}</div></main><SiteFooter locale={language} messages={messages} /></>;
}