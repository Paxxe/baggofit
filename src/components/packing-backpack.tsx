"use client";

import type { VolumeStatus } from "@/lib/calculators/airline-compatibility";
import { useEffect, useRef, type CSSProperties } from "react";

export const PACKED_EVENT = "luggagefit:packed";
/** Volume at which the cartoon bag looks "full" (and starts to strain). */
const FULL_LITERS = 40;

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Cartoon backpack that inflates with the packed volume and "gulps" whenever an item lands in it.
 * Several can be on screen (desktop sidebar, mobile floating bag); the flying item targets the visible one.
 */
export function PackingBackpack({ liters, size = 180, className = "", status }: { liters: number; size?: number; className?: string; /** Airline limit check overrides the look: "over" bursts, "near" strains */ status?: VolumeStatus }) {
  const gulpRef = useRef<SVGGElement>(null);
  const lidRef = useRef<SVGGElement>(null);
  const fill = Math.min(1.3, Math.max(0, liters / FULL_LITERS));
  const state = status === "over" ? "is-bursting" : status === "near" ? "is-full" : status === "ok" ? "" : fill > 1.05 ? "is-bursting" : fill > 0.8 ? "is-full" : "";

  useEffect(() => {
    const onPacked = () => {
      if (prefersReducedMotion()) return;
      gulpRef.current?.animate(
        [
          { transform: "scale(1, 1)" },
          { transform: "scale(1.14, 0.84)", offset: 0.25 },
          { transform: "scale(0.94, 1.1)", offset: 0.55 },
          { transform: "scale(1.03, 0.97)", offset: 0.8 },
          { transform: "scale(1, 1)" },
        ],
        { duration: 520, easing: "ease-out" },
      );
      lidRef.current?.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(-16deg)", offset: 0.3 }, { transform: "rotate(4deg)", offset: 0.65 }, { transform: "rotate(0deg)" }],
        { duration: 520, easing: "ease-out" },
      );
    };
    window.addEventListener(PACKED_EVENT, onPacked);
    return () => window.removeEventListener(PACKED_EVENT, onPacked);
  }, []);

  const label = liters >= 10 ? Math.round(liters) : Math.round(liters * 10) / 10;

  return (
    <div className={`packing-bag ${state} ${className}`} data-bag-target style={{ "--fill": fill, width: size } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 200 232" width="100%">
        <ellipse className="bag-shadow" cx="100" cy="220" rx="72" ry="8" />
        <g ref={gulpRef} className="bag-gulp">
          {/* shoulder straps peeking out behind */}
          <path className="bag-strap" d="M50 62 Q16 112 30 192 L44 190 Q34 116 62 68 Z" />
          <path className="bag-strap" d="M150 62 Q184 112 170 192 L156 190 Q166 116 138 68 Z" />
          <path className="bag-handle" d="M80 44 Q80 20 100 20 Q120 20 120 44" />
          <g className="bag-body">
            <path className="bag-shell" d="M42 74 Q42 42 100 42 Q158 42 158 74 V188 Q158 212 134 212 H66 Q42 212 42 188 Z" />
            <path className="bag-shell-shade" d="M142 52 Q158 62 158 80 V188 Q158 212 134 212 H126 Q148 202 148 182 V84 Q148 64 142 52 Z" />
            <path className="bag-shine" d="M54 92 V150" />
            <path className="bag-seam" d="M52 120 V196 M148 120 V196" />
            {/* lid straps + buckles */}
            <rect className="bag-webbing" x="64" y="100" width="13" height="36" rx="3" />
            <rect className="bag-webbing" x="123" y="100" width="13" height="36" rx="3" />
            <rect className="bag-buckle" x="60" y="126" width="21" height="12" rx="3" />
            <rect className="bag-buckle" x="119" y="126" width="21" height="12" rx="3" />
            {/* front pocket, bulges more than the body */}
            <g className="bag-pocket">
              <path className="bag-pocket-shape" d="M56 148 Q56 136 70 136 H130 Q144 136 144 148 V188 Q144 202 130 202 H70 Q56 202 56 188 Z" />
              <path className="bag-zip" d="M64 148 Q100 140 136 148" />
              <rect className="bag-pull" x="110" y="146" width="7" height="14" rx="3" />
              <text className="bag-liters" x="100" y="184" textAnchor="middle">{label} L</text>
            </g>
          </g>
          <g ref={lidRef} className="bag-lid">
            <path className="bag-lid-shape" d="M44 80 Q44 48 100 48 Q156 48 156 80 V98 Q156 108 146 108 H54 Q44 108 44 98 Z" />
            <path className="bag-stitch" d="M54 98 H146" />
            <rect className="bag-patch" x="82" y="68" width="36" height="20" rx="6" />
            <path className="bag-patch-mark" d="M89 82 L96 74 L101 79 L104 76 L111 82" />
          </g>
          {/* strain marks + sweat drop when overpacked */}
          <path className="bag-stress" d="M30 112 l-12 -5 M28 126 l-14 0 M30 140 l-12 5 M170 112 l12 -5 M172 126 l14 0 M170 140 l12 5" />
          <path className="bag-sweat" d="M168 52 Q176 64 168 70 Q160 64 168 52 Z" />
        </g>
      </svg>
    </div>
  );
}

/** Pick the bag that is actually on screen (desktop sidebar or the mobile floating one). */
function visibleBag(): HTMLElement | null {
  const bags = Array.from(document.querySelectorAll<HTMLElement>("[data-bag-target]"));
  return (
    bags.find((bag) => {
      const rect = bag.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && getComputedStyle(bag).visibility !== "hidden";
    }) ?? null
  );
}

/**
 * Flies a copy of `source` (the item's icon) along an arc into the visible bag, then makes the bag gulp.
 * With reduced motion, or when no bag is visible, the bag just reacts.
 */
export function flyIntoBag(source: Element | null | undefined) {
  const bag = visibleBag();
  const done = () => window.dispatchEvent(new Event(PACKED_EVENT));
  if (!source || !bag || prefersReducedMotion()) return done();

  const from = source.getBoundingClientRect();
  const to = bag.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.classList.add("flying-item");
  Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height * 0.38 - (from.top + from.height / 2);
  const lift = Math.min(160, 60 + Math.abs(dx) * 0.25);
  const spin = dx > 0 ? 1 : -1;
  const animation = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.15}px, ${dy * 0.15 - 30}px) scale(1.25) rotate(${-8 * spin}deg)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - lift}px) scale(1.1) rotate(${18 * spin}deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.3) rotate(${40 * spin}deg)`, opacity: 0.4 },
    ],
    { duration: 720, easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
  );
  animation.onfinish = () => {
    ghost.remove();
    done();
  };
  animation.oncancel = () => ghost.remove();
}
