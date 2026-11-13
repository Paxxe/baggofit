/**
 * Google Tag Manager events (dataLayer). GTM decides what to send where (GA4, Ads…);
 * the site only describes what happened. Nothing reaches Google until the visitor consents
 * (Consent Mode v2, see consent-banner.tsx): GTM tags must respect consent.
 *
 * Event names follow GA4 conventions (snake_case, ≤40 chars); product clicks use the GA4
 * ecommerce shape (`select_item` + `items`) so GA4 reports them without extra mapping.
 */
import type { BackpackProduct, ProductKind } from "./products/provider";

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || (process.env.NODE_ENV === "production" ? "GTM-WRLJNTNJ" : "");

export const CONSENT_KEY = "baggofit-consent";

/**
 * Runs in <head> before GTM: Consent Mode v2 defaults to "denied" (Italian Garante: no analytics
 * cookies before consent), then restores a previous choice, then loads the container.
 */
export function gtmHeadScript(gtmId: string) {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{var c=localStorage.getItem('${CONSENT_KEY}');if(c==='granted')gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});}catch(e){}
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
}

export type Planner = "backpack" | "luggage";

type Params = Record<string, string | number | boolean | undefined | null | object[]>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
  (window.dataLayer ??= []).push({ event, ...clean });
}

/** GA4 ecommerce event; clears the previous ecommerce object first, as Google recommends. */
export function pushEcommerce(event: string, ecommerce: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const layer = (window.dataLayer ??= []);
  layer.push({ ecommerce: null });
  layer.push({ event, ecommerce });
}

/** GA4 ecommerce item for a product card. */
export function productItem(product: BackpackProduct, index: number, listName: string, kind: ProductKind) {
  return {
    item_id: product.id,
    item_name: product.title,
    item_brand: product.brand,
    item_category: kind,
    item_list_name: listName,
    index,
    price: product.price,
    currency: product.currency,
    capacity_liters: product.capacityLiters,
  };
}

const host = (url?: string) => {
  try {
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined;
  }
};

/** Visitor leaves for a store: the key conversion (proves referral traffic to brands). */
export function trackProductClick(product: BackpackProduct, index: number, listName: string, kind: ProductKind) {
  pushEcommerce("select_item", { item_list_name: listName, currency: product.currency, items: [productItem(product, index, listName, kind)] });
  track("store_click", {
    product_kind: kind,
    store: product.brand,
    store_domain: host(product.productUrl),
    item_name: product.title,
    price: product.price,
    currency: product.currency,
    list_name: listName,
    position: index + 1,
    link_url: product.productUrl,
  });
}
