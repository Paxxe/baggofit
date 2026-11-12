"use client";

import type { VolumeStatus } from "@/lib/calculators/airline-compatibility";
import { useEffect, useRef, type CSSProperties } from "react";
import { PACKED_EVENT } from "@/components/packing-backpack";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Cartoon suitcase that bulges as it fills (relative to the reference capacity for a cabin trolley
 * or a checked suitcase) and bounces when an item lands in it. Shares the "packed" event with the backpack.
 */
export function PackingSuitcase({ liters, referenceLiters, size = 190, className = "", status }: { liters: number; referenceLiters: number; size?: number; className?: string; status?: VolumeStatus }) {
  const bounceRef = useRef<SVGGElement>(null);
  const fill = Math.min(1.3, Math.max(0, liters / referenceLiters));
  const state = status === "over" ? "is-bursting" : status === "near" ? "is-full" : status === "ok" ? "" : fill > 1.05 ? "is-bursting" : fill > 0.85 ? "is-full" : "";

  useEffect(() => {
    const onPacked = () => {
      if (prefersReducedMotion()) return;
      bounceRef.current?.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(1.1, 0.88)", offset: 0.25 },
          { transform: "scale(0.95, 1.07)", offset: 0.55 },
          { transform: "scale(1.02, 0.98)", offset: 0.8 },
          { transform: "scale(1, 1)" },
        ],
        { duration: 520, easing: "ease-out" },
      );
    };
    window.addEventListener(PACKED_EVENT, onPacked);
    return () => window.removeEventListener(PACKED_EVENT, onPacked);
  }, []);

  const label = liters >= 10 ? Math.round(liters) : Math.round(liters * 10) / 10;

  return (
    <div className={`packing-bag packing-suitcase ${state} ${className}`} data-bag-target style={{ "--fill": fill, width: size } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 220 262" width="100%">
        <ellipse className="bag-shadow" cx="110" cy="252" rx="78" ry="8" />
        <g ref={bounceRef} className="bag-gulp suitcase-bounce">
          {/* telescopic handle */}
          <g className="suitcase-handle">
            <rect className="suitcase-rod" x="88" y="14" width="8" height="48" rx="3" />
            <rect className="suitcase-rod" x="124" y="14" width="8" height="48" rx="3" />
            <rect className="suitcase-grip" x="80" y="6" width="60" height="16" rx="8" />
          </g>
          {/* wheels */}
          <circle className="suitcase-wheel" cx="62" cy="238" r="10" />
          <circle className="suitcase-wheel" cx="158" cy="238" r="10" />
          <g className="bag-body suitcase-body">
            <rect className="suitcase-shell" x="36" y="56" width="148" height="178" rx="24" />
            <path className="suitcase-shade" d="M164 60 Q184 66 184 86 V210 Q184 234 160 234 H150 Q170 226 170 204 V90 Q170 70 164 60 Z" />
            <path className="suitcase-rib" d="M74 74 V216 M110 74 V216 M146 74 V216" />
            <path className="bag-shine" d="M50 84 V150" />
            <path className="suitcase-zip" d="M36 145 H184" />
            <rect className="suitcase-corner" x="36" y="56" width="26" height="26" rx="10" />
            <rect className="suitcase-corner" x="158" y="56" width="26" height="26" rx="10" />
            <rect className="suitcase-corner" x="36" y="208" width="26" height="26" rx="10" />
            <rect className="suitcase-corner" x="158" y="208" width="26" height="26" rx="10" />
            <g className="bag-pocket">
              <circle className="suitcase-sticker" cx="110" cy="112" r="30" />
              <text className="bag-liters" x="110" y="120" textAnchor="middle">{label} L</text>
            </g>
          </g>
          {/* luggage tag swinging from the handle */}
          <g className="suitcase-tag">
            <path className="suitcase-tag-string" d="M88 30 Q46 30 26 64" />
            <rect className="suitcase-tag-card" x="10" y="62" width="30" height="40" rx="6" />
            <circle className="suitcase-tag-hole" cx="25" cy="70" r="3.5" />
          </g>
          <path className="bag-stress" d="M24 120 l-12 -5 M22 140 l-14 0 M24 160 l-12 5 M196 120 l12 -5 M198 140 l14 0 M196 160 l12 5" />
          <path className="bag-sweat" d="M194 62 Q202 74 194 80 Q186 74 194 62 Z" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Hanging luggage scale: the needle sweeps with the estimated weight and turns red past the allowance.
 */
export function LuggageScale({ weightKg, allowanceKg, label, locale }: { weightKg: number; allowanceKg: number | null; label: string; locale: "en" | "it" }) {
  const max = Math.max(10, (allowanceKg ?? 20) * 1.3);
  const ratio = Math.min(1, weightKg / max);
  const angle = -90 + ratio * 180;
  const over = allowanceKg !== null && weightKg > allowanceKg;
  const near = allowanceKg !== null && !over && weightKg > allowanceKg * 0.9;
  // Red zone starts at the allowance.
  const limitAngle = allowanceKg !== null ? -90 + Math.min(1, allowanceKg / max) * 180 : null;
  const arc = (from: number, to: number) => {
    const point = (deg: number) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      return `${70 + 54 * Math.cos(rad)} ${70 + 54 * Math.sin(rad)}`;
    };
    return `M ${point(from)} A 54 54 0 ${to - from > 180 ? 1 : 0} 1 ${point(to)}`;
  };
  return (
    <div className={`luggage-scale ${over ? "is-over" : near ? "is-near" : ""}`}>
      <svg viewBox="0 0 140 92" width="100%" aria-hidden="true">
        <path className="scale-arc" d={arc(-90, 90)} />
        {limitAngle !== null && <path className="scale-arc-danger" d={arc(limitAngle, 90)} />}
        {[-90, -45, 0, 45, 90].map((tick) => <line key={tick} className="scale-tick" x1="70" y1="22" x2="70" y2="30" transform={`rotate(${tick} 70 70)`} />)}
        <g className="scale-needle" style={{ transform: `rotate(${angle}deg)` }}>
          <line x1="70" y1="70" x2="70" y2="24" />
        </g>
        <circle className="scale-hub" cx="70" cy="70" r="7" />
      </svg>
      <p className="scale-reading">
        <strong>{weightKg.toLocaleString(locale === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 })} kg</strong>
        {allowanceKg !== null && <span> / {allowanceKg} kg</span>}
      </p>
      <p className="scale-label">{label}</p>
    </div>
  );
}
