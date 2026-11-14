// Turns rendered A4 documents (certificate, notifications) into download responses. Server-only.

import { NextResponse } from "next/server";
import type { DocFormat } from "@/lib/docArt";

export function docFormat(value: string | null): DocFormat | null {
  const v = value ?? "pdf";
  return v === "pdf" || v === "png" || v === "preview" ? v : null;
}

/** "EMCN 0092 CFAP 0879" + "certificate" → "EMCN-0092-CFAP-0879-certificate" */
export function docBaseName(membershipNo: string, suffix: string) {
  return `${membershipNo.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member"}-${suffix}`;
}

/**
 * A rendered document as a download: the vector A4 PDF, a full-resolution PNG, or a light
 * preview for showing on a web page (which may be cached briefly).
 */
export function docResponse(body: Buffer, format: DocFormat, baseName: string, inline: boolean, cacheable = false) {
  const filename = `${baseName}.${format === "pdf" ? "pdf" : "png"}`;
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": format === "pdf" ? "application/pdf" : "image/png",
      "Content-Disposition": `${inline || format === "preview" ? "inline" : "attachment"}; filename="${filename}"`,
      "Content-Length": String(body.length),
      "Cache-Control": format === "preview" && cacheable ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
