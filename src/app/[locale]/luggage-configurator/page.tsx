import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LuggageConfigurator } from "@/components/luggage-configurator";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return {
    title: locale === "it" ? "Configuratore trolley e valigie" : "Trolley & suitcase planner",
    description: locale === "it"
      ? "Scopri che taglia di trolley o valigia ti serve e quanto pesa il tuo bagaglio rispetto alla franchigia."
      : "Find the trolley or suitcase size you need and how your luggage weight compares to your allowance.",
    alternates: { canonical: `/${locale}/luggage-configurator`, languages: { en: "/en/luggage-configurator", it: "/it/luggage-configurator" } },
  };
}

export default async function LuggageConfiguratorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return <LuggageConfigurator locale={locale as "en" | "it"} messages={getMessages(locale)} />;
}
