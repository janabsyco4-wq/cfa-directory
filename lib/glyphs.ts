// Reads glyph outlines from a TrueType font so text can be drawn as SVG paths (used for the
// lettering round the seal, which the image renderer can't set on a curve). Server-only.

export interface Glyph {
  /** Outline in font units, y pointing up. */
  d: string;
  /** Advance width in em. */
  advance: number;
}

export interface GlyphSet {
  unitsPerEm: number;
  /** Capital height in font units. */
  capHeight: number;
  glyphs: Record<string, Glyph>;
}

/** Outlines for the given characters (simple TrueType glyphs; composites are skipped). */
export function readGlyphs(font: Buffer, chars: string): GlyphSet {
  const tables: Record<string, number> = {};
  for (let i = 0, n = font.readUInt16BE(4); i < n; i++) {
    const o = 12 + i * 16;
    tables[font.toString("latin1", o, o + 4)] = font.readUInt32BE(o + 8);
  }
  const unitsPerEm = font.readUInt16BE(tables.head + 18);
  const longLoca = font.readInt16BE(tables.head + 50) === 1;
  const numHMetrics = font.readUInt16BE(tables.hhea + 34);
  const capHeight = tables["OS/2"] && font.readUInt16BE(tables["OS/2"]) >= 2 ? font.readInt16BE(tables["OS/2"] + 88) : unitsPerEm * 0.7;

  // cmap format 4 (BMP)
  let sub = 0;
  for (let i = 0, n = font.readUInt16BE(tables.cmap + 2); i < n; i++) {
    const off = tables.cmap + font.readUInt32BE(tables.cmap + 4 + i * 8 + 4);
    if (font.readUInt16BE(off) === 4) { sub = off; break; }
  }
  const segs = font.readUInt16BE(sub + 6) / 2;
  const ends = sub + 14, starts = ends + segs * 2 + 2, deltas = starts + segs * 2, ranges = deltas + segs * 2;
  const glyphIndex = (code: number) => {
    for (let i = 0; i < segs; i++) {
      if (code > font.readUInt16BE(ends + i * 2)) continue;
      const start = font.readUInt16BE(starts + i * 2);
      if (code < start) return 0;
      const delta = font.readInt16BE(deltas + i * 2), range = font.readUInt16BE(ranges + i * 2);
      if (!range) return (code + delta) & 0xffff;
      const g = font.readUInt16BE(ranges + i * 2 + range + (code - start) * 2);
      return g ? (g + delta) & 0xffff : 0;
    }
    return 0;
  };
  const loca = (g: number) => (longLoca ? font.readUInt32BE(tables.loca + g * 4) : font.readUInt16BE(tables.loca + g * 2) * 2);

  function outline(g: number) {
    const start = tables.glyf + loca(g);
    if (loca(g + 1) === loca(g)) return ""; // empty (e.g. space)
    const contours = font.readInt16BE(start);
    if (contours <= 0) return ""; // composite glyph
    const endPts: number[] = [];
    for (let i = 0; i < contours; i++) endPts.push(font.readUInt16BE(start + 10 + i * 2));
    const count = endPts[contours - 1] + 1;
    let p = start + 10 + contours * 2;
    p += 2 + font.readUInt16BE(p); // skip instructions
    const flags: number[] = [];
    while (flags.length < count) {
      const flag = font[p++];
      flags.push(flag);
      if (flag & 8) for (let r = font[p++]; r > 0; r--) flags.push(flag);
    }
    const coords = (short: number, same: number) => {
      const out: number[] = [];
      let v = 0;
      for (const flag of flags) {
        if (flag & short) { const d = font[p++]; v += flag & same ? d : -d; }
        else if (!(flag & same)) { v += font.readInt16BE(p); p += 2; }
        out.push(v);
      }
      return out;
    };
    const xs = coords(2, 16), ys = coords(4, 32);

    // Quadratic contours → path, adding the implied on-curve points between two off-curve ones.
    let d = "";
    let first = 0;
    for (const last of endPts) {
      const pts = [];
      for (let i = first; i <= last; i++) pts.push({ x: xs[i], y: ys[i], on: (flags[i] & 1) === 1 });
      first = last + 1;
      if (!pts.length) continue;
      const startIdx = pts.findIndex((q) => q.on);
      const begin = startIdx >= 0 ? pts[startIdx] : { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2, on: true };
      const ordered = startIdx >= 0 ? [...pts.slice(startIdx + 1), ...pts.slice(0, startIdx + 1)] : [...pts, pts[0]];
      d += `M${begin.x} ${begin.y}`;
      let ctrl: { x: number; y: number } | null = null;
      for (const q of ordered) {
        if (q.on) {
          d += ctrl ? `Q${ctrl.x} ${ctrl.y} ${q.x} ${q.y}` : `L${q.x} ${q.y}`;
          ctrl = null;
        } else {
          if (ctrl) {
            const mx = (ctrl.x + q.x) / 2, my = (ctrl.y + q.y) / 2;
            d += `Q${ctrl.x} ${ctrl.y} ${mx} ${my}`;
          }
          ctrl = q;
        }
      }
      if (ctrl) d += `Q${ctrl.x} ${ctrl.y} ${begin.x} ${begin.y}`;
      d += "Z";
    }
    return d;
  }

  const glyphs: Record<string, Glyph> = {};
  for (const ch of new Set(chars)) {
    const g = glyphIndex(ch.codePointAt(0)!);
    const advance = font.readUInt16BE(tables.hmtx + Math.min(g, numHMetrics - 1) * 4) / unitsPerEm;
    glyphs[ch] = { d: g ? outline(g) : "", advance };
  }
  return { unitsPerEm, capHeight, glyphs };
}
