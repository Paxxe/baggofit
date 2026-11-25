import { airlinesFor, cabinZeroModels } from "@/lib/data/cabinzero";
import { christmasFreeBagLayers, christmasWornItems, type ChristmasLayer, type GuideIllustrationId } from "@/lib/data/guides";
import { packingItems } from "@/lib/data/packing-items";

type Lang = "en" | "it";

/* Cartoon palette shared with the 3D backpack and the packing illustrations. */
const INK = "#1c1f3a";
const COLORS = {
  coral: { body: "#ff6a3d", shade: "#e24f2b", pocket: "#ff9168" },
  cobalt: { body: "#2d5bff", shade: "#1f3a8a", pocket: "#6f8cff" },
  sun: { body: "#ffc531", shade: "#e0a400", pocket: "#ffd96b" },
} as const;
type Color = keyof typeof COLORS;

/** Front view of the site's cartoon backpack, fitted in a box (x, y = top-left). */
function Backpack({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: Color }) {
  const c = COLORS[color];
  const cx = x + w / 2;
  const top = y + 14;
  return (
    <g strokeLinejoin="round">
      <path d={`M${x + 8} ${top + h * 0.2} Q${x - 14} ${top + h * 0.5} ${x - 4} ${y + h * 0.92} L${x + 8} ${y + h * 0.9} Z`} fill="#232a52" stroke={INK} strokeWidth={4} />
      <path d={`M${x + w - 8} ${top + h * 0.2} Q${x + w + 14} ${top + h * 0.5} ${x + w + 4} ${y + h * 0.92} L${x + w - 8} ${y + h * 0.9} Z`} fill="#232a52" stroke={INK} strokeWidth={4} />
      <path d={`M${cx - 18} ${top + 6} Q${cx - 18} ${y - 6} ${cx} ${y - 6} Q${cx + 18} ${y - 6} ${cx + 18} ${top + 6}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <rect x={x} y={top} width={w} height={h - 14} rx={Math.min(34, w * 0.24)} fill={c.body} stroke={INK} strokeWidth={4.5} />
      <rect x={x + w - 20} y={top + 26} width={10} height={h - 70} rx={5} fill={c.shade} opacity={0.85} />
      <path d={`M${x + 18} ${top + 36} Q${cx} ${top + 14} ${x + w - 18} ${top + 36}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      <rect x={cx + w * 0.18} y={top + 22} width={8} height={14} rx={3} fill={INK} />
      <path d={`M${x + 16} ${top + 62} V${top + 62 + h * 0.22}`} stroke="#fff" strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" />
      <rect x={x + w * 0.16} y={y + h * 0.56} width={w * 0.68} height={h * 0.36} rx={16} fill={c.pocket} stroke={INK} strokeWidth={4} />
      <path d={`M${x + w * 0.24} ${y + h * 0.64} H${x + w * 0.76}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

/** A dimension line with end ticks and a label. */
function Dim({ x1, y1, x2, y2, label, lx, ly, rotate = 0 }: { x1: number; y1: number; x2: number; y2: number; label: string; lx: number; ly: number; rotate?: number }) {
  const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const tick = (px: number, py: number) => `M${px - Math.cos(angle) * 7} ${py - Math.sin(angle) * 7} L${px + Math.cos(angle) * 7} ${py + Math.sin(angle) * 7}`;
  return (
    <g>
      <path d={`M${x1} ${y1} L${x2} ${y2} ${tick(x1, y1)} ${tick(x2, y2)}`} stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
      <text x={lx} y={ly} transform={rotate ? `rotate(${rotate} ${lx} ${ly})` : undefined} textAnchor="middle" className="figure-label">{label}</text>
    </g>
  );
}

function Sizer({ language }: { language: Lang }) {
  // Front face 30 × 40 cm (6 px/cm), depth 20 cm drawn as an oblique offset.
  const [fx, fy, fw, fh] = [210, 110, 180, 240];
  const [dx, dy] = [70, -45];
  const bar = (d: string) => <><path d={d} stroke={INK} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d={d} stroke="#ffc531" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></>;
  const front = { tl: [fx, fy], tr: [fx + fw, fy], br: [fx + fw, fy + fh], bl: [fx, fy + fh] } as const;
  const back = (point: readonly [number, number]) => [point[0] + dx, point[1] + dy] as const;
  const p = (point: readonly [number, number]) => `${point[0]} ${point[1]}`;
  return (
    <svg viewBox="0 0 640 410" role="img" aria-labelledby="sizer-title">
      <title id="sizer-title">{language === "it" ? "Zaino dentro il misuratore da 40 × 30 × 20 cm" : "Backpack inside the 40 × 30 × 20 cm sizer"}</title>
      <polygon points={`${p(back(front.tl))} ${p(back(front.tr))} ${p(back(front.br))} ${p(back(front.bl))}`} fill="#fff1c7" stroke={INK} strokeWidth={3} />
      <polygon points={`${p(front.bl)} ${p(front.br)} ${p(back(front.br))} ${p(back(front.bl))}`} fill="#ffe08a" stroke={INK} strokeWidth={3} />
      <polygon points={`${p(front.tl)} ${p(back(front.tl))} ${p(back(front.bl))} ${p(front.bl)}`} fill="#fff6dc" stroke={INK} strokeWidth={3} />
      {bar(`M${p(back(front.tl))} L${p(back(front.tr))} L${p(back(front.br))}`)}
      <Backpack x={246} y={112} w={150} h={214} color="coral" />
      {bar(`M${p(front.tl)} L${p(back(front.tl))} M${p(front.tr)} L${p(back(front.tr))} M${p(front.br)} L${p(back(front.br))}`)}
      {bar(`M${p(front.tl)} L${p(front.tr)} L${p(front.br)} L${p(front.bl)} Z`)}
      <Dim x1={178} y1={fy} x2={178} y2={fy + fh} label="40 cm" lx={160} ly={fy + fh / 2} rotate={-90} />
      <Dim x1={fx} y1={378} x2={fx + fw} y2={378} label="30 cm" lx={fx + fw / 2} ly={402} />
      <Dim x1={fx + fw + 16} y1={fy + fh + 10} x2={fx + fw + dx + 16} y2={fy + fh + dy + 10} label="20 cm" lx={fx + fw + 78} ly={fy + fh + 2} />
      <g transform="rotate(-6 540 110)">
        <rect x={470} y={88} width={150} height={46} rx={23} fill="#ff5b35" stroke={INK} strokeWidth={3.5} />
        <text x={545} y={118} textAnchor="middle" className="figure-badge">{language === "it" ? "Borsa gratuita" : "Free bag"}</text>
      </g>
    </svg>
  );
}

/** Side view: the same bag empty (18 cm) and overstuffed (27 cm) against the 20 cm limit (5 px/cm). */
function PackedDepth({ language }: { language: Lang }) {
  const it = language === "it";
  const limit = (x: number) => <rect x={x} y={90} width={100} height={200} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="9 8" rx={6} />;
  const strap = (x: number) => <path d={`M${x} 112 Q${x - 26} 200 ${x} 272`} fill="none" stroke="#232a52" strokeWidth={10} strokeLinecap="round" />;
  return (
    <svg viewBox="0 0 640 380" role="img" aria-labelledby="depth-title">
      <title id="depth-title">{it ? "Lo stesso zaino vuoto e pieno visto di lato: pieno supera i 20 cm" : "The same bag empty and packed, side view: packed it goes past 20 cm"}</title>
      <text x={165} y={44} textAnchor="middle" className="figure-heading">{it ? "Vuoto" : "Empty"}</text>
      {strap(120)}
      <path d="M120 90 L120 290 Q120 300 130 300 L198 300 Q210 300 210 288 L210 112 Q210 90 188 90 Z" fill={COLORS.cobalt.body} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M190 120 V270" stroke={COLORS.cobalt.shade} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      {limit(120)}
      <Dim x1={120} y1={322} x2={210} y2={322} label="18 cm" lx={165} ly={350} />
      <circle cx={250} cy={110} r={22} fill="#3ccf7a" stroke={INK} strokeWidth={3.5} />
      <path d="M240 110 L248 118 L261 102" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />

      <text x={450} y={44} textAnchor="middle" className="figure-heading">{it ? "Pieno" : "Packed"}</text>
      {strap(380)}
      <path d="M380 90 L380 290 Q380 300 390 300 L468 300 Q506 300 514 250 Q522 195 510 130 Q500 90 468 90 Z" fill={COLORS.coral.body} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M500 140 Q508 195 500 250" fill="none" stroke={COLORS.coral.shade} strokeWidth={8} strokeLinecap="round" opacity={0.8} />
      <path d="M528 150 l14 -6 M532 196 h16 M528 242 l14 6" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      {limit(380)}
      <Dim x1={380} y1={322} x2={515} y2={322} label="27 cm" lx={448} ly={350} />
      <circle cx={584} cy={110} r={22} fill="#ff5b35" stroke={INK} strokeWidth={3.5} />
      <path d="M576 102 L592 118 M592 102 L576 118" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <text x={170} y={80} textAnchor="middle" className="figure-note">{it ? "limite 20 cm" : "20 cm limit"}</text>
      <text x={430} y={80} textAnchor="middle" className="figure-note">{it ? "limite 20 cm" : "20 cm limit"}</text>
    </svg>
  );
}

const modelColors: Color[] = ["sun", "cobalt", "coral"];

function CabinZeroSizes({ language }: { language: Lang }) {
  const it = language === "it";
  const scale = 5;
  const ground = 320;
  const xs = [70, 290, 500];
  const format = (value: number) => value.toLocaleString(it ? "it-IT" : "en-GB");
  return (
    <svg viewBox="0 0 720 380" role="img" aria-labelledby="cz-title">
      <title id="cz-title">{it ? "CabinZero Classic 28, 36 e 44 litri in scala" : "CabinZero Classic 28, 36 and 44 liters to scale"}</title>
      <path d={`M30 ${ground + 2} H690`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {cabinZeroModels.map((model, index) => {
        const [height, width] = model.size;
        const h = height * scale;
        const w = width * scale;
        const x = xs[index];
        return (
          <g key={model.liters}>
            <ellipse cx={x + w / 2} cy={ground + 2} rx={w / 2 + 8} ry={7} fill="rgba(28,31,58,0.18)" />
            <Backpack x={x} y={ground - h} w={w} h={h} color={modelColors[index]} />
            <text x={x + w / 2} y={ground - h - 26} textAnchor="middle" className="figure-heading">{model.liters} L</text>
            <text x={x + w / 2} y={ground + 36} textAnchor="middle" className="figure-label">{format(model.size[0])} × {format(model.size[1])} × {model.size[2]} cm</text>
            <text x={x + w / 2} y={ground + 58} textAnchor="middle" className="figure-note">{format(model.weightG / 1000)} kg</text>
          </g>
        );
      })}
    </svg>
  );
}

const number = (value: number, language: Lang) => (Math.round(value * 10) / 10).toLocaleString(language === "it" ? "it-IT" : "en-GB");

function Snowflake({ x, y, r }: { x: number; y: number; r: number }) {
  const arms = [0, 60, 120].map((angle) => {
    const rad = (angle * Math.PI) / 180;
    return `M${x - Math.cos(rad) * r} ${y - Math.sin(rad) * r} L${x + Math.cos(rad) * r} ${y + Math.sin(rad) * r}`;
  });
  return <path d={arms.join(" ")} stroke="#6f8cff" strokeWidth={3} strokeLinecap="round" />;
}

function GiftBox({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size;
  return (
    <g strokeLinejoin="round">
      <rect x={x} y={y} width={s} height={s * 0.8} rx={5} fill="#ff5b35" stroke={INK} strokeWidth={3.5} />
      <rect x={x - 4} y={y - s * 0.18} width={s + 8} height={s * 0.22} rx={4} fill="#ff9168" stroke={INK} strokeWidth={3.5} />
      <path d={`M${x + s / 2} ${y - s * 0.18} V${y + s * 0.8}`} stroke="#ffc531" strokeWidth={7} />
      <path d={`M${x + s / 2} ${y - s * 0.18} Q${x + s * 0.18} ${y - s * 0.55} ${x + s * 0.12} ${y - s * 0.26} Z M${x + s / 2} ${y - s * 0.18} Q${x + s * 0.82} ${y - s * 0.55} ${x + s * 0.88} ${y - s * 0.26} Z`} fill="#ffc531" stroke={INK} strokeWidth={3} />
    </g>
  );
}

const layerStyle: Record<ChristmasLayer["key"], { fill: string; label: Record<Lang, string> }> = {
  clothes: { fill: COLORS.cobalt.pocket, label: { it: "Vestiti", en: "Clothes" } },
  electronics: { fill: COLORS.coral.pocket, label: { it: "Elettronica e documenti", en: "Electronics and documents" } },
  toiletries: { fill: COLORS.sun.pocket, label: { it: "Beauty", en: "Toiletries" } },
  margin: { fill: "#e7e9f3", label: { it: "Margine e spazi vuoti", en: "Margin and gaps" } },
  gifts: { fill: "#fff", label: { it: "Spazio per i regali", en: "Room for gifts" } },
};

/** The free bag (front view) filled layer by layer with the 4-day Christmas list, to scale in liters. */
function ChristmasFill({ language }: { language: Lang }) {
  const { capacity, layers } = christmasFreeBagLayers();
  const [x, y, w, h] = [150, 58, 210, 300];
  const top = y + 14;
  const inner = { top: top + 40, bottom: y + h - 8 };
  const perLiter = (inner.bottom - inner.top) / capacity;
  // Bands stacked from the bottom; labels at each band's middle, pushed up when two would overlap.
  const bands = layers.map((layer, index) => {
    const below = layers.slice(0, index).reduce((sum, item) => sum + item.liters, 0);
    const height = layer.liters * perLiter;
    return { ...layer, y: inner.bottom - below * perLiter - height, height };
  });
  const labels = bands.reduce<(typeof bands[number] & { ly: number })[]>((placed, band) => {
    const previous = placed.at(-1)?.ly ?? Infinity;
    return [...placed, { ...band, ly: Math.min(band.y + band.height / 2 + 6, previous - 44) }];
  }, []);
  const gifts = bands.find((band) => band.key === "gifts");
  return (
    <svg viewBox="0 0 720 400" role="img" aria-labelledby="xmas-fill-title">
      <title id="xmas-fill-title">{language === "it" ? `Come si riempie la borsa gratuita da circa ${capacity} litri con la lista di Natale` : `How the roughly ${capacity}-liter free bag fills up with the Christmas list`}</title>
      <defs>
        <clipPath id="xmas-fill-body"><rect x={x} y={top} width={w} height={h - 14} rx={34} /></clipPath>
        <pattern id="xmas-fill-hatch" width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 V10" stroke="#c9cde0" strokeWidth={4} /></pattern>
      </defs>
      <Snowflake x={70} y={80} r={14} />
      <Snowflake x={100} y={300} r={9} />
      <Snowflake x={640} y={60} r={11} />
      <Backpack x={x} y={y} w={w} h={h} color="coral" />
      <g clipPath="url(#xmas-fill-body)">
        <rect x={x} y={top} width={w} height={h} fill="#fff" />
        {bands.map((band) => <g key={band.key}>
          <rect x={x} y={band.y} width={w} height={band.height} fill={layerStyle[band.key].fill} />
          {band.key === "margin" && <rect x={x} y={band.y} width={w} height={band.height} fill="url(#xmas-fill-hatch)" />}
          <path d={`M${x} ${band.y} H${x + w}`} stroke={INK} strokeWidth={2.5} strokeDasharray={band.key === "gifts" ? "8 7" : undefined} />
        </g>)}
      </g>
      <rect x={x} y={top} width={w} height={h - 14} rx={34} fill="none" stroke={INK} strokeWidth={4.5} />
      <path d={`M${x + 18} ${top + 36} Q${x + w / 2} ${top + 14} ${x + w - 18} ${top + 36}`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      {gifts && gifts.height > 50 && <>
        <GiftBox x={x + 44} y={gifts.y + gifts.height - 46} size={44} />
        <GiftBox x={x + 112} y={gifts.y + gifts.height - 34} size={32} />
      </>}
      {labels.map((band) => <g key={band.key}>
        <path d={`M${x + w + 10} ${band.y + band.height / 2} L${x + w + 40} ${band.ly - 6} H${x + w + 52}`} fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <text x={x + w + 60} y={band.ly} className="figure-label">{layerStyle[band.key].label[language]}</text>
        <text x={x + w + 60} y={band.ly + 20} className="figure-note">{language === "it" ? "circa " : "about "}{number(band.liters, language)} L</text>
      </g>)}
    </svg>
  );
}

/** A coat on a hanger with the boots below: the bulky winter items worn on the plane, with their liters. */
function WinterWear({ language }: { language: Lang }) {
  const it = language === "it";
  const volume = (id: string) => packingItems.find((item) => item.id === id)!;
  const total = christmasWornItems.reduce((sum, id) => sum + volume(id).volumeLiters, 0);
  const names: Record<string, Record<Lang, string>> = { sweater: { it: "Maglione", en: "Sweater" }, jacket: { it: "Cappotto", en: "Coat" }, boots: { it: "Stivali", en: "Boots" } };
  const callout = (id: string, from: [number, number], ly: number) => {
    const item = volume(id);
    return <g key={id}>
      <path d={`M${from[0]} ${from[1]} L${380} ${ly - 6} H${396}`} fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={from[0]} cy={from[1]} r={5} fill={INK} />
      <text x={404} y={ly} className="figure-label">{names[id][language]}</text>
      <text x={404} y={ly + 20} className="figure-note">{number(item.volumeLiters, language)} L</text>
    </g>;
  };
  return (
    <svg viewBox="0 0 640 400" role="img" aria-labelledby="winter-wear-title">
      <title id="winter-wear-title">{it ? "Cappotto, maglione e stivali da indossare in volo invece di metterli nello zaino" : "Coat, sweater and boots to wear on the plane instead of packing them"}</title>
      <Snowflake x={60} y={70} r={12} />
      <Snowflake x={590} y={350} r={10} />
      {/* hanger */}
      <path d="M210 62 Q210 40 226 40 Q240 42 234 56" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M150 98 L210 66 L270 98" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      {/* sleeves */}
      <path d="M150 104 L100 290 L132 300 L168 170 Z" fill={COLORS.cobalt.shade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M270 104 L320 290 L288 300 L252 170 Z" fill={COLORS.cobalt.shade} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* body */}
      <path d="M146 98 L274 98 L292 318 Q210 332 128 318 Z" fill={COLORS.cobalt.body} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      {/* sweater in the neckline */}
      <path d="M184 98 L236 98 L210 142 Z" fill={COLORS.sun.body} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M190 104 L210 136 M200 100 L214 124 M230 104 L218 124" stroke={COLORS.sun.shade} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M184 98 L210 142 L236 98" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M210 142 V324" stroke={INK} strokeWidth={3} />
      {[178, 218, 258].map((cy) => <circle key={cy} cx={222} cy={cy} r={5.5} fill={COLORS.sun.body} stroke={INK} strokeWidth={2.5} />)}
      <rect x={150} y={238} width={40} height={30} rx={8} fill={COLORS.cobalt.pocket} stroke={INK} strokeWidth={3.5} />
      <rect x={236} y={238} width={40} height={30} rx={8} fill={COLORS.cobalt.pocket} stroke={INK} strokeWidth={3.5} />
      <path d="M158 132 V196" stroke="#fff" strokeOpacity={0.55} strokeWidth={5} strokeLinecap="round" />
      {/* scarf */}
      <path d="M160 96 Q210 118 260 96 L262 112 Q210 134 158 112 Z" fill={COLORS.coral.body} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M236 116 L258 112 L262 200 L242 202 Z" fill={COLORS.coral.body} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M244 202 V214 M252 201 V213 M260 200 V212" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {/* boots */}
      <path d="M150 334 V376 H214 Q216 360 198 356 L184 352 V334 Z" fill="#9b6a43" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M230 334 V376 H294 Q296 360 278 356 L264 352 V334 Z" fill="#9b6a43" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M150 342 H184 M230 342 H264" stroke="#fff" strokeOpacity={0.7} strokeWidth={5} />
      {callout("sweater", [222, 112], 92)}
      {callout("jacket", [282, 210], 176)}
      {callout("boots", [290, 360], 322)}
      <g transform="rotate(-5 510 250)">
        <rect x={392} y={226} width={238} height={48} rx={24} fill="#ff5b35" stroke={INK} strokeWidth={3.5} />
        <text x={511} y={257} textAnchor="middle" className="figure-badge">{number(total, language)} L {it ? "fuori dallo zaino" : "out of the bag"}</text>
      </g>
    </svg>
  );
}

/** A cartoon bottle standing on `bottom`. */
function Bottle({ x, bottom, w, h, fill, label }: { x: number; bottom: number; w: number; h: number; fill: string; label?: string }) {
  const top = bottom - h;
  return (
    <g strokeLinejoin="round">
      <rect x={x + w * 0.22} y={top - 30} width={w * 0.56} height={18} rx={4} fill={INK} />
      <rect x={x + w * 0.3} y={top - 14} width={w * 0.4} height={18} fill="#fff" stroke={INK} strokeWidth={3.5} />
      <rect x={x} y={top} width={w} height={h} rx={Math.min(14, w * 0.3)} fill={fill} stroke={INK} strokeWidth={4} />
      <path d={`M${x + 9} ${top + 14} V${top + h * 0.55}`} stroke="#fff" strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
      {label && <>
        <rect x={x + 6} y={top + h * 0.42} width={w - 12} height={46} rx={6} fill="#fff" stroke={INK} strokeWidth={3} />
        <text x={x + w / 2} y={top + h * 0.42 + 34} textAnchor="middle" className="figure-heading">{label}</text>
      </>}
    </g>
  );
}

function Pill({ cx, y, text, fill, width }: { cx: number; y: number; text: string; fill: string; width: number }) {
  return (
    <g>
      <rect x={cx - width / 2} y={y} width={width} height={42} rx={21} fill={fill} stroke={INK} strokeWidth={3.5} />
      <text x={cx} y={y + 28} textAnchor="middle" className="figure-badge">{text}</text>
    </g>
  );
}

/** Standard scanners: 100 ml bottles in the 1 L bag. New C3 scanners: containers up to 2 L. */
function LiquidsRules({ language }: { language: Lang }) {
  const it = language === "it";
  const small = [COLORS.coral.pocket, COLORS.sun.body, "#3ccf7a", COLORS.cobalt.pocket];
  return (
    <svg viewBox="0 0 720 400" role="img" aria-labelledby="liquids-title">
      <title id="liquids-title">{it ? "Con gli scanner tradizionali flaconi da 100 ml in una busta da 1 litro; con i nuovi scanner contenitori fino a 2 litri" : "With standard scanners, 100 ml bottles in a 1-liter bag; with new scanners, containers up to 2 liters"}</title>
      <Pill cx={175} y={22} width={270} fill={COLORS.cobalt.body} text={it ? "Scanner tradizionale" : "Standard scanner"} />
      <Pill cx={545} y={22} width={270} fill="#ff5b35" text={it ? "Nuovi scanner C3" : "New C3 scanners"} />
      <path d="M360 90 V350" stroke={INK} strokeWidth={3} strokeDasharray="8 9" strokeLinecap="round" />

      {/* 1 L clear bag with four 100 ml bottles */}
      <rect x={55} y={112} width={240} height={206} rx={18} fill="#e3f2ff" stroke={INK} strokeWidth={4} />
      {small.map((fill, index) => <Bottle key={fill} x={78 + index * 54} bottom={302} w={40} h={84 + (index % 2) * 22} fill={fill} />)}
      <rect x={55} y={112} width={240} height={34} rx={14} fill="#ff9168" stroke={INK} strokeWidth={4} />
      <path d="M70 129 H280" stroke={INK} strokeWidth={3} strokeDasharray="6 6" />
      <rect x={262} y={120} width={14} height={20} rx={4} fill={INK} />
      <path d="M78 170 L112 156" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
      <circle cx={292} cy={300} r={30} fill={COLORS.sun.body} stroke={INK} strokeWidth={3.5} />
      <text x={292} y={308} textAnchor="middle" className="figure-label">1 L</text>
      <text x={175} y={356} textAnchor="middle" className="figure-label">{it ? "max 100 ml a flacone" : "max 100 ml per bottle"}</text>
      <text x={175} y={380} textAnchor="middle" className="figure-note">{it ? "tutti in una busta da 1 litro" : "all in one 1-liter bag"}</text>

      {/* new scanners: a 2 L bottle */}
      <ellipse cx={530} cy={322} rx={110} ry={8} fill="rgba(28,31,58,0.15)" />
      <Bottle x={455} bottom={318} w={110} h={196} fill={COLORS.cobalt.body} label="2 L" />
      <Bottle x={590} bottom={318} w={40} h={90} fill={COLORS.coral.pocket} />
      <circle cx={655} cy={128} r={22} fill="#3ccf7a" stroke={INK} strokeWidth={3.5} />
      <path d="M645 128 L653 136 L666 120" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      <text x={545} y={356} textAnchor="middle" className="figure-label">{it ? "fino a 2 L a contenitore" : "up to 2 L per container"}</text>
      <text x={545} y={380} textAnchor="middle" className="figure-note">{it ? "solo negli aeroporti che li hanno" : "only at airports that have them"}</text>
    </svg>
  );
}

/** Three liquids and their solid swaps, which don't go in the liquids bag. */
function SolidSwaps({ language }: { language: Lang }) {
  const it = language === "it";
  const ground = 200;
  const arrow = (cx: number) => <path d={`M${cx - 26} ${ground - 50} H${cx + 14} M${cx + 4} ${ground - 60} L${cx + 16} ${ground - 50} L${cx + 4} ${ground - 40}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />;
  const columns = [
    { cx: 120, name: { it: "Shampoo", en: "Shampoo" }, swap: { it: "flacone → barretta", en: "bottle → bar" } },
    { cx: 360, name: { it: "Deodorante", en: "Deodorant" }, swap: { it: "spray → stick", en: "spray → stick" } },
    { cx: 600, name: { it: "Dentifricio", en: "Toothpaste" }, swap: { it: "tubetto → pastiglie", en: "tube → tablets" } },
  ];
  return (
    <svg viewBox="0 0 720 290" role="img" aria-labelledby="swaps-title">
      <title id="swaps-title">{it ? "Shampoo, deodorante e dentifricio nelle versioni solide, che non contano come liquidi" : "Shampoo, deodorant and toothpaste in solid versions, which don't count as liquids"}</title>
      <path d={`M30 ${ground + 2} H690`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {/* shampoo bottle → bar in an open tin */}
      <Bottle x={40} bottom={ground} w={48} h={96} fill={COLORS.cobalt.pocket} />
      {arrow(120)}
      <ellipse cx={180} cy={ground - 8} rx={44} ry={12} fill="#c9cde0" stroke={INK} strokeWidth={3.5} />
      <rect x={146} y={ground - 46} width={68} height={36} rx={16} fill={COLORS.sun.pocket} stroke={INK} strokeWidth={4} />
      <ellipse cx={180} cy={ground - 28} rx={18} ry={7} fill="none" stroke={COLORS.sun.shade} strokeWidth={3} />

      {/* spray can → stick */}
      <rect x={282} y={ground - 104} width={44} height={104} rx={10} fill={COLORS.coral.body} stroke={INK} strokeWidth={4} />
      <rect x={292} y={ground - 122} width={24} height={18} rx={4} fill="#fff" stroke={INK} strokeWidth={3.5} />
      <path d="M316 87 h12 M330 83 l8 -4 M330 91 l8 4" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M290 112 V170" stroke="#fff" strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" />
      {arrow(360)}
      <rect x={396} y={ground - 84} width={40} height={84} rx={8} fill={COLORS.cobalt.body} stroke={INK} strokeWidth={4} />
      <rect x={396} y={ground - 100} width={40} height={22} rx={8} fill="#fff" stroke={INK} strokeWidth={3.5} />

      {/* toothpaste tube → tablets */}
      <path d={`M514 ${ground - 4} L522 ${ground - 70} Q540 ${ground - 82} 558 ${ground - 70} L566 ${ground - 4} Z`} fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <rect x={530} y={ground - 92} width={20} height={18} rx={4} fill="#3ccf7a" stroke={INK} strokeWidth={3.5} />
      <path d="M526 160 H554" stroke="#3ccf7a" strokeWidth={8} strokeLinecap="round" />
      {arrow(600)}
      {[[640, ground - 14], [670, ground - 14], [655, ground - 40]].map(([cx, cy]) => <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={14} ry={11} fill="#fff" stroke={INK} strokeWidth={3.5} />)}

      {columns.map((column) => <g key={column.cx}>
        <text x={column.cx} y={ground + 42} textAnchor="middle" className="figure-label">{column.name[language]}</text>
        <text x={column.cx} y={ground + 66} textAnchor="middle" className="figure-note">{column.swap[language]}</text>
      </g>)}
    </svg>
  );
}

const captions: Record<GuideIllustrationId, Record<Lang, string>> = {
  "liquids-rules": {
    it: "La regola standard e quella dei nuovi scanner. Al ritorno vale sempre la regola dell'aeroporto di partenza.",
    en: "The standard rule and the new-scanner rule. On the way back, the departure airport's rule always applies.",
  },
  "solid-swaps": {
    it: "Le versioni solide non vanno nella busta dei liquidi e occupano meno spazio.",
    en: "Solid versions don't go in the liquids bag and take less room.",
  },
  "christmas-fill": {
    it: "La lista per 4 giorni nella borsa gratuita, strato per strato: quello che resta in cima è lo spazio per i regali.",
    en: "The 4-day list in the free bag, layer by layer: what's left at the top is room for gifts.",
  },
  "winter-wear": {
    it: "Quello che indossi non conta nelle misure: in inverno sono i capi più ingombranti a viaggiare addosso.",
    en: "What you wear doesn't count towards the size: in winter the bulkiest items travel on you.",
  },
  "sizer-40x30x20": {
    it: "Il misuratore al gate: lo zaino deve entrare tutto, maniglie e tasche comprese. Conta la misura esterna, non i litri.",
    en: "The sizer at the gate: the whole bag must fit, handles and pockets included. Outer size counts, not liters.",
  },
  "packed-depth": {
    it: "Lo stesso zaino morbido: vuoto è profondo 18 cm, pieno fino all'orlo arriva a 27. Misuralo sempre pieno.",
    en: "The same soft backpack: empty it's 18 cm deep, stuffed full it reaches 27. Always measure it packed.",
  },
  "cabinzero-sizes": {
    it: "I tre CabinZero Classic in scala, con misure e peso indicati dal produttore.",
    en: "The three CabinZero Classic sizes to scale, with the maker's stated size and weight.",
  },
};

/** Cartoon figure for a guide section, in the site's style (ink outline, flat colours, offset shadow). */
export function GuideIllustration({ id, language }: { id: GuideIllustrationId; language: Lang }) {
  const it = language === "it";
  return (
    <figure className={`guide-figure guide-figure-${id}`}>
      <div className="guide-figure-art">
        {id === "sizer-40x30x20" && <Sizer language={language} />}
        {id === "packed-depth" && <PackedDepth language={language} />}
        {id === "cabinzero-sizes" && <CabinZeroSizes language={language} />}
        {id === "christmas-fill" && <ChristmasFill language={language} />}
        {id === "winter-wear" && <WinterWear language={language} />}
        {id === "liquids-rules" && <LiquidsRules language={language} />}
        {id === "solid-swaps" && <SolidSwaps language={language} />}
      </div>
      {id === "cabinzero-sizes" && <div className="guide-figure-legend">
        {cabinZeroModels.map((model) => {
          const { underSeat, overhead } = airlinesFor(model.size);
          return (
            <div key={model.liters}>
              <strong>{model.liters} L</strong>
              {underSeat.length > 0 && <p><span className="legend-chip is-free">{it ? "Sotto il sedile" : "Under the seat"}</span>{underSeat.join(", ")}</p>}
              {overhead.length > 0 && <p><span className="legend-chip">{it ? "In cappelliera" : "Overhead bin"}</span>{overhead.join(", ")}</p>}
            </div>
          );
        })}
      </div>}
      <figcaption>{captions[id][language]}</figcaption>
    </figure>
  );
}
