import { airlinesFor, cabinZeroModels } from "@/lib/data/cabinzero";
import type { GuideIllustrationId } from "@/lib/data/guides";

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

const captions: Record<GuideIllustrationId, Record<Lang, string>> = {
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
