"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Backpack, BookOpen, Briefcase, Info, Menu, Plane, X } from "lucide-react";
import type { Locale } from "@/lib/data/packing-items";
import type { Messages } from "@/lib/i18n";

/** Hamburger menu for small screens: full-height cartoon panel, closes on Escape, link click or backdrop. */
export function MobileMenu({ locale, nav, languageLinks }: { locale: Locale; nav: Messages["nav"]; languageLinks: { en: string; it: string } }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);
  const planners = [
    { href: `/${locale}/backpack-configurator`, label: nav.backpack, icon: Backpack, tone: "tomato" },
    { href: `/${locale}/luggage-configurator`, label: nav.luggage, icon: Briefcase, tone: "cobalt" },
  ];
  const explore = [
    { href: `/${locale}/airlines`, label: nav.airlines, icon: Plane },
    { href: `/${locale}/guides`, label: nav.guides, icon: BookOpen },
    { href: `/${locale}/about`, label: nav.about, icon: Info },
  ];

  return (
    <>
      <button type="button" className="menu-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(true)}>
        <Menu size={20} strokeWidth={2.6} /><span className="sr-only">{nav.menu}</span>
      </button>
      <div className={`mobile-menu ${open ? "is-open" : ""}`} hidden={!open}>
        <button type="button" className="mobile-menu-backdrop" aria-label={nav.close} tabIndex={-1} onClick={close} />
        <nav id={panelId} className="mobile-menu-panel" aria-label={nav.menu}>
          <div className="mobile-menu-top">
            <span className="mobile-menu-title">{nav.menu}</span>
            <button ref={closeRef} type="button" className="menu-close" onClick={close}><X size={20} strokeWidth={2.6} /><span className="sr-only">{nav.close}</span></button>
          </div>
          <p className="mobile-menu-label">{nav.planners}</p>
          <div className="mobile-menu-planners">
            {planners.map(({ href, label, icon: Icon, tone }) => (
              <Link key={href} href={href} className={`mobile-planner mobile-planner-${tone}`} onClick={close}>
                <span className="mobile-planner-icon"><Icon size={22} strokeWidth={2.2} /></span>{label}
              </Link>
            ))}
          </div>
          <p className="mobile-menu-label">{nav.explore}</p>
          <ul className="mobile-menu-links">
            {explore.map(({ href, label, icon: Icon }) => (
              <li key={href}><Link href={href} onClick={close}><Icon size={18} />{label}</Link></li>
            ))}
          </ul>
          <div className="mobile-menu-language">
            <Link href={languageLinks.it} aria-current={locale === "it" ? "page" : undefined} lang="it" onClick={close}>Italiano</Link>
            <Link href={languageLinks.en} aria-current={locale === "en" ? "page" : undefined} lang="en" onClick={close}>English</Link>
          </div>
        </nav>
      </div>
    </>
  );
}
