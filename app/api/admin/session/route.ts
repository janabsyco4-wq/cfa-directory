import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSession } from "@/lib/session";
import { IDLE_TIMEOUT_MS, MAX_SESSION_MS } from "@/lib/sessionConfig";

// Keep-alive for the admin UI: activity in the browser refreshes the server-side idle timer.
export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await getSession();
  return NextResponse.json(
    { idleTimeoutMs: IDLE_TIMEOUT_MS, expiresAt: (session.loginAt ?? Date.now()) + MAX_SESSION_MS },
    { headers: { "Cache-Control": "no-store" } }
  );
}
