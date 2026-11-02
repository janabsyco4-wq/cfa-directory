import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { ACTIVITY_REFRESH_MS, sessionExpiry, sessionOptions, type SessionData } from "@/lib/sessionConfig";

// Admin pages must never be cached (Back after logout), framed, or indexed.
function harden(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

function toLogin(req: NextRequest, reason?: string) {
  const url = new URL("/admin/login", req.url);
  if (reason) url.searchParams.set("reason", reason);
  const res = NextResponse.redirect(url);
  res.cookies.set(sessionOptions.cookieName, "", { path: "/", maxAge: 0 });
  return harden(res);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();
  // Public admin pages: sign-in and owner password reset.
  if (pathname === "/admin/login" || pathname === "/admin/reset") return harden(res);

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  // Sessions from before admins moved into the database carry no userId; send them to sign in again.
  if (!session.isLoggedIn || !session.userId) return toLogin(req);

  const reason = sessionExpiry(session);
  if (reason) return toLogin(req, reason);

  if (Date.now() - session.lastSeen! > ACTIVITY_REFRESH_MS) {
    session.lastSeen = Date.now();
    await session.save();
  }
  return harden(res);
}

export const config = {
  matcher: ["/admin/:path*"],
};
