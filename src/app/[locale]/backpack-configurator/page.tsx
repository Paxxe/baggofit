import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Configurator } from "@/components/configurator";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return {
    title: locale === "it" ? "Configuratore zaino da viaggio" : "Backpack configurator",
    description: locale === "it" ? "Calcola la capienza dello zaino adatta al tuo viaggio e alla tua lista." : "Estimate the backpack capacity that fits your trip and packing list.",
    alternates: { canonical: `/${locale}/backpack-configurator`, languages: { en: "/en/backpack-configurator", it: "/it/backpack-configurator" } },
  };
}

export default async function ConfiguratorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return <Configurator locale={locale as "en" | "it"} messages={getMessages(locale)} />;
}