// Builds downloadable membership-card files (single images or a two-page print PDF)
// from the uploaded card artwork. Server-only.

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

/** One page per side, each sized to a real ID card in the image's orientation. */
export function buildCardPdf(images: CardImage[], title: string): Buffer {
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
    const pw = landscape ? CARD_LONG_PT : CARD_SHORT_PT;
    const ph = landscape ? CARD_SHORT_PT : CARD_LONG_PT;
    // Fit inside the card without distortion, centred.
    const scale = Math.min(pw / img.width, ph / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const dx = (pw - dw) / 2, dy = (ph - dh) / 2;
    const content = `q ${dw.toFixed(3)} 0 0 ${dh.toFixed(3)} ${dx.toFixed(3)} ${dy.toFixed(3)} cm /Im0 Do Q`;
    const colorSpace = img.components === 1 ? "/DeviceGray" : img.components === 4 ? "/DeviceCMYK /Decode [1 0 1 0 1 0 1 0]" : "/DeviceRGB";

    object(pageId, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`]);
    object(contentId, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
    object(imageId, [
      `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace ${colorSpace} /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.length} >>\nstream\n`,
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
