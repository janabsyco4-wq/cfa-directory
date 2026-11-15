// Lets a download button follow a file it opened as a plain link. Phones and in-app browsers
// open fetched (blob) PDFs in a preview, so buttons link straight to the file, which the
// server sends as an attachment; this cookie tells the button the file arrived or why not.
// Server-only.

import type { NextRequest } from "next/server";

const TOKEN = /^[A-Za-z0-9]{8,32}$/;

/**
 * Wraps a file route. When the request carries `dl=<token>`, the response sets the cookie
 * `dl_<token>`: "ok", or "error:<status>:<message>". A failure is answered with 204 so a
 * download link leaves the page alone and saves nothing. A PDF attachment is sent as
 * octet-stream so the browser saves it instead of opening it.
 */
export function withDownloadSignal<C>(handler: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    const res = await handler(req, ctx);
    const token = req.nextUrl.searchParams.get("dl");
    if (!token || !TOKEN.test(token)) return res;

    const cookie = (value: string) => `dl_${token}=${encodeURIComponent(value)}; Path=/; Max-Age=120; SameSite=Lax`;
    if (res.ok) {
      // Phone browsers (Chrome's PDF viewer, Safari) open a downloaded PDF straight away.
      // Sent as plain data, it is just saved; the .pdf file name still opens it as a PDF.
      if (/^attachment/i.test(res.headers.get("Content-Disposition") ?? "") && res.headers.get("Content-Type") === "application/pdf") {
        res.headers.set("Content-Type", "application/octet-stream");
      }
      res.headers.append("Set-Cookie", cookie("ok"));
      return res;
    }
    const body = await res.json().catch(() => null);
    const message = typeof body?.error === "string" ? body.error.slice(0, 300) : "";
    return new Response(null, { status: 204, headers: { "Set-Cookie": cookie(`error:${res.status}:${message}`), "Cache-Control": "no-store" } });
  };
}
