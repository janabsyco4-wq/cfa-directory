// Shared by middleware (edge) and route handlers, so no server-only imports here.

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;     // signed out after 30 minutes without activity
export const MAX_SESSION_MS = 8 * 60 * 60 * 1000;  // and after 8 hours no matter what
export const ACTIVITY_REFRESH_MS = 60 * 1000;      // how often activity re-saves the cookie

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
  userId?: string;
  sessionVersion?: number;
  loginAt?: number;
  lastSeen?: number;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "cfa_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // Browser-session cookie: closing the browser signs out. Expiry is enforced by sessionExpiry().
    maxAge: undefined,
  },
};

export type ExpiryReason = "idle" | "expired";

export function sessionExpiry(s: Partial<SessionData>, now = Date.now()): ExpiryReason | null {
  // Sessions from before timeouts existed carry no timestamps; treat them as expired.
  if (!s.loginAt || !s.lastSeen) return "expired";
  if (now - s.loginAt > MAX_SESSION_MS) return "expired";
  if (now - s.lastSeen > IDLE_TIMEOUT_MS) return "idle";
  return null;
}
