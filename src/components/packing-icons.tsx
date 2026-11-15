import type { ReactNode } from "react";

/**
 * Hand-drawn style icons for the packing list: thick ink outline, flat fills, a soft shadow layer
 * and a highlight stroke, matching the cartoon backpack. One 64×64 drawing per packing item id.
 */

const INK = "#1c1f3a";
const C = {
  tomato: "#ff5b35",
  cobalt: "#2d5bff",
  cobaltSoft: "#dfe7ff",
  sun: "#ffc531",
  pink: "#ff9ec0",
  cream: "#fff8ee",
  white: "#ffffff",
  brown: "#b8673d",
  grey: "#c9cfe8",
  navy: "#2b3060",
};

const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const shine = { stroke: "#fff", strokeWidth: 2.5, strokeLinecap: "round" as const, fill: "none", opacity: 0.7 };

/** Draws `d` twice: an offset ink shadow, then the filled shape. */
function Shape({ d, fill }: { d: string; fill: string }) {
  return (
    <>
      <path d={d} fill={INK} transform="translate(2.5 2.5)" opacity={0.9} />
      <path d={d} fill={fill} {...line} />
    </>
  );
}

const icons: Record<string, ReactNode> = {
  "t-shirt": (
    <>
      <Shape d="M23 10 L11 16 L5 28 L14 32 L18 27 L18 55 L46 55 L46 27 L50 32 L59 28 L53 16 L41 10 Q32 18 23 10 Z" fill={C.tomato} />
      <path d="M24 30 v14" {...shine} />
    </>
  ),
  shirt: (
    <>
      <Shape d="M22 9 L10 15 L6 46 L14 47 L18 26 L18 56 L46 56 L46 26 L50 47 L58 46 L54 15 L42 9 L32 17 Z" fill={C.cobaltSoft} />
      <path d="M22 9 L27 21 L32 17 L37 21 L42 9" fill={C.white} {...line} />
      {[28, 36, 44, 52].map((y) => <circle key={y} cx={32} cy={y} r={1.8} fill={INK} />)}
    </>
  ),
  sweater: (
    <>
      <Shape d="M22 10 L10 16 L6 48 L15 49 L18 28 L18 56 L46 56 L46 28 L49 49 L58 48 L54 16 L42 10 Q32 17 22 10 Z" fill={C.sun} />
      <path d="M7 44 L15 45 M57 44 L49 45 M18 51 H46" {...line} fill="none" />
      <path d="M26 26 Q32 30 38 26 M26 34 Q32 38 38 34" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  ),
  hoodie: (
    <>
      <Shape d="M20 14 Q20 4 32 4 Q44 4 44 14 L54 18 L58 48 L49 49 L46 30 L46 57 L18 57 L18 30 L15 49 L6 48 L10 18 Z" fill={C.pink} />
      <path d="M24 15 Q32 22 40 15" fill="none" {...line} />
      <path d="M29 19 v9 M35 19 v9" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <path d="M23 42 H41 L39 51 H25 Z" fill="none" {...line} />
    </>
  ),
  trousers: (
    <>
      <Shape d="M17 7 H47 L51 57 H36 L32 25 L28 57 H13 Z" fill={C.cobalt} />
      <path d="M17 13 H47 M32 13 V22" {...line} fill="none" />
      <path d="M20 22 L18 48" {...shine} />
    </>
  ),
  shorts: (
    <>
      <Shape d="M13 14 H51 L55 46 H36 L32 30 L28 46 H9 Z" fill={C.sun} />
      <path d="M13 20 H51" {...line} fill="none" />
      <path d="M17 26 L14 40" {...shine} />
    </>
  ),
  underwear: (
    <>
      <Shape d="M9 17 H55 L51 31 Q39 34 36 47 H28 Q25 34 13 31 Z" fill={C.pink} />
      <path d="M9 23 H55" {...line} fill="none" />
      <circle cx={20} cy={28} r={1.8} fill={INK} /><circle cx={44} cy={28} r={1.8} fill={INK} />
    </>
  ),
  socks: (
    <>
      <Shape d="M23 5 H39 V35 L51 43 Q58 49 52 56 Q47 60 41 56 L25 46 Q21 43 23 37 Z" fill={C.sun} />
      <path d="M23 11 H39 M23 17 H39" stroke={C.tomato} strokeWidth={4} />
      <path d="M23 5 H39 V35 L51 43 Q58 49 52 56 Q47 60 41 56 L25 46 Q21 43 23 37 Z" fill="none" {...line} />
    </>
  ),
  jacket: (
    <>
      <Shape d="M22 8 L10 14 L6 50 L15 51 L18 28 L18 57 L46 57 L46 28 L49 51 L58 50 L54 14 L42 8 L32 14 Z" fill={C.cobalt} />
      <path d="M32 14 V57" {...line} fill="none" />
      <path d="M22 8 L26 20 L32 14 L38 20 L42 8" fill={C.sun} {...line} />
      <path d="M22 40 H28 M36 40 H42" {...line} />
    </>
  ),
  sneakers: (
    <>
      <Shape d="M5 41 Q6 26 17 27 L29 30 Q33 21 42 23 L53 35 Q60 37 59 46 H5 Z" fill={C.white} />
      <Shape d="M5 45 H59 V49 Q59 54 54 54 H10 Q5 54 5 49 Z" fill={C.tomato} />
      <path d="M31 31 L36 28 M34 35 L39 32 M37 39 L42 36" {...line} />
      <path d="M12 36 Q20 33 26 38" stroke={C.cobalt} strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  ),
  "formal-shoes": (
    <>
      <Shape d="M5 44 Q5 33 16 33 L33 34 Q41 29 49 33 Q59 37 59 45 H5 Z" fill={C.brown} />
      <Shape d="M5 45 H59 V50 H44 V48 H5 Z" fill={INK} />
      <path d="M38 36 Q44 34 50 37" {...shine} />
    </>
  ),
  sandals: (
    <>
      <Shape d="M19 7 Q32 2 44 10 Q51 32 43 55 Q32 61 22 55 Q12 32 19 7 Z" fill={C.sun} />
      <path d="M17 22 Q32 31 47 22" stroke={C.tomato} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M19 35 Q32 29 45 35" stroke={C.cobalt} strokeWidth={6} fill="none" strokeLinecap="round" />
    </>
  ),
  boots: (
    <>
      <Shape d="M17 5 H38 V35 L53 41 Q59 44 59 50 H13 V20 Z" fill={C.brown} />
      <Shape d="M13 50 H59 V56 H13 Z" fill={INK} />
      <path d="M23 13 H33 M23 20 H33 M23 27 H33" {...line} />
      <path d="M17 9 V44" {...shine} />
    </>
  ),
  laptop: (
    <>
      <Shape d="M12 10 H52 Q54 10 54 12 V42 H10 V12 Q10 10 12 10 Z" fill={C.navy} />
      <rect x={15} y={15} width={34} height={23} rx={2} fill={C.cobaltSoft} />
      <path d="M20 22 L30 19 M20 28 L38 22" {...shine} stroke={C.white} />
      <Shape d="M3 44 H61 L56 53 H8 Z" fill={C.grey} />
    </>
  ),
  tablet: (
    <>
      <Shape d="M19 5 H45 Q51 5 51 11 V53 Q51 59 45 59 H19 Q13 59 13 53 V11 Q13 5 19 5 Z" fill={C.navy} />
      <rect x={18} y={11} width={28} height={39} rx={3} fill={C.cobaltSoft} />
      <circle cx={32} cy={54.5} r={2} fill={C.white} />
      <path d="M22 18 L30 15" {...shine} stroke={C.white} />
    </>
  ),
  camera: (
    <>
      <Shape d="M22 13 H36 L39 19 H52 Q58 19 58 25 V48 Q58 54 52 54 H12 Q6 54 6 48 V25 Q6 19 12 19 H19 Z" fill={C.navy} />
      <circle cx={32} cy={36} r={12} fill={C.cobaltSoft} {...line} />
      <circle cx={32} cy={36} r={5.5} fill={C.cobalt} />
      <circle cx={49} cy={27} r={3} fill={C.sun} {...line} strokeWidth={2} />
      <path d="M26 32 Q28 29 31 29" {...shine} />
    </>
  ),
  chargers: (
    <>
      <path d="M32 40 Q32 52 22 54 Q12 56 14 61" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Shape d="M19 14 H45 V34 Q45 42 37 42 H27 Q19 42 19 34 Z" fill={C.white} />
      <path d="M26 5 V14 M38 5 V14" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M30 22 L26 30 H33 L29 37" stroke={C.tomato} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  "power-bank": (
    <>
      <Shape d="M23 4 H41 Q47 4 47 10 V54 Q47 60 41 60 H23 Q17 60 17 54 V10 Q17 4 23 4 Z" fill={C.sun} />
      {[44, 36, 28].map((y) => <rect key={y} x={23} y={y} width={18} height={5} rx={2} fill={C.tomato} stroke={INK} strokeWidth={2} />)}
      <path d="M33 11 L28 18 H35 L30 24" stroke={INK} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  toiletries: (
    <>
      <Shape d="M11 24 Q11 20 15 20 H33 Q37 20 37 24 V55 Q37 59 33 59 H15 Q11 59 11 55 Z" fill={C.pink} />
      <Shape d="M18 12 H30 V20 H18 Z" fill={C.cobalt} />
      <path d="M17 30 V48" {...shine} />
      <Shape d="M45 22 L49 22 L50 60 L44 60 Z" fill={C.cobaltSoft} />
      <Shape d="M43 6 H51 V22 H43 Z" fill={C.white} />
      <path d="M45 9 V19 M48 9 V19" stroke={C.cobalt} strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  documents: (
    <>
      <Shape d="M17 6 H47 Q51 6 51 10 V54 Q51 58 47 58 H17 Q13 58 13 54 V10 Q13 6 17 6 Z" fill={C.cobalt} />
      <circle cx={32} cy={27} r={9} fill={C.sun} {...line} />
      <path d="M23 27 H41 M32 18 Q27 27 32 36 Q37 27 32 18" stroke={INK} strokeWidth={2} fill="none" />
      <path d="M22 45 H42 M25 51 H39" stroke={C.sun} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  bottle: (
    <>
      <Shape d="M26 13 H38 Q46 18 46 27 V54 Q46 59 41 59 H23 Q18 59 18 54 V27 Q18 18 26 13 Z" fill={C.cobalt} />
      <Shape d="M25 4 H39 V13 H25 Z" fill={INK} />
      <path d="M18 34 H46 V43 H18 Z" fill={C.sun} {...line} />
      <path d="M23 24 V30 M23 47 V53" {...shine} />
    </>
  ),
  "hair-dryer": (
    <>
      <Shape d="M8 14 Q8 6 18 6 H40 Q50 6 50 18 Q50 30 40 30 H32 L30 56 Q30 60 26 60 H22 Q18 60 19 56 L22 30 H18 Q8 30 8 18 Z" fill={C.pink} />
      <Shape d="M50 11 H58 V25 H50 Z" fill={C.navy} />
      <circle cx={22} cy={18} r={6} fill={C.white} {...line} strokeWidth={2.5} />
      <path d="M24 40 H28 M23.5 46 H27.5" stroke={C.cobalt} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  souvenirs: (
    <>
      <Shape d="M8 26 H56 V58 Q56 60 54 60 H10 Q8 60 8 58 Z" fill={C.tomato} />
      <Shape d="M5 18 H59 V28 H5 Z" fill={C.sun} />
      <path d="M32 18 V60" stroke={C.sun} strokeWidth={7} />
      <path d="M32 18 Q20 4 14 12 Q12 18 32 18 Q52 18 50 12 Q44 4 32 18 Z" fill={C.sun} {...line} />
      <path d="M14 34 V50" {...shine} />
    </>
  ),
  accessories: (
    <>
      <path d="M4 26 Q8 20 14 22 M60 26 Q56 20 50 22" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Shape d="M6 24 H28 Q30 24 29 30 Q27 42 17 42 Q8 42 6 32 Z" fill={INK} />
      <Shape d="M36 24 H58 Q58 32 56 34 Q53 42 46 42 Q37 42 35 30 Q34 24 36 24 Z" fill={INK} />
      <path d="M28 27 Q32 24 36 27" stroke={INK} strokeWidth={3} fill="none" />
      <path d="M11 29 L17 28 M41 29 L47 28" stroke={C.cobaltSoft} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  /* ── Trekking gear ── */
  "rain-shell": (
    <>
      <Shape d="M22 10 Q22 3 32 3 Q42 3 42 10 L54 15 L58 50 L49 51 L46 30 L46 58 L18 58 L18 30 L15 51 L6 50 L10 15 Z" fill={C.tomato} />
      <path d="M32 12 V58" {...line} fill="none" />
      <path d="M24 12 Q32 18 40 12" fill="none" {...line} />
      <path d="M22 38 L26 36 M42 38 L38 36" {...line} />
      <path d="M22 22 V32" {...shine} />
    </>
  ),
  fleece: (
    <>
      <Shape d="M22 9 L10 15 L6 49 L15 50 L18 28 L18 57 L46 57 L46 28 L49 50 L58 49 L54 15 L42 9 Q32 15 22 9 Z" fill={C.cobaltSoft} />
      <path d="M32 12 V30" {...line} fill="none" />
      <circle cx={32} cy={13} r={2.5} fill={C.sun} {...line} strokeWidth={2} />
      {[[24, 38], [32, 44], [40, 38], [26, 50], [38, 50]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={C.cobalt} />)}
    </>
  ),
  "base-layer": (
    <>
      <Shape d="M24 9 L12 14 L8 52 L16 53 L19 28 L19 57 L45 57 L45 28 L48 53 L56 52 L52 14 L40 9 Q32 15 24 9 Z" fill={C.navy} />
      <path d="M19 36 H45 M19 44 H45" stroke={C.sun} strokeWidth={3} />
      <path d="M24 9 L12 14 L8 52 L16 53 L19 28 L19 57 L45 57 L45 28 L48 53 L56 52 L52 14 L40 9 Q32 15 24 9 Z" fill="none" {...line} />
    </>
  ),
  "hat-gloves": (
    <>
      <Shape d="M6 34 Q6 12 24 12 Q42 12 42 34 Z" fill={C.tomato} />
      <Shape d="M4 32 H44 V40 H4 Z" fill={C.sun} />
      <circle cx={24} cy={9} r={5} fill={C.white} {...line} />
      <Shape d="M42 40 Q42 30 48 30 Q50 22 54 26 L56 32 Q60 32 60 40 V54 Q60 58 56 58 H46 Q42 58 42 54 Z" fill={C.cobalt} />
      <path d="M42 46 H60" {...line} />
    </>
  ),
  "sun-kit": (
    <>
      <Shape d="M4 36 Q4 30 14 30 Q16 14 28 14 Q40 14 42 30 Q52 30 52 36 Q52 40 28 40 Q4 40 4 36 Z" fill={C.sun} />
      <path d="M14 30 H42" stroke={C.tomato} strokeWidth={4} />
      <Shape d="M46 30 H58 V58 Q58 60 56 60 H48 Q46 60 46 58 Z" fill={C.white} />
      <Shape d="M48 22 H56 V30 H48 Z" fill={C.tomato} />
      <path d="M49 38 H55 M49 44 H55" stroke={C.sun} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  headlamp: (
    <>
      <path d="M8 34 Q8 14 32 14 Q56 14 56 34" stroke={C.cobalt} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M8 34 Q8 14 32 14 Q56 14 56 34" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" transform="translate(0 4)" opacity={0.25} />
      <Shape d="M20 24 H44 Q48 24 48 28 V40 Q48 44 44 44 H20 Q16 44 16 40 V28 Q16 24 20 24 Z" fill={C.navy} />
      <circle cx={32} cy={34} r={7} fill={C.sun} {...line} />
      <path d="M22 52 L18 60 M32 52 V61 M42 52 L46 60" stroke={C.sun} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  "first-aid": (
    <>
      <Shape d="M10 18 Q10 14 14 14 H50 Q54 14 54 18 V52 Q54 56 50 56 H14 Q10 56 10 52 Z" fill={C.tomato} />
      <Shape d="M24 8 H40 V14 H24 Z" fill={C.white} />
      <path d="M32 24 V46 M21 35 H43" stroke={C.white} strokeWidth={7} strokeLinecap="round" />
      <path d="M15 22 V30" {...shine} />
    </>
  ),
  food: (
    <>
      <Shape d="M10 22 Q10 16 16 16 H48 Q54 16 54 22 V30 H10 Z" fill={C.brown} />
      <Shape d="M10 30 H54 V50 Q54 56 48 56 H16 Q10 56 10 50 Z" fill={C.sun} />
      <path d="M18 38 H30 M18 45 H40" stroke={C.brown} strokeWidth={3} strokeLinecap="round" />
      <path d="M20 21 L44 21" {...shine} />
    </>
  ),
  water: (
    <>
      <Shape d="M32 4 Q50 26 50 40 Q50 58 32 58 Q14 58 14 40 Q14 26 32 4 Z" fill={C.cobalt} />
      <path d="M24 38 Q24 48 32 50" {...shine} />
    </>
  ),
  "hut-liner": (
    <>
      <Shape d="M14 6 H50 Q54 6 54 10 V54 Q54 58 50 58 H14 Q10 58 10 54 V10 Q10 6 14 6 Z" fill={C.cream} />
      <Shape d="M10 6 H54 V20 H10 Z" fill={C.cobaltSoft} />
      <path d="M18 30 H46 M18 38 H46 M18 46 H38" stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  "sleeping-bag": (
    <>
      <Shape d="M14 12 Q14 4 32 4 Q50 4 50 12 V52 Q50 60 32 60 Q14 60 14 52 Z" fill={C.tomato} />
      {[18, 28, 38, 48].map((y) => <path key={y} d={`M14 ${y} Q32 ${y + 4} 50 ${y}`} {...line} fill="none" />)}
      <path d="M20 14 V24" {...shine} />
    </>
  ),
  "sleeping-mat": (
    <>
      <Shape d="M20 6 H44 V58 H20 Z" fill={C.sun} />
      {[14, 22, 30, 38, 46].map((y) => <path key={y} d={`M20 ${y} H44`} stroke={INK} strokeWidth={2.5} />)}
      <path d="M14 18 H50 M14 44 H50" stroke={C.cobalt} strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  tent: (
    <>
      <Shape d="M32 8 L58 54 H6 Z" fill={C.cobalt} />
      <Shape d="M32 26 L42 54 H22 Z" fill={C.sun} />
      <path d="M32 8 V4 M2 54 H62" {...line} />
      <path d="M28 18 L16 42" {...shine} />
    </>
  ),
  stove: (
    <>
      <Shape d="M12 20 H52 V44 Q52 50 46 50 H18 Q12 50 12 44 Z" fill={C.grey} />
      <path d="M52 26 H60" {...line} />
      <path d="M12 26 H52" {...line} />
      <Shape d="M24 50 H40 V60 H24 Z" fill={C.cobalt} />
      <path d="M26 14 Q24 8 28 4 M36 14 Q34 8 38 4" stroke={C.tomato} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M18 30 V40" {...shine} />
    </>
  ),
};

const tints: Record<string, string> = {
  clothing: C.tomato,
  shoes: C.sun,
  electronics: C.cobalt,
  essentials: C.pink,
};

/** Cartoon icon for a packing item; `className` lets the flying animation clone it. */
export function PackingIcon({ id, size = 40, className }: { id: string; size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="-2 -2 70 70" width={size} height={size} aria-hidden="true" focusable="false">
      {icons[id] ?? <Shape d="M14 14 H50 V50 H14 Z" fill={tints.essentials} />}
    </svg>
  );
}
