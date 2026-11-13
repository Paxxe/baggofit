"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import { CONSENT_KEY, track } from "@/lib/analytics";

const OPEN_EVENT = "baggofit:consent-open";
type Choice = "granted" | "denied";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function storedChoice(): Choice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

const subscribeNothing = () => () => {};

/** Cookie banner (accept / reject, same weight as the Garante requires) + footer re-open link. */
export function ConsentBanner() {
  const pathname = usePathname();
  const it = !pathname?.startsWith("/en");
  // Hidden on the server and until we know there's no stored choice (no flash for returning visitors).
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [open, setOpen] = useState<boolean | null>(null);
  const visible = hydrated && (open ?? storedChoice() === null);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const choose = (choice: Choice) => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Private mode: asked again next visit.
    }
    window.gtag?.("consent", "update", { ad_storage: choice, ad_user_data: choice, ad_personalization: choice, analytics_storage: choice });
    track("consent_update", { consent: choice });
    setOpen(false);
  };

  if (!visible) return null;
  return (
    <div className="consent-banner" role="dialog" aria-live="polite" aria-label={it ? "Preferenze cookie" : "Cookie preferences"}>
      <Cookie size={26} className="consent-icon" aria-hidden="true" />
      <p>
        {it
          ? "Usiamo cookie di analisi per capire come viene usato il sito e migliorarlo. Li attiviamo solo se accetti."
          : "We use analytics cookies to understand how the site is used and improve it. They're only set if you accept."}{" "}
        <Link href={it ? "/it/privacy" : "/en/privacy"}>{it ? "Privacy" : "Privacy"}</Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-button" onClick={() => choose("denied")}>{it ? "Rifiuta" : "Reject"}</button>
        <button type="button" className="consent-button is-accept" onClick={() => choose("granted")}>{it ? "Accetta" : "Accept"}</button>
      </div>
    </div>
  );
}

export function ConsentLink({ label }: { label: string }) {
  return <button type="button" className="footer-consent" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>{label}</button>;
}

/** Clicks on any element with data-track="event_name"; every data-track-* attribute becomes a parameter. Server components stay server-only. */
export function ClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!target?.dataset.track) return;
      // data-track-store-domain="x" → store_domain: "x"
      const params = Object.fromEntries(
        Object.entries(target.dataset)
          .filter(([key]) => key.startsWith("track") && key !== "track")
          .map(([key, value]) => [key.slice(5).replace(/^./, (c) => c.toLowerCase()).replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), value]),
      );
      track(target.dataset.track, { ...params, link_url: target.getAttribute("href") ?? undefined, page_path: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
