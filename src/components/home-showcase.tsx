import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { ArrowRight, ArrowUpRight, Star, Store } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import type { BackpackProduct } from "@/lib/products/provider";
import { catalogConfigured, ShopifyGlobalCatalogProvider } from "@/lib/products/shopify-catalog";
import { localizePrices, ratesOrNull } from "@/lib/products/exchange";

interface Showcase {
  backpacks: BackpackProduct[];
  trolleys: BackpackProduct[];
  stores: string[];
}

/** One product per store, so the rail shows variety rather than five colours of the same bag. */
function onePerStore(products: BackpackProduct[], limit: number) {
  const seen = new Set<string>();
  return products.filter((product) => product.imageUrl && product.brand && !seen.has(product.brand) && seen.add(product.brand)).slice(0, limit);
}

/**
 * Real products for the home page, cached for hours (the catalog searches are cached too).
 * Fixed market (ships to Italy, EUR) so the page can be prerendered without request data.
 */
async function getShowcase(locale: Locale): Promise<Showcase> {
  "use cache";
  cacheLife("hours");
  const provider = new ShopifyGlobalCatalogProvider({ country: "IT", currency: "EUR", language: locale });
  const [foundBackpacks, foundTrolleys, rates] = await Promise.all([
    provider.searchBackpacks({ productKind: "backpack", backpackType: "travel", capacityRangeLiters: { min: 20, max: 30 }, limit: 60 }),
    provider.searchBackpacks({ productKind: "cabin-trolley", capacityRangeLiters: { min: 35, max: 45 }, dimensionsCm: { height: 55, width: 40, depth: 20 }, limit: 60 }),
    ratesOrNull(),
  ]);
  const backpacks = localizePrices(foundBackpacks, "EUR", rates);
  const trolleys = localizePrices(foundTrolleys, "EUR", rates);
  const stores = [...new Set([...backpacks, ...trolleys].map((product) => product.brand).filter((brand): brand is string => !!brand))];
  return { backpacks: onePerStore(backpacks, 4), trolleys: onePerStore(trolleys, 4), stores };
}

function ProductRail({ title, products, locale, moreHref, moreLabel }: { title: string; products: BackpackProduct[]; locale: Locale; moreHref: string; moreLabel: string }) {
  const it = locale === "it";
  const price = (product: BackpackProduct) =>
    product.price === undefined ? null : new Intl.NumberFormat(it ? "it-IT" : "en-GB", { style: "currency", currency: product.currency ?? "EUR", maximumFractionDigits: product.price % 1 ? 2 : 0 }).format(product.price);
  return (
    <div className="showcase-rail">
      <div className="showcase-rail-head"><h3>{title}</h3><Link href={moreHref}>{moreLabel}<ArrowRight size={15} /></Link></div>
      <div className="showcase-grid">
        {products.map((product) => (
          <a key={product.id} className="showcase-card" href={product.productUrl} target="_blank" rel="noopener noreferrer">
            <div className="showcase-image">
              {product.imageUrl && <Image src={product.imageUrl} alt={product.title} fill sizes="(max-width: 700px) 50vw, 260px" />}
              {product.capacityLiters !== undefined && <span className="showcase-liters">{product.capacityEstimated ? "~" : ""}{product.capacityLiters} L</span>}
            </div>
            <span className="showcase-store"><Store size={13} />{product.brand}</span>
            <h4>{product.title}</h4>
            <div className="showcase-foot">
              <strong title={product.originalPrice !== undefined ? `${product.originalPrice} ${product.originalCurrency}` : undefined}>{product.originalPrice !== undefined ? "~" : ""}{price(product)}</strong>
              {product.rating && <span className="showcase-rating"><Star size={13} />{product.rating.value.toLocaleString(it ? "it-IT" : "en-GB", { maximumFractionDigits: 1 })}</span>}
              <ArrowUpRight size={16} className="showcase-out" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export async function HomeShowcase({ locale }: { locale: Locale }) {
  const it = locale === "it";
  if (!catalogConfigured()) return null; // no Shopify env vars (e.g. a first deploy): skip the rail, keep the build green
  let showcase: Showcase;
  try {
    showcase = await getShowcase(locale);
  } catch (error) {
    console.warn("[home-showcase]", error instanceof Error ? error.message : error);
    return null; // the rest of the home page doesn't depend on it
  }
  if (!showcase.backpacks.length && !showcase.trolleys.length) return null;
  const featuredStores = showcase.stores.slice(0, 6);

  return (
    <section className="home-showcase">
      <div className="showcase-intro">
        <div className="cartoon-section-heading">
          <p className="cartoon-eyebrow"><span />{it ? "Prodotti veri, negozi veri" : "Real products, real stores"}</p>
          <h2>{it ? "Non inventiamo zaini: li troviamo nei negozi." : "We don't make up bags: we find them in real stores."}</h2>
        </div>
        <p className="showcase-lede">
          {it
            ? "Ogni consiglio arriva dal catalogo dei negozi ufficiali dei brand su Shopify: foto, prezzi e disponibilità reali, spedizione verso l'Italia. Clicchi e compri direttamente dal negozio."
            : "Every suggestion comes from brands' official stores in the Shopify catalog: real photos, prices and availability, shipping to your country. Click and buy straight from the store."}
        </p>
        <p className="showcase-stores">
          <span className="showcase-store-count"><Store size={16} />{it ? `Da ${showcase.stores.length} negozi diversi` : `From ${showcase.stores.length} different stores`}</span>
          {featuredStores.map((store) => <span key={store} className="showcase-store-chip">{store}</span>)}
          {showcase.stores.length > featuredStores.length && <span className="showcase-store-chip is-more">+{showcase.stores.length - featuredStores.length}</span>}
        </p>
      </div>
      {showcase.backpacks.length > 0 && <ProductRail locale={locale} title={it ? "Zaini da viaggio 20–30 L" : "Travel backpacks 20–30 L"} products={showcase.backpacks} moreHref={`/${locale}/backpack-configurator`} moreLabel={it ? "Trova il tuo" : "Find yours"} />}
      {showcase.trolleys.length > 0 && <ProductRail locale={locale} title={it ? "Trolley da cabina 55×40×20" : "Cabin trolleys 55×40×20"} products={showcase.trolleys} moreHref={`/${locale}/luggage-configurator`} moreLabel={it ? "Trova il tuo" : "Find yours"} />}
      <p className="showcase-note">{it ? "Prezzi e disponibilità possono cambiare: verifica sempre sul sito del negozio." : "Prices and availability can change: always check on the store's site."}</p>
    </section>
  );
}
