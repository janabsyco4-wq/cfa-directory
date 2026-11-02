import { cookies } from "next/headers";
import { getIronSession, IronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/sessionConfig";

export { sessionOptions, type SessionData };

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
