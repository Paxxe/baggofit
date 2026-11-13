import type { MetadataRoute } from "next";
import { airlines, getVerifiedPolicy } from "@/lib/data/airlines";
import { guides } from "@/lib/data/guides";

const locales = ["en", "it"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const localized = (path: string, lastModified?: string) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: { en: `${baseUrl}/en${path}`, it: `${baseUrl}/it${path}` } },
    }));

  const routes = ["", "/backpack-configurator", "/luggage-configurator", "/guides", "/about", "/privacy", "/airlines"].flatMap((route) => localized(route));
  const guideRoutes = guides.flatMap((guide) => localized(`/guides/${guide.slug}`, guide.updated ?? guide.published));
  // Only airline pages with verified rules are indexable (the others are noindex).
  const airlineRoutes = airlines.flatMap((airline) => {
    const policy = getVerifiedPolicy(airline.id);
    return policy ? localized(`/airlines/${airline.slug}`, policy.verifiedAt) : [];
  });
  return [...routes, ...guideRoutes, ...airlineRoutes];
}
