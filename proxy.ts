import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "cfa_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const res     = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
