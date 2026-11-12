/**
 * Shopping markets for product recommendations: which country products must ship to, and the currency
 * to show. The visitor's country is detected from the hosting provider's IP-geolocation header,
 * falling back to the browser language region, and can always be overridden in the UI.
 */

const EURO = ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"] as const;

export const marketCurrencies: Readonly<Record<string, string>> = {
  ...Object.fromEntries(EURO.map((country) => [country, "EUR"])),
  GB: "GBP",
  CH: "CHF",
  SE: "SEK",
  DK: "DKK",
  NO: "NOK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  US: "USD",
  CA: "CAD",
  AU: "AUD",
};

/** Countries offered in the "ships to" selector. */
export const supportedCountries = Object.keys(marketCurrencies);

export const DEFAULT_COUNTRY = "IT";

export type CountrySource = "selected" | "ip" | "language" | "default";

export function isSupportedCountry(country: string | null | undefined): country is string {
  return !!country && country.toUpperCase() in marketCurrencies;
}

/** Region of the first Accept-Language entry that names a supported country ("it-IT,it;q=0.9" → "IT"). */
export function countryFromAcceptLanguage(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(",")) {
    const region = part.trim().split(";")[0].split("-")[1]?.toUpperCase();
    if (isSupportedCountry(region)) return region;
  }
  return undefined;
}

/**
 * Picks the visitor's country: explicit choice → IP country header (Vercel, Cloudflare, or a proxy
 * setting x-country) → browser language region → Italy.
 */
export function resolveCountry(headers: Headers, selected?: string | null): { country: string; source: CountrySource } {
  if (isSupportedCountry(selected)) return { country: selected.toUpperCase(), source: "selected" };
  const ipCountry = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? headers.get("x-country");
  if (isSupportedCountry(ipCountry)) return { country: ipCountry.toUpperCase(), source: "ip" };
  const languageCountry = countryFromAcceptLanguage(headers.get("accept-language"));
  if (languageCountry) return { country: languageCountry, source: "language" };
  return { country: DEFAULT_COUNTRY, source: "default" };
}
