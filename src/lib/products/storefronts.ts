/**
 * Official brand stores that aren't (yet) in Shopify's Global Catalog but expose the per-store
 * Storefront Catalog MCP (`/api/ucp/mcp`). They're searched alongside the global catalog.
 * Add a store only after checking it answers `search_catalog` and ships to the listed countries.
 * To find candidates: `npm run audit:stores` (see scripts/audit-storefronts.mjs).
 */
export interface DirectStorefront {
  /** Store origin, e.g. https://eu.eastpak.com */
  url: string;
  /** Brand shown on product cards */
  brand: string;
  /** ISO countries the store sells to; the store is skipped for other markets. */
  countries: readonly string[];
  /** Product kinds worth searching there. */
  kinds: readonly ("backpack" | "cabin-trolley" | "checked-suitcase")[];
}

const EU = ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "DK", "SE", "PL", "CZ", "HU", "RO"] as const;

export const directStorefronts: readonly DirectStorefront[] = [
  { url: "https://eu.eastpak.com", brand: "Eastpak", countries: EU, kinds: ["backpack", "cabin-trolley", "checked-suitcase"] },
  // Found with scripts/audit-storefronts.mjs (2026-11-12): official stores answering in EUR for Italy.
  // Re-checked with sellers' names: Bric's, Db, Antler and Pacsafe are already in the global catalog.
  // Away also appears there for some searches; products found in both are merged (productKey).
  { url: "https://www.nomatic.com", brand: "NOMATIC", countries: EU, kinds: ["backpack", "cabin-trolley", "checked-suitcase"] },
  { url: "https://eu.dakine.com", brand: "Dakine", countries: EU, kinds: ["backpack"] },
  // Home-market stores (prices in USD/GBP): only searched for visitors from that country.
  { url: "https://tortugabackpacks.com", brand: "Tortuga", countries: ["US"], kinds: ["backpack", "cabin-trolley"] },
  { url: "https://www.awaytravel.com", brand: "Away", countries: ["US"], kinds: ["backpack", "cabin-trolley", "checked-suitcase"] },
  { url: "https://www.tourparavel.com", brand: "Paravel", countries: ["US"], kinds: ["backpack", "cabin-trolley", "checked-suitcase"] },
];
