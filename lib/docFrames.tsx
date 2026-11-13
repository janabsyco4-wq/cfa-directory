// Alternative borders for the A4 documents, drawn as vectors on the full page. Server-only.

import type { DocTheme } from "@/lib/docArt";

const W = 1123;
const H = 794;
const GOLD = "#b8892c";
const GOLD_DARK = "#7a5212";
const INNER = 56;

export type FrameStyle = "guilloche" | "classic" | "floral" | "deco" | "swoosh";

const f = (n: number) => n.toFixed(2);
const svgProps = { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: { position: "absolute" as const, left: 0, top: 0 } };

/** Places a top-left corner design in all four corners by mirroring it. */
function corners(draw: (key: string) => React.ReactNode) {
  return [
    <g key="tl">{draw("tl")}</g>,
    <g key="tr" transform={`translate(${W} 0) scale(-1 1)`}>{draw("tr")}</g>,
    <g key="bl" transform={`translate(0 ${H}) scale(1 -1)`}>{draw("bl")}</g>,
    <g key="br" transform={`translate(${W} ${H}) scale(-1 -1)`}>{draw("br")}</g>,
  ];
}

/** Gold gradient used by the frames (called as a function: the renderer only accepts plain SVG tags). */
function goldDefs() {
  return (
    <defs>
      <linearGradient id="fGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3dc94" />
        <stop offset="0.45" stopColor="#c9993a" />
        <stop offset="0.7" stopColor="#9c6f1c" />
        <stop offset="1" stopColor="#e7c873" />
      </linearGradient>
    </defs>
  );
}

// ── Classic gilded picture frame ────────────────────────────────────────────

/** A bevelled gold moulding (lit from the top left), then a coloured and a gold rule inside it. */
export function ClassicFrame({ t }: { t: DocTheme }) {
  const a = 12, b = 42; // moulding outer and inner edges
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="cTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbeab0" /><stop offset="0.5" stopColor="#dcb258" /><stop offset="1" stopColor="#a87a22" /></linearGradient>
        <linearGradient id="cLeft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f3d98e" /><stop offset="0.5" stopColor="#cfa043" /><stop offset="1" stopColor="#9c6f1c" /></linearGradient>
        <linearGradient id="cBottom" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#6d4a10" /><stop offset="0.5" stopColor="#a87a22" /><stop offset="1" stopColor="#d2a649" /></linearGradient>
        <linearGradient id="cRight" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#7a5212" /><stop offset="0.5" stopColor="#b38429" /><stop offset="1" stopColor="#dcb258" /></linearGradient>
      </defs>
      <path d={`M${a} ${a}H${W - a}L${W - b} ${b}H${b}Z`} fill="url(#cTop)" />
      <path d={`M${a} ${a}L${b} ${b}V${H - b}L${a} ${H - a}Z`} fill="url(#cLeft)" />
      <path d={`M${a} ${H - a}L${b} ${H - b}H${W - b}L${W - a} ${H - a}Z`} fill="url(#cBottom)" />
      <path d={`M${W - a} ${a}V${H - a}L${W - b} ${H - b}V${b}Z`} fill="url(#cRight)" />
      {/* Beading along the middle of the moulding */}
      <rect x={(a + b) / 2} y={(a + b) / 2} width={W - a - b} height={H - a - b} fill="none" stroke={GOLD_DARK} strokeOpacity={0.55} strokeWidth={2.2} strokeDasharray="1.5 4.5" strokeLinecap="round" />
      <rect x={a} y={a} width={W - 2 * a} height={H - 2 * a} fill="none" stroke={GOLD_DARK} strokeWidth={1.2} />
      <rect x={b} y={b} width={W - 2 * b} height={H - 2 * b} fill="none" stroke={GOLD_DARK} strokeWidth={1.2} />
      <rect x={b + 7} y={b + 7} width={W - 2 * b - 14} height={H - 2 * b - 14} fill="none" stroke={t.primary} strokeWidth={3} />
      <rect x={b + 13} y={b + 13} width={W - 2 * b - 26} height={H - 2 * b - 26} fill="none" stroke={GOLD} strokeWidth={0.8} />
      {corners((k) => (
        <g key={k}>
          <rect x={b + 1} y={b + 1} width={22} height={22} fill={t.primary} stroke={GOLD} strokeWidth={1.2} />
          <rect x={b + 12 - 5} y={b + 12 - 5} width={10} height={10} fill="#e9c977" transform={`rotate(45 ${b + 12} ${b + 12})`} />
        </g>
      ))}
    </svg>
  );
}

// ── Floral vintage ──────────────────────────────────────────────────────────

/** An inward curl: `turns` turns of a spiral from radius r0 down to ~0, starting at `start` radians. */
function spiral(cx: number, cy: number, r0: number, turns: number, start: number, dir: 1 | -1) {
  let d = "";
  const steps = Math.round(turns * 48);
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const ang = start + dir * p * turns * Math.PI * 2;
    const r = r0 * (1 - p * 0.92);
    d += `${i ? "L" : "M"}${f(cx + r * Math.cos(ang))} ${f(cy + r * Math.sin(ang))}`;
  }
  return d;
}

function leaf({ x, y, angle, size, fill, key }: { x: number; y: number; angle: number; size: number; fill: string; key?: string | number }) {
  // Pointed leaf: two arcs meeting at the tips.
  const l = size, w = size * 0.38;
  return <path key={key} d={`M0 0Q${f(l / 2)} ${f(-w)} ${f(l)} 0Q${f(l / 2)} ${f(w)} 0 0Z`} transform={`translate(${f(x)} ${f(y)}) rotate(${f(angle)})`} fill={fill} stroke={GOLD_DARK} strokeWidth={0.5} />;
}

/** Scrolling vine with curls, leaves and a flower in each corner, on fine double rules. */
export function FloralFrame({ t }: { t: DocTheme }) {
  const arm = (swap: boolean) => {
    // Drawn along the top edge; the left-edge arm is the same mirrored across the diagonal.
    const g = (
      <g fill="none" stroke="url(#fGold)" strokeWidth={2.2} strokeLinecap="round">
        <path d="M58 46C92 30 128 56 160 40S214 24 236 44" />
        <path d={spiral(244, 52, 12, 1.3, Math.PI, 1)} strokeWidth={1.8} />
        <path d="M120 49C130 70 152 74 164 64" strokeWidth={1.4} />
        <path d={spiral(160, 70, 6, 1.1, 0, -1)} strokeWidth={1.2} />
        {leaf({ x: 92, y: 38, angle: -28, size: 22, fill: "url(#fGold)" })}
        {leaf({ x: 140, y: 46, angle: 20, size: 20, fill: "url(#fGold)" })}
        {leaf({ x: 190, y: 34, angle: -18, size: 18, fill: "url(#fGold)" })}
        {leaf({ x: 206, y: 40, angle: 32, size: 14, fill: t.primary })}
      </g>
    );
    return swap ? <g transform="matrix(0 1 1 0 0 0)">{g}</g> : g;
  };
  const flower = (cx: number, cy: number) => (
    <g>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => leaf({ key: i, x: cx, y: cy, angle: i * 45 + 22.5, size: 20, fill: i % 2 ? t.primary : "url(#fGold)" }))}
      <circle cx={cx} cy={cy} r={6} fill="url(#fGold)" stroke={GOLD_DARK} strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={2.4} fill={t.primary} />
    </g>
  );
  return (
    <svg {...svgProps}>
      {goldDefs()}
      <rect x={16} y={16} width={W - 32} height={H - 32} fill="none" stroke={t.primary} strokeWidth={4} />
      <rect x={24} y={24} width={W - 48} height={H - 48} fill="none" stroke="url(#fGold)" strokeWidth={1.4} />
      <rect x={INNER - 4} y={INNER - 4} width={W - 2 * INNER + 8} height={H - 2 * INNER + 8} fill="none" stroke="url(#fGold)" strokeWidth={0.8} />
      {corners((k) => (
        <g key={k}>
          {arm(false)}
          {arm(true)}
          {flower(46, 46)}
        </g>
      ))}
      {/* Side centres */}
      {[[18, H / 2], [W - 18, H / 2]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 9} y={y - 9} width={18} height={18} fill={t.primary} stroke="url(#fGold)" strokeWidth={1.4} transform={`rotate(45 ${x} ${y})`} />
          <circle cx={x} cy={y} r={3} fill="url(#fGold)" />
        </g>
      ))}
    </svg>
  );
}

// ── Art deco ────────────────────────────────────────────────────────────────

/** Stepped gold corner brackets with a sunburst fan, and centre ornaments on each edge. */
export function DecoFrame({ t }: { t: DocTheme }) {
  const fan = (cx: number, cy: number, r: number) => {
    const rays = [];
    for (let i = 0; i <= 9; i++) {
      const a = (i / 9) * (Math.PI / 2);
      rays.push(<path key={i} d={`M${cx} ${cy}L${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`} stroke="url(#fGold)" strokeWidth={i % 3 === 0 ? 1.6 : 0.8} />);
    }
    return rays;
  };
  const edgeOrnament = (x: number, y: number, vertical: boolean) => (
    <g transform={vertical ? `rotate(90 ${x} ${y})` : undefined}>
      <path d={`M${x - 120} ${y}H${x - 22}M${x + 22} ${y}H${x + 120}`} stroke="url(#fGold)" strokeWidth={1.4} />
      <path d={`M${x - 80} ${y - 5}H${x - 26}M${x + 26} ${y - 5}H${x + 80}M${x - 80} ${y + 5}H${x - 26}M${x + 26} ${y + 5}H${x + 80}`} stroke="url(#fGold)" strokeWidth={0.7} />
      <rect x={x - 11} y={y - 11} width={22} height={22} fill={t.primary} stroke="url(#fGold)" strokeWidth={1.6} transform={`rotate(45 ${x} ${y})`} />
      <rect x={x - 4} y={y - 4} width={8} height={8} fill="url(#fGold)" transform={`rotate(45 ${x} ${y})`} />
    </g>
  );
  return (
    <svg {...svgProps}>
      {goldDefs()}
      <rect x={14} y={14} width={W - 28} height={H - 28} fill="none" stroke={t.primary} strokeWidth={6} />
      <rect x={24} y={24} width={W - 48} height={H - 48} fill="none" stroke="url(#fGold)" strokeWidth={1.6} />
      <rect x={INNER - 6} y={INNER - 6} width={W - 2 * INNER + 12} height={H - 2 * INNER + 12} fill="none" stroke="url(#fGold)" strokeWidth={0.8} />
      {corners((k) => (
        <g key={k} fill="none">
          {[0, 1, 2, 3].map((i) => {
            const o = 30 + i * 7, len = 150 - i * 26;
            return <path key={i} d={`M${o} ${o + len}V${o}H${o + len}`} stroke="url(#fGold)" strokeWidth={i === 0 ? 2.4 : 1.1} />;
          })}
          {/* Stepped notch */}
          <path d="M30 96H44V82H58V68H72V54H86V40" stroke={t.primary} strokeWidth={2} />
          {fan(30, 30, 64)}
          <path d="M30 94A64 64 0 0 0 94 30" stroke="url(#fGold)" strokeWidth={1.2} />
          <path d="M30 56A26 26 0 0 0 56 30L30 30Z" fill={t.primary} stroke="url(#fGold)" strokeWidth={1.2} />
        </g>
      ))}
      {edgeOrnament(W / 2, 24, false)}
      {edgeOrnament(W / 2, H - 24, false)}
      {edgeOrnament(24, H / 2, true)}
      {edgeOrnament(W - 24, H / 2, true)}
    </svg>
  );
}

// ── Modern swoosh ───────────────────────────────────────────────────────────

/** Sweeping coloured waves with gold ribbons in two opposite corners, on a fine gold border. */
export function SwooshFrame({ t }: { t: DocTheme }) {
  const swoosh = (
    <g>
      <path d="M0 0H270C190 34 92 104 0 210Z" fill={t.band[1]} fillOpacity={0.35} />
      <path d="M0 0H215C150 28 72 86 0 168Z" fill={t.primary} />
      <path d="M0 232C92 120 190 48 300 0" fill="none" stroke="url(#fGold)" strokeWidth={4} />
      <path d="M0 252C100 136 204 58 330 0" fill="none" stroke="url(#fGold)" strokeWidth={1.2} />
      <path d="M0 0H150C104 20 50 62 0 118Z" fill={t.deep} />
    </g>
  );
  return (
    <svg {...svgProps}>
      {goldDefs()}
      <rect x={20} y={20} width={W - 40} height={H - 40} fill="none" stroke="url(#fGold)" strokeWidth={2} />
      <rect x={27} y={27} width={W - 54} height={H - 54} fill="none" stroke={t.primary} strokeWidth={0.8} />
      {swoosh}
      <g transform={`rotate(180 ${W / 2} ${H / 2})`}>{swoosh}</g>
      {/* Small accents in the other two corners */}
      {[[W - 40, 40], [40, H - 40]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 8} y={y - 8} width={16} height={16} fill={t.primary} stroke="url(#fGold)" strokeWidth={1.4} transform={`rotate(45 ${x} ${y})`} />
        </g>
      ))}
    </svg>
  );
}
