import Link from "next/link";
import { Backpack, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import type { Messages } from "@/lib/i18n";
import { ConsentLink } from "@/components/analytics";

export function SiteFooter({ locale, messages }: { locale: Locale; messages: Messages }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <Link aria-label="Baggofit home" className="brand" href={`/${locale}`}><span className="brand-mark"><Backpack size={19} /></span><span>Baggo<span className="brand-fit">fit</span></span></Link>
        <p>{messages.common.footer}</p>
        <div className="footer-links"><Link href={`/${locale}/airlines`}>{messages.common.airlines}</Link><Link href={`/${locale}/about`}>{messages.common.about}</Link><Link href={`/${locale}/privacy`}>{messages.common.privacy}</Link><ConsentLink label={locale === "it" ? "Preferenze cookie" : "Cookie preferences"} /><a href="https://www.ryanair.com/" target="_blank" rel="noreferrer">{messages.common.officialSites} <ArrowUpRight size={14} /></a></div>
      </div>
      <p className="footer-disclaimer">{messages.common.disclaimer}</p>
      <div className="footer-bottom"><span>© Baggofit</span><span>{messages.common.footerOutro}</span></div>
    </footer>
  );
}