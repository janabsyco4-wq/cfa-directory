// Builds downloadable membership-card files (single images or a two-page print PDF)
// from uploaded card artwork or the generated card design. Server-only.

import { deflateSync, inflateSync } from "node:zlib";

// Physical ID-card size (CR80) in PDF points: 3.375 × 2.125 in.
const CARD_LONG_PT = 243;
const CARD_SHORT_PT = 153;

/** Cloudinary delivery URL re-encoded as a high-quality JPEG, capped at 2000px (≈590 DPI on a card). */
function asPrintJpeg(url: string) {
  return url.replace("/upload/", "/upload/f_jpg,q_92,c_limit,w_2000,h_2000/");
}

export interface CardImage {
  data: Buffer;
  width: number;
  height: number;
  components: number;
  /** PDF stream filter: JPEG bytes as-is, or zlib-compressed raw RGB. */
  filter?: "DCTDecode" | "FlateDecode";
}

function jpegInfo(buf: Buffer): { width: number; height: number; components: number } {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // SOF0–SOF15 except DHT (C4), JPG (C8) and DAC (CC) carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), components: buf[i + 9] };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("Unreadable card image");
}

export async function fetchCardImage(url: string): Promise<CardImage> {
  const res = await fetch(asPrintJpeg(url), { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Card image unavailable (${res.status})`);
  const data = Buffer.from(await res.arrayBuffer());
  return { data, ...jpegInfo(data) };
}

/** 8-bit RGB/RGBA PNG (as rendered by the card generator) → RGB pixels on white, ready for the PDF. */
export function pngCardImage(png: Buffer): CardImage {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  const depth = png[24], type = png[25], interlace = png[28];
  if (depth !== 8 || (type !== 2 && type !== 6) || interlace !== 0) throw new Error("Unsupported card image");
  const idat: Buffer[] = [];
  for (let i = 8; i < png.length; ) {
    const len = png.readUInt32BE(i);
    if (png.toString("latin1", i + 4, i + 8) === "IDAT") idat.push(png.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = type === 6 ? 4 : 3, stride = width * bpp;
  const prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
    for (let x = 0, o = y * width * 3; x < width; x++, o += 3) {
      const alpha = bpp === 4 ? cur[x * 4 + 3] / 255 : 1;
      for (let k = 0; k < 3; k++) rgb[o + k] = Math.round(cur[x * bpp + k] * alpha + 255 * (1 - alpha));
    }
    cur.copy(prev);
  }
  return { data: deflateSync(rgb), width, height, components: 3, filter: "FlateDecode" };
}

/** One page per side, each sized to a real ID card in the image's orientation (or to `page` if given). */
export function buildCardPdf(images: CardImage[], title: string, page?: { width: number; height: number }): Buffer {
  const chunks: Buffer[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (part: string | Buffer) => {
    const b = typeof part === "string" ? Buffer.from(part, "latin1") : part;
    chunks.push(b);
    length += b.length;
  };
  const object = (id: number, body: (string | Buffer)[]) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    body.forEach(push);
    push("\nendobj\n");
  };

  // Objects: 1 catalog, 2 pages, 3 info, then 3 per page (page, content, image).
  const pageIds = images.map((_, i) => 4 + i * 3);
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  object(2, [`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${images.length} >>`]);
  object(3, [`<< /Title (${title.replace(/[()\\]/g, "")}) /Producer (CFA Pakistan) >>`]);

  images.forEach((img, i) => {
    const [pageId, contentId, imageId] = [pageIds[i], pageIds[i] + 1, pageIds[i] + 2];
    const landscape = img.width >= img.height;
    const pw = page?.width ?? (landscape ? CARD_LONG_PT : CARD_SHORT_PT);
    const ph = page?.height ?? (landscape ? CARD_SHORT_PT : CARD_LONG_PT);
    // Fit inside the card without distortion, centred.
    const scale = Math.min(pw / img.width, ph / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const dx = (pw - dw) / 2, dy = (ph - dh) / 2;
    const content = `q ${dw.toFixed(3)} 0 0 ${dh.toFixed(3)} ${dx.toFixed(3)} ${dy.toFixed(3)} cm /Im0 Do Q`;
    const colorSpace = img.components === 1 ? "/DeviceGray" : img.components === 4 ? "/DeviceCMYK /Decode [1 0 1 0 1 0 1 0]" : "/DeviceRGB";

    object(pageId, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`]);
    object(contentId, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
    object(imageId, [
      `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace ${colorSpace} /BitsPerComponent 8 /Filter /${img.filter ?? "DCTDecode"} /Length ${img.data.length} >>\nstream\n`,
      img.data,
      "\nendstream",
    ]);
  });

  const count = 4 + images.length * 3;
  const xref = length;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++) push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return Buffer.concat(chunks);
}

export function cardFileName(membershipNo: string, suffix: string) {
  return `${membershipNo.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "membership"}-${suffix}`;
}
