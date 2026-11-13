// Shared artwork for the A4 documents (membership certificate and notifications): fonts,
// the security-print frame, rosettes, the gold seal and helpers for flowing text. Server-only.
// Everything is drawn as vectors, so documents stay sharp at print resolution.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { readGlyphs, type GlyphSet } from "@/lib/glyphs";
import { ClassicFrame, DecoFrame, FloralFrame, SwooshFrame, type FrameStyle } from "@/lib/docFrames";

// A4 landscape, laid out in CSS pixels (96 per inch) and scaled when rendered.
export const DOC_W = 1123;
export const DOC_H = 794;
/** A4 landscape in PDF points. */
export const DOC_PAGE_PT = { width: 842, height: 595 };
/** Print renders at ~290 DPI; previews are light enough to show on a web page. */
export const DOC_SCALE = { print: 3, preview: 1.25 } as const;
export type DocFormat = "pdf" | "png" | "preview";

export const GREEN = "#0f3b2a";
export const GREEN_DEEP = "#082519";
export const GOLD = "#b8892c";
export const GOLD_LIGHT = "#e9cd7c";
export const PARCHMENT = "#fbf5e4";
export const INK = "#1d2a23";
export const MAROON = "#7c1616";
export const GOLD_TEXT = "linear-gradient(180deg, #f6e3a1 0%, #d9ae4f 38%, #a8781f 62%, #e2bf68 100%)";

/** Colour scheme of a document; the gold work is shared by all. */
export interface DocTheme {
  label: string;
  /** Headings, the member's name, ribbons and outer rule. */
  primary: string;
  /** Corner medallions and the QR code. */
  deep: string;
  /** The security band, as a three-stop diagonal gradient. */
  band: [string, string, string];
  /** Page background. */
  paper: string;
  /** Body text. */
  ink: string;
}

const WARM_PAPER = "radial-gradient(ellipse at 50% 45%, #fffcf3 0%, #fbf4e1 55%, #f1e3bf 100%)";
const IVORY_PAPER = "radial-gradient(ellipse at 50% 45%, #fffefa 0%, #faf6ea 55%, #ede3c8 100%)";

export const DOC_THEMES = {
  emerald: { label: "Emerald & Gold", primary: GREEN, deep: GREEN_DEEP, band: ["#0b3022", GREEN, "#0a2b1f"], paper: WARM_PAPER, ink: INK },
  navy: { label: "Royal Navy & Gold", primary: "#14305e", deep: "#0a1a36", band: ["#0c2146", "#173b72", "#0a1c3c"], paper: IVORY_PAPER, ink: "#1b2433" },
  maroon: { label: "Maroon & Gold", primary: "#6b1420", deep: "#3d0a10", band: ["#4f0d16", "#761a28", "#460a12"], paper: WARM_PAPER, ink: "#2a1a1c" },
  black: { label: "Black & Gold", primary: "#1c1c1c", deep: "#0b0b0b", band: ["#121212", "#2a2a2a", "#0e0e0e"], paper: IVORY_PAPER, ink: "#1c1c1c" },
  blue: { label: "Royal Blue & Gold", primary: "#1a4596", deep: "#0c2a5e", band: ["#123a80", "#2058b8", "#0f3373"], paper: IVORY_PAPER, ink: "#1b2433" },
  teal: { label: "Teal & Gold", primary: "#0d5257", deep: "#062d30", band: ["#08393c", "#11656b", "#073235"], paper: WARM_PAPER, ink: "#1b2a2b" },
  purple: { label: "Royal Purple & Gold", primary: "#3e1d63", deep: "#23103a", band: ["#2c1448", "#4a2373", "#26113f"], paper: WARM_PAPER, ink: "#241b2e" },
} satisfies Record<string, DocTheme>;

export type DocThemeKey = keyof typeof DOC_THEMES;
export const DEFAULT_THEME: DocThemeKey = "emerald";

/** Height ÷ width of assets/card/logo-clear.png (the logo on a transparent background). */
export const LOGO_RATIO = 386 / 341;

type Fonts = NonNullable<NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]>;
export type DocAssets = { fonts: Fonts; logo: string; signature: string; stamp: string; sealGlyphs: GlyphSet };

/** Lettering round the seal. */
const SEAL_TEXT = "CHAMBER OF FOOD & AGRICULTURE • PAKISTAN • ";

let assets: Promise<DocAssets> | undefined;

export function loadDocAssets(): Promise<DocAssets> {
  assets ??= (async () => {
    const dir = join(process.cwd(), "assets");
    const font = (file: string) => readFile(join(dir, "fonts", file));
    const dataUri = async (file: string) => `data:image/png;base64,${(await readFile(join(dir, "card", file))).toString("base64")}`;
    const [cinzel, decorative, garamond, garamondItalic, garamondBoldItalic, vibes, playfair, logo, signature, stamp] = await Promise.all([
      font("Cinzel-Bold.ttf"), font("CinzelDecorative-Bold.ttf"),
      font("EBGaramond-Medium.ttf"), font("EBGaramond-Italic.ttf"), font("EBGaramond-SemiBoldItalic.ttf"),
      font("GreatVibes-Regular.ttf"), font("PlayfairDisplay-Bold.ttf"),
      dataUri("logo-clear.png"), dataUri("signature.png"), dataUri("stamp.png"),
    ]);
    const fonts: Fonts = [
      { name: "Cinzel", data: cinzel, weight: 700, style: "normal" },
      { name: "Cinzel Decorative", data: decorative, weight: 700, style: "normal" },
      { name: "Garamond", data: garamond, weight: 500, style: "normal" },
      { name: "Garamond", data: garamondItalic, weight: 400, style: "italic" },
      { name: "Garamond", data: garamondBoldItalic, weight: 600, style: "italic" },
      { name: "Great Vibes", data: vibes, weight: 400, style: "normal" },
      { name: "Playfair", data: playfair, weight: 700, style: "normal" },
    ];
    return { fonts, logo, signature, stamp, sealGlyphs: readGlyphs(cinzel, SEAL_TEXT) };
  })().catch((err) => {
    assets = undefined;
    throw err;
  });
  return assets!;
}

export const clean = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();

function validDate(d?: Date | string | null) {
  const v = d ? new Date(d) : null;
  return v && !Number.isNaN(v.getTime()) ? v : null;
}

/** "12 March 2024" in Pakistan time. */
export function longDate(d?: Date | string | null) {
  const v = validDate(d);
  return v ? v.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" }) : "";
}

/** "01.08.2026", the style used on Chamber notifications. */
export function dottedDate(d?: Date | string | null) {
  const v = validDate(d);
  if (!v) return "";
  const p = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Karachi" }).formatToParts(v);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}`;
}

export function qrDataUrl(url: string, dark: string = GREEN_DEEP) {
  return QRCode.toDataURL(url, { margin: 0, width: 420, errorCorrectionLevel: "M", color: { dark, light: "#ffffff" } });
}

/** Font size that keeps `text` within `width` (an average glyph is `em` of the size). */
export function fitSize(text: string, max: number, width: number, em = 0.56) {
  return Math.min(max, Math.floor(width / (Math.max(text.length, 1) * em)));
}

// ── Geometry ────────────────────────────────────────────────────────────────

const f = (n: number) => n.toFixed(2);

/** Closed wavy ring: radius r0 + amp·sin(k·θ + phase), centred on (cx, cy). */
function ringPath(cx: number, cy: number, r0: number, amp: number, k: number, phase: number, steps = 360) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = r0 + amp * Math.sin(k * t + phase);
    d += `${i ? "L" : "M"}${f(cx + r * Math.cos(t))} ${f(cy + r * Math.sin(t))}`;
  }
  return d + "Z";
}

/** Interlaced guilloche lines along a straight strip from (x, y) of the given length. */
function strandPaths(x: number, y: number, length: number, height: number, vertical: boolean, strands: number, wave: number) {
  const out: string[] = [];
  const steps = Math.ceil(length / 2.5);
  for (let s = 0; s < strands; s++) {
    const phase = (s / strands) * Math.PI * 2;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * length;
      const a = (u / wave) * Math.PI * 2;
      // Two harmonics give the woven, banknote-style rope.
      const v = (height / 2) * (0.72 * Math.sin(a + phase) + 0.28 * Math.sin(3 * a - phase));
      const px = vertical ? x + height / 2 + v : x + u;
      const py = vertical ? y + u : y + height / 2 + v;
      d += `${i ? "L" : "M"}${f(px)} ${f(py)}`;
    }
    out.push(d);
  }
  return out;
}

/** Concentric interlaced rings: the classic guilloche rosette. */
export function Rosette({ size, color, rings = 14, k = 18, opacity = 1, strokeWidth = 0.6 }: { size: number; color: string; rings?: number; k?: number; opacity?: number; strokeWidth?: number }) {
  const c = size / 2;
  const paths: string[] = [];
  for (let i = 0; i < rings; i++) {
    const r0 = c * (0.3 + 0.62 * (i / Math.max(rings - 1, 1)));
    paths.push(ringPath(c, c, r0, c * 0.07, k, (i * Math.PI) / 3.5));
    paths.push(ringPath(c, c, r0, c * 0.07, k, (i * Math.PI) / 3.5 + Math.PI));
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity }}>
      {paths.map((d, i) => <path key={i} d={d} fill="none" stroke={color} strokeWidth={strokeWidth} />)}
    </svg>
  );
}

// ── Frame ───────────────────────────────────────────────────────────────────

const BAND_OUT = 14; // page edge → outer band
const BAND_W = 30; // width of the green guilloche band
const INNER = BAND_OUT + BAND_W + 12; // first rule inside the band

/**
 * How grand a document is. Higher tiers add ornament: 1 a plain ruled frame, 2 a light security
 * band, 3 the full band with corner medallions, 4 adds a second gold guilloche border and larger,
 * richer medallions.
 */
export type DocTier = 1 | 2 | 3 | 4;

/** Guilloche strands round a rectangle inset `inset` from the page edge. */
function bandStrands(inset: number, width: number, strands: number, wave: number) {
  const W = DOC_W, H = DOC_H;
  return [
    ...strandPaths(inset, inset, W - 2 * inset, width, false, strands, wave),
    ...strandPaths(inset, H - inset - width, W - 2 * inset, width, false, strands, wave),
    ...strandPaths(inset, inset, H - 2 * inset, width, true, strands, wave),
    ...strandPaths(W - inset - width, inset, H - 2 * inset, width, true, strands, wave),
  ];
}

/** Deep-coloured security band with gold guilloche, gold rules and rosette corners. */
export function Frame({ t, tier = 3 }: { t: DocTheme; tier?: DocTier }) {
  const W = DOC_W, H = DOC_H;
  const a = BAND_OUT, b = BAND_OUT + BAND_W;
  if (tier === 1) return <PlainFrame t={t} />;
  const strands = bandStrands(a, BAND_W, tier === 2 ? 4 : 7, tier === 2 ? 46 : 38);
  // Grand documents get a second, gold-on-paper guilloche border just inside the band.
  const innerStrands = tier === 4 ? bandStrands(b + 2, 9, 4, 22) : [];
  const corner = tier === 4 ? 66 : 56;
  const corners = [[a + BAND_W / 2, a + BAND_W / 2], [W - a - BAND_W / 2, a + BAND_W / 2], [a + BAND_W / 2, H - a - BAND_W / 2], [W - a - BAND_W / 2, H - a - BAND_W / 2]];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="band" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.band[0]} />
          <stop offset="0.5" stopColor={t.band[1]} />
          <stop offset="1" stopColor={t.band[2]} />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dc94" />
          <stop offset="0.45" stopColor="#c9993a" />
          <stop offset="0.7" stopColor="#9c6f1c" />
          <stop offset="1" stopColor="#e7c873" />
        </linearGradient>
        <radialGradient id="medal" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#d6a743" />
          <stop offset="1" stopColor="#8d5f14" />
        </radialGradient>
      </defs>
      {/* Band with an even-odd hole for the page */}
      <path fillRule="evenodd" fill="url(#band)" d={`M${a} ${a}H${W - a}V${H - a}H${a}Z M${b} ${b}V${H - b}H${W - b}V${b}Z`} />
      {strands.map((d, i) => <path key={i} d={d} fill="none" stroke="#d8b25c" strokeOpacity={tier === 2 ? 0.4 : 0.55} strokeWidth={0.7} />)}
      {innerStrands.map((d, i) => <path key={`in${i}`} d={d} fill="none" stroke="#b8892c" strokeOpacity={0.85} strokeWidth={0.6} />)}
      {tier === 4 && <rect x={b + 12} y={b + 12} width={W - 2 * b - 24} height={H - 2 * b - 24} fill="none" stroke="url(#gold)" strokeWidth={1} />}
      <rect x={a} y={a} width={W - 2 * a} height={H - 2 * a} fill="none" stroke="url(#gold)" strokeWidth={tier === 4 ? 3.2 : 2.4} />
      <rect x={b} y={b} width={W - 2 * b} height={H - 2 * b} fill="none" stroke="url(#gold)" strokeWidth={2.4} />
      <rect x={6} y={6} width={W - 12} height={H - 12} fill="none" stroke={t.primary} strokeWidth={1.4} />
      {/* Inner double rule (the grand border's gold guilloche takes its place) */}
      {tier !== 4 && <rect x={INNER} y={INNER} width={W - 2 * INNER} height={H - 2 * INNER} fill="none" stroke="url(#gold)" strokeWidth={1.6} />}
      <rect x={INNER + 5} y={INNER + 5} width={W - 2 * INNER - 10} height={H - 2 * INNER - 10} fill="none" stroke={GOLD} strokeOpacity={0.6} strokeWidth={0.6} />
      {/* Inner corner brackets */}
      {[[INNER + 12, INNER + 12, 1, 1], [W - INNER - 12, INNER + 12, -1, 1], [INNER + 12, H - INNER - 12, 1, -1], [W - INNER - 12, H - INNER - 12, -1, -1]].map(([x, y, sx, sy], i) => (
        <g key={i} fill="none" stroke="url(#gold)" strokeWidth={1.4}>
          <path d={`M${x} ${y + sy * 46}V${y}H${x + sx * 46}`} />
          <path d={`M${x + sx * 8} ${y + sy * 30}V${y + sy * 8}H${x + sx * 30}`} strokeWidth={0.8} />
          <path d={`M${x + sx * 14} ${y + sy * 14}l${sx * 5} ${sy * -5}l${sx * 5} ${sy * 5}l${sx * -5} ${sy * 5}Z`} fill={GOLD} stroke="none" />
        </g>
      ))}
      {/* Corners: gold diamonds on the light band; medallions on the full and grand bands */}
      {tier === 2
        ? corners.map(([cx, cy], i) => (
          <g key={i}>
            <rect x={cx - 13} y={cy - 13} width={26} height={26} fill={t.deep} stroke="url(#gold)" strokeWidth={2} transform={`rotate(45 ${cx} ${cy})`} />
            <circle cx={cx} cy={cy} r={4.5} fill="url(#medal)" />
          </g>
        ))
        : corners.map(([cx, cy], i) => (
          <g key={i}>
            {tier === 4 && <circle cx={cx} cy={cy} r={corner / 2 + 4} fill="none" stroke="url(#gold)" strokeWidth={1} />}
            <circle cx={cx} cy={cy} r={corner / 2} fill={t.deep} stroke="url(#gold)" strokeWidth={tier === 4 ? 3 : 2.4} />
            <circle cx={cx} cy={cy} r={corner / 2 - 5} fill="none" stroke={GOLD_LIGHT} strokeOpacity={0.7} strokeWidth={0.7} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => (
              <path key={j} d={ringPath(cx, cy, corner * 0.27, corner * 0.04, 12, (j * Math.PI) / 4)} fill="none" stroke="#e2c070" strokeOpacity={0.75} strokeWidth={0.55} />
            ))}
            <circle cx={cx} cy={cy} r={corner * (tier === 4 ? 0.16 : 0.12)} fill="url(#medal)" stroke="#7a5212" strokeWidth={0.8} />
          </g>
        ))}
    </svg>
  );
}

/** Essential tier: no security band, just a coloured rule, gold double rule and small corner diamonds. */
function PlainFrame({ t }: { t: DocTheme }) {
  const W = DOC_W, H = DOC_H;
  const r = (inset: number, stroke: string, width: number, key: string) => (
    <rect key={key} x={inset} y={inset} width={W - 2 * inset} height={H - 2 * inset} fill="none" stroke={stroke} strokeWidth={width} />
  );
  const d = 34; // corner diamond centre, from the page edge
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {r(16, t.primary, 6, "a")}
      {r(26, GOLD, 1.6, "b")}
      {r(31, GOLD, 0.6, "c")}
      {r(INNER, t.primary, 0.8, "d")}
      {[[d, d], [W - d, d], [d, H - d], [W - d, H - d]].map(([cx, cy], i) => (
        <rect key={i} x={cx - 7} y={cy - 7} width={14} height={14} fill={GOLD} transform={`rotate(45 ${cx} ${cy})`} />
      ))}
    </svg>
  );
}

/** Gold laurel branches curving up either side of a seal of the given size. */
export function Laurel({ size }: { size: number }) {
  const c = size / 2, R = size * 0.56;
  const leaves: { x: number; y: number; angle: number }[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      // From the bottom (100°) round to the upper side (215°), mirrored for the right branch.
      const deg = 100 + i * 13;
      const rad = (deg * Math.PI) / 180;
      // Left branch at θ, right branch mirrored; each leaf follows the curve, tipped slightly outward.
      leaves.push({ x: c - side * R * Math.cos(rad), y: c + R * Math.sin(rad), angle: -side * (deg + 18) });
    }
  }
  return (
    <svg width={size * 1.4} height={size * 1.2} viewBox={`${-size * 0.2} ${-size * 0.1} ${size * 1.4} ${size * 1.2}`} style={{ position: "absolute", left: -size * 0.2, top: -size * 0.1 }}>
      <defs>
        <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e3a1" />
          <stop offset="0.5" stopColor="#c99a3b" />
          <stop offset="1" stopColor="#8d6216" />
        </linearGradient>
      </defs>
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx={size * 0.035} ry={size * 0.085} fill="url(#leaf)" stroke="#7a5212" strokeWidth={0.5} transform={`rotate(${l.angle} ${l.x} ${l.y})`} />
      ))}
    </svg>
  );
}

/** The page: parchment, frame and a faint rosette watermark behind the content. */
export function Page({ children, watermark, t, tier = 3, frame = "guilloche" }: {
  children: ReactNode; watermark: string; t: DocTheme; tier?: DocTier; frame?: FrameStyle;
}) {
  return (
    <div style={{ width: DOC_W, height: DOC_H, display: "flex", position: "relative", backgroundImage: t.paper }}>
      {tier > 1 && (
        <div style={{ position: "absolute", left: DOC_W / 2 - 300, top: DOC_H / 2 - 300, display: "flex" }}>
          <Rosette size={600} color={GOLD} rings={tier === 4 ? 28 : 22} k={24} opacity={tier === 4 ? 0.17 : tier === 2 ? 0.09 : 0.13} strokeWidth={0.5} />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={watermark} width={300} height={300 * LOGO_RATIO} style={{ position: "absolute", left: DOC_W / 2 - 150, top: DOC_H / 2 - 150 * LOGO_RATIO + 20, opacity: 0.07 }} />
      {frame === "classic" ? <ClassicFrame t={t} />
        : frame === "floral" ? <FloralFrame t={t} />
        : frame === "deco" ? <DecoFrame t={t} />
        : frame === "swoosh" ? <SwooshFrame t={t} />
        : <Frame t={t} tier={tier} />}
      {children}
    </div>
  );
}

/** Thin gold rule with a diamond in the middle. */
export function Divider({ width, color = GOLD }: { width: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", width }}>
      <div style={{ flex: 1, height: 1.2, backgroundImage: `linear-gradient(90deg, rgba(184,137,44,0) 0%, ${color} 100%)` }} />
      <div style={{ width: 8, height: 8, margin: "0 8px", background: color, transform: "rotate(45deg)" }} />
      <div style={{ width: 5, height: 5, marginRight: 8, background: color, transform: "rotate(45deg)" }} />
      <div style={{ width: 8, height: 8, marginRight: 8, background: color, transform: "rotate(45deg)" }} />
      <div style={{ flex: 1, height: 1.2, backgroundImage: `linear-gradient(90deg, ${color} 0%, rgba(184,137,44,0) 100%)` }} />
    </div>
  );
}

// ── Seal ────────────────────────────────────────────────────────────────────

/** Angle (degrees, clockwise from the top) at the middle of each character set round a ring. */
function ringAngles(text: string, widthOf: (ch: string) => number, units: number) {
  const out: { ch: string; angle: number }[] = [];
  let run = 0;
  for (const ch of text) {
    out.push({ ch, angle: ((run + widthOf(ch) / 2) / units) * 360 });
    run += widthOf(ch);
  }
  return out;
}

/**
 * Embossed gold seal with ribbon tails, the Chamber's name round the rim and the logo inside.
 * The rim lettering is drawn from the font's own outlines so it follows the circle exactly.
 */
export function Seal({ size, logo, glyphs, ribbon = GREEN, ribbons = true, laurel = false }: {
  size: number; logo: string; glyphs: GlyphSet; ribbon?: string; ribbons?: boolean; laurel?: boolean;
}) {
  const c = size / 2;
  const tail = size * 0.4;
  const logoH = size * 0.4;
  const track = 0.12; // em between letters
  const widthOf = (ch: string) => (glyphs.glyphs[ch]?.advance ?? 0.3) + track;
  const units = SEAL_TEXT.split("").reduce((s, ch) => s + widthOf(ch), 0);
  const letterR = c * 0.7;
  const em = (2 * Math.PI * letterR) / units; // font size that closes the ring
  const s = em / glyphs.unitsPerEm;
  const letters = ringAngles(SEAL_TEXT, widthOf, units);
  return (
    <div style={{ width: size, height: size + (ribbons ? tail * 0.72 : 0), display: "flex", position: "relative" }}>
      {laurel && <Laurel size={size} />}
      {ribbons && (
        <svg width={size} height={size + tail} viewBox={`0 0 ${size} ${size + tail}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={`M${c - size * 0.3} ${c}L${c - size * 0.38} ${size + tail * 0.7}L${c - size * 0.27} ${size + tail * 0.55}L${c - size * 0.18} ${size + tail * 0.72}L${c - size * 0.08} ${c}Z`} fill={ribbon} stroke={GOLD} strokeWidth={1.2} />
          <path d={`M${c + size * 0.3} ${c}L${c + size * 0.38} ${size + tail * 0.7}L${c + size * 0.27} ${size + tail * 0.55}L${c + size * 0.18} ${size + tail * 0.72}L${c + size * 0.08} ${c}Z`} fill={ribbon} stroke={GOLD} strokeWidth={1.2} />
        </svg>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id="seal" cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor="#fff4c8" />
            <stop offset="0.35" stopColor="#e5bd5a" />
            <stop offset="0.75" stopColor="#b9882b" />
            <stop offset="1" stopColor="#7d5410" />
          </radialGradient>
          <linearGradient id="sealRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbe7a6" />
            <stop offset="0.5" stopColor="#a8761e" />
            <stop offset="1" stopColor="#f0d186" />
          </linearGradient>
        </defs>
        <path d={ringPath(c, c, c * 0.93, c * 0.05, 32, 0, 720)} fill="url(#seal)" stroke="#7a5110" strokeWidth={1} />
        <circle cx={c} cy={c} r={c * 0.84} fill="none" stroke="url(#sealRim)" strokeWidth={size * 0.012} />
        <circle cx={c} cy={c} r={c * 0.56} fill="none" stroke="url(#sealRim)" strokeWidth={size * 0.012} />
        {[0, 1, 2, 3, 4, 5].map((j) => (
          <path key={j} d={ringPath(c, c, c * 0.5, c * 0.025, 20, (j * Math.PI) / 3)} fill="none" stroke="#8a5d14" strokeOpacity={0.55} strokeWidth={0.6} />
        ))}
        <circle cx={c} cy={c} r={c * 0.46} fill="#fffaf0" stroke="#9c6f1c" strokeWidth={1} />
        {letters.map(({ ch, angle }, i) => {
          const g = glyphs.glyphs[ch];
          if (!g?.d) return null;
          const rad = (angle * Math.PI) / 180;
          const x = c + letterR * Math.sin(rad), y = c - letterR * Math.cos(rad);
          // Centre the glyph on its point of the ring, upright towards the rim; font y points up.
          const transform = `translate(${f(x)} ${f(y)}) rotate(${f(angle)}) scale(${s} ${-s}) translate(${f((-g.advance * glyphs.unitsPerEm) / 2)} ${f(-glyphs.capHeight / 2)})`;
          return <path key={i} d={g.d} transform={transform} fill="#5a3a06" />;
        })}
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={logo} width={logoH / LOGO_RATIO} height={logoH} style={{ position: "absolute", left: c - logoH / LOGO_RATIO / 2, top: c - logoH / 2 }} />
    </div>
  );
}

// ── Text ────────────────────────────────────────────────────────────────────

/** A run of text: plain, or emphasised for filled-in details. */
export type Run = string | { strong: string };

/**
 * Flowing paragraph laid out word by word (the renderer only lays out boxes), so filled-in
 * details can be emphasised mid-sentence.
 */
export function Paragraph({ runs, size, color, strongColor, align = "center", lineHeight = 1.5, italic = true }: {
  runs: Run[]; size: number; color: string; strongColor: string; align?: "center" | "flex-start"; lineHeight?: number; italic?: boolean;
}) {
  const words: { w: string; strong: boolean }[] = [];
  for (const r of runs) {
    const strong = typeof r !== "string";
    for (const token of clean(strong ? r.strong : r).split(" ").filter(Boolean)) {
      // Punctuation opening a run belongs to the word before it.
      const lead = token.match(/^[,.;:)]+/)?.[0] ?? "";
      if (lead && words.length) words[words.length - 1].w += lead;
      if (token.length > lead.length || !words.length) words.push({ w: words.length ? token.slice(lead.length) : token, strong });
    }
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: align, fontFamily: "Garamond", fontSize: size, lineHeight, color }}>
      {words.map(({ w, strong }, i) => (
        <span
          key={i}
          style={{
            marginRight: size * 0.26,
            fontStyle: italic || strong ? "italic" : "normal",
            fontWeight: strong ? 600 : italic ? 400 : 500,
            color: strong ? strongColor : color,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

/**
 * President's signature over a gold rule, with the name when the Chamber has set one, and the
 * Chamber's official stamp pressed beside it at a slight angle, as on a hand-stamped document.
 */
export function SignatureBlock({ signature, stamp, stampSide = "right", name, width = 230, color = GREEN, ink = INK }: {
  signature: string; stamp: string; stampSide?: "left" | "right"; name?: string; width?: number; color?: string; ink?: string;
}) {
  const stampSize = 96;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width, position: "relative" }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img
        src={stamp}
        width={stampSize}
        height={stampSize}
        style={{
          position: "absolute", top: -26, [stampSide]: -22, opacity: 0.86,
          transform: `rotate(${stampSide === "right" ? -14 : 11}deg)`,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={signature} width={52} height={76} style={{ marginBottom: -10 }} />
      <div style={{ width, height: 1.4, background: GOLD }} />
      {name && <div style={{ marginTop: 8, fontFamily: "Garamond", fontWeight: 500, fontSize: 15, color: ink }}>{name}</div>}
      <div style={{ marginTop: name ? 1 : 10, fontFamily: "Cinzel", fontWeight: 700, fontSize: 13, letterSpacing: 2, color }}>PRESIDENT</div>
    </div>
  );
}

/** QR code in a gold-edged frame with a caption. */
export function VerifyQr({ qr, caption, size = 86, color = GREEN }: { qr: string; caption: string; size?: number; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size + 60 }}>
      <div style={{ display: "flex", padding: 6, background: "#ffffff", border: `1.5px solid ${GOLD}`, borderRadius: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={qr} width={size} height={size} />
      </div>
      <div style={{ marginTop: 6, fontFamily: "Cinzel", fontWeight: 700, fontSize: 9.5, letterSpacing: 1.2, color, textAlign: "center" }}>{caption}</div>
    </div>
  );
}

/** Renders an A4 document element at the requested scale to PNG bytes. */
export async function renderDoc(element: ReactNode, scale: number, fonts: Fonts): Promise<Buffer> {
  const width = Math.round(DOC_W * scale), height = Math.round(DOC_H * scale);
  const scaled = (
    <div style={{ width, height, display: "flex" }}>
      {/* The renderer scales about the centre, so shift back to scale from the top-left corner. */}
      <div style={{ width: DOC_W, height: DOC_H, display: "flex", flexShrink: 0, transform: `translate(${((scale - 1) * DOC_W) / 2}px, ${((scale - 1) * DOC_H) / 2}px) scale(${scale})` }}>
        {element}
      </div>
    </div>
  );
  const res = new ImageResponse(scaled, { width, height, fonts });
  return Buffer.from(await res.arrayBuffer());
}
