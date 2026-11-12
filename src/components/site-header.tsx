import Link from "next/link";
import { Backpack, ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import type { Messages } from "@/lib/i18n";
import { MobileMenu } from "@/components/mobile-menu";

export function SiteHeader({
  locale,
  messages,
  compact = false,
  homeSuffix = "",
  switchPath,
}: {
  locale: Locale;
  messages: Pick<Messages, "nav">;
  /** Language switch stays on the backpack planner. */
  compact?: boolean;
  homeSuffix?: string;
  /** Path (without locale) the EN/IT switch should keep, e.g. "/luggage-configurator" */
  switchPath?: string;
}) {
  const nav = messages.nav;
  const languageLinks = {
    en: switchPath !== undefined ? `/en${switchPath}` : localeHref("en", compact, homeSuffix),
    it: switchPath !== undefined ? `/it${switchPath}` : localeHref("it", compact, homeSuffix),
  };
  return (
    <header className="site-header">
      <Link aria-label="Baggofit home" className="brand" href={`/${locale}${homeSuffix}`}><span className="brand-mark"><Backpack size={20} strokeWidth={2.2} /></span><span>Baggo<span className="brand-fit">fit</span></span></Link>
      <nav className="primary-nav" aria-label="Main navigation">
        <Link href={`/${locale}/backpack-configurator`}>{nav.backpack}</Link>
        <Link href={`/${locale}/luggage-configurator`}>{nav.luggage}</Link>
        <Link href={`/${locale}/airlines`}>{nav.airlines}</Link>
        <Link href={`/${locale}/guides`}>{nav.guides}</Link>
        <Link href={`/${locale}/about`}>{nav.about}</Link>
      </nav>
      <div className="header-actions">
        <div className="language-switch" aria-label="Language"><Link aria-current={locale === "en" ? "page" : undefined} href={languageLinks.en} lang="en">EN</Link><span aria-hidden="true">/</span><Link aria-current={locale === "it" ? "page" : undefined} href={languageLinks.it} lang="it">IT</Link></div>
        <Link className="button button-dark header-cta" href={`/${locale}/backpack-configurator`}>{nav.start}<ChevronDown size={15} className="cta-arrow" aria-hidden="true" /></Link>
        <MobileMenu locale={locale} nav={nav} languageLinks={languageLinks} />
      </div>
    </header>
  );
}

function localeHref(locale: Locale, compact: boolean, homeSuffix: string) {
  return compact ? `/${locale}/backpack-configurator` : `/${locale}${homeSuffix}`;
}
