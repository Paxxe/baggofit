import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartoonHome } from "@/components/cartoon-home";
import { getMessages, locales } from "@/lib/i18n";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return {
    title: locale === "it" ? "Trova lo zaino giusto per il tuo viaggio" : "Find the right backpack for your next trip",
    description: locale === "it" ? "Stima la capienza utile dello zaino in base al tuo viaggio e a cosa vuoi portare." : "Estimate the usable backpack capacity you need based on your trip and packing list.",
    alternates: { canonical: `/${locale}`, languages: { en: "/en", it: "/it" } },
  };
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  return <CartoonHome locale={locale as "en" | "it"} messages={getMessages(locale)} />;
}
