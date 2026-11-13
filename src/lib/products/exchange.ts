import { cacheLife } from "next/cache";
import type { BackpackProduct } from "./provider";

const ECB_DAILY = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml";

/** Units of each currency per 1 EUR, from the ECB reference rates. */
export type EurRates = Record<string, number>;

export function parseEcbRates(xml: string): EurRates {
  const rates: EurRates = { EUR: 1 };
  for (const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) rates[match[1]] = Number(match[2]);
  return rates;
}

/** ECB daily reference rates, cached for hours (they change once a day). */
export async function getEurRates(): Promise<EurRates> {
  "use cache: remote";
  cacheLife("hours");
  const response = await fetch(ECB_DAILY, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`ECB rates → HTTP ${response.status}`);
  return parseEcbRates(await response.text());
}

export function convert(amount: number, from: string, to: string, rates: EurRates): number | null {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

/**
 * Shows foreign-currency prices in the visitor's currency (e.g. Cotopaxi's USD prices in EUR: its store
 * converts with Global-e at browse time, which the catalog doesn't see). The original price is kept so
 * the UI can show it, and the converted one is marked as an estimate.
 */
export function localizePrices(products: BackpackProduct[], currency: string, rates: EurRates | null): BackpackProduct[] {
  if (!rates) return products;
  return products.map((product) => {
    if (product.price === undefined || !product.currency || product.currency === currency) return product;
    const converted = convert(product.price, product.currency, currency, rates);
    if (converted === null) return product;
    return { ...product, price: Math.round(converted * 100) / 100, currency, originalPrice: product.price, originalCurrency: product.currency };
  });
}

/** Rates, or null when the ECB can't be reached (prices then stay in their original currency). */
export async function ratesOrNull() {
  try {
    return await getEurRates();
  } catch (error) {
    console.warn("[exchange]", error instanceof Error ? error.message : error);
    return null;
  }
}
