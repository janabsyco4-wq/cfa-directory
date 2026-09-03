import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "cfa_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  return session;
}
