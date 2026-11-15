// Turns an SVG page into a one-page vector PDF, so text and artwork stay sharp at any zoom
// or print size. Server-only.

import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

const attrs = (s: string) => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const attrString = (a: Record<string, string | undefined>) =>
  Object.entries(a).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}="${v}"`).join(" ");

/**
 * The page renderer embeds inline <svg> artwork (borders, seal, rosettes) as SVG *images*,
 * which the PDF writer can't open. Put each back as a nested <svg> in the same box, with its
 * ids prefixed so separate pieces of artwork can't collide.
 */
function inlineSvgImages(svg: string) {
  let n = 0;
  return svg.replace(/<image\s([^>]*?)href="data:image\/svg\+xml;utf8,([^"]*)"([^>]*?)\/>/g, (_all, before: string, encoded: string, after: string) => {
    const img = attrs(`${before} ${after}`);
    const inner = decodeURIComponent(encoded);
    const open = inner.match(/^\s*<svg\b([^>]*)>/);
    const close = inner.lastIndexOf("</svg>");
    if (!open || close < 0) return "";
    const root = attrs(open[1]);
    const p = `v${n++}_`;
    const body = inner.slice(open[0].length, close)
      .replace(/\bid="([^"]+)"/g, `id="${p}$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`)
      .replace(/(xlink:)?href="#([^"]+)"/g, (_m, x = "", id) => `${x}href="#${p}${id}"`);
    const { width, height, x, y, xmlns, viewBox, ...rest } = root;
    void xmlns; void x; void y;
    const nested = attrString({
      ...rest,
      x: img.x ?? "0", y: img.y ?? "0", width: img.width ?? width, height: img.height ?? height,
      viewBox: viewBox ?? `0 0 ${width} ${height}`,
      preserveAspectRatio: img.preserveAspectRatio ?? "none",
    });
    const wrap = attrString({ "clip-path": img["clip-path"], mask: img.mask, transform: img.transform, opacity: img.opacity });
    return `<g ${wrap}><svg ${nested}>${body}</svg></g>`;
  });
}

/**
 * CSS linear gradients arrive as a one-tile pattern holding a gradient-filled rect. As PDF
 * tiling patterns they leave a hairline at the tile edge, so fill with the gradient itself:
 * both are sized to the shape's box, so the result is the same.
 */
function unwrapGradientPatterns(svg: string) {
  const swaps = new Map<string, string>();
  const out = svg.replace(
    /<pattern id="([^"]+)" x="0" y="0" width="1" height="1" patternUnits="objectBoundingBox">(<linearGradient id="([^"]+)"[^>]*>(?:<stop [^>]*\/>)*<\/linearGradient>)<rect x="0" y="0" width="[^"]+" height="[^"]+" fill="url\(#\3\)"\/><\/pattern>/g,
    (_all, pattern: string, gradient: string, gradientId: string) => {
      swaps.set(pattern, gradientId);
      return gradient;
    },
  );
  return swaps.size ? out.replace(/url\(#([^)]+)\)/g, (m, id: string) => (swaps.has(id) ? `url(#${swaps.get(id)})` : m)) : out;
}

/** Zero-width or zero-height rects draw nothing in SVG, but PDF viewers show them as hairlines. */
const dropEmptyRects = (svg: string) => svg.replace(/<rect [^>]*?\b(?:width|height)="0"[^>]*\/>/g, "");

type Box = { x: number; y: number; w: number; h: number };
const RECT = String.raw`<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"`;
const box = (m: RegExpMatchArray | string[]): Box => ({ x: +m[2], y: +m[3], w: +m[4], h: +m[5] });
const inside = (a: Box, b: Box) =>
  a.x >= b.x - 0.01 && a.y >= b.y - 0.01 && a.x + a.w <= b.x + b.w + 0.01 && a.y + a.h <= b.y + b.h + 0.01;

/**
 * The page renderer gives each image and clipped box a mask that is just a solid white
 * rectangle over its own box. In a PDF each becomes a soft mask, which viewers composite
 * separately, so the QR code, signature and stamp appear seconds after the rest of the page.
 * A rectangle mask is a clip: drop it where the element is already clipped to that box, and
 * turn the rest into clip paths. Empty groups go too, since each would be a transparency group.
 */
function masksToClips(svg: string) {
  const masks = new Map([...svg.matchAll(new RegExp(String.raw`<mask id="([^"]+)">${RECT} fill="#fff"\/><\/mask>`, "g"))].map((m) => [m[1], box(m)]));
  const clips = new Map([...svg.matchAll(new RegExp(String.raw`<clipPath id="([^"]+)">${RECT}\/><\/clipPath>`, "g"))].map((m) => [m[1], box(m)]));
  const asClip = new Set<string>();
  let out = svg.replace(/<(?:g|image|ellipse|rect|path|svg)\b[^>]*\bmask="url\(#([^)]+)\)"[^>]*>/g, (tag, id: string) => {
    const mask = masks.get(id);
    if (!mask) return tag;
    const clipId = tag.match(/\bclip-path="url\(#([^)]+)\)"/)?.[1];
    if (clipId === undefined) {
      asClip.add(id);
      return tag.replace(` mask="url(#${id})"`, ` clip-path="url(#${id}_clip)"`);
    }
    const clip = clips.get(clipId);
    return clip && inside(clip, mask) ? tag.replace(` mask="url(#${id})"`, "") : tag;
  });
  out = out.replace(new RegExp(String.raw`<mask id="([^"]+)">(${RECT}) fill="#fff"\/><\/mask>`, "g"), (all, id: string, rect: string) =>
    asClip.has(id) ? `${all}<clipPath id="${id}_clip">${rect}/></clipPath>` : all);
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(/<g(?:\s[^>]*)?><\/g>/g, "");
  }
  return out;
}

export function svgToPdf(svg: string, page: { width: number; height: number }, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [page.width, page.height], margin: 0, info: { Title: title, Author: "Chamber of Food & Agriculture Pakistan" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const warnings = new Set<string>();
    SVGtoPDF(doc, masksToClips(dropEmptyRects(unwrapGradientPatterns(inlineSvgImages(svg)))), 0, 0, {
      width: page.width, height: page.height, preserveAspectRatio: "xMidYMid meet",
      warningCallback: (w) => warnings.add(w.slice(0, 160)),
    });
    if (warnings.size) console.warn(`[svgToPdf] ${title}:`, [...warnings]);
    doc.end();
  });
}
