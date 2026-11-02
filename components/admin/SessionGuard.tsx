"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, LogOut } from "lucide-react";

const ACTIVITY_KEY = "cfa-admin-activity";
const PING_EVERY_MS = 60_000;
const WARN_BEFORE_MS = 60_000;

/**
 * Signs the admin out after `idleMs` without activity (in any open admin tab) or when the
 * session's hard limit passes, with a one-minute warning. Activity keeps the server-side idle
 * timer fresh, so long form edits don't expire mid-save.
 */
export default function SessionGuard({ idleMs }: { idleMs: number }) {
  const pathname = usePathname();
  const active = pathname !== "/admin/login";
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef(0);
  const lastPing = useRef(0);
  const expiresAt = useRef<number | null>(null);
  const leaving = useRef(false);

  const signOut = useCallback(async (reason: "idle" | "expired" | "manual") => {
    if (leaving.current) return;
    leaving.current = true;
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.replace(reason === "manual" ? "/admin/login" : `/admin/login?reason=${reason}`);
  }, []);

  const ping = useCallback(async () => {
    lastPing.current = Date.now();
    try {
      const res = await fetch("/api/admin/session", { method: "POST" });
      if (res.status === 401) return void signOut("expired");
      const json = await res.json();
      expiresAt.current = json.expiresAt ?? null;
    } catch {
      // Offline for a moment; the next activity retries.
    }
  }, [signOut]);

  const markActive = useCallback(() => {
    const now = Date.now();
    if (now - lastActivity.current < 2_000) return;
    lastActivity.current = now;
    try { localStorage.setItem(ACTIVITY_KEY, String(now)); } catch { /* storage blocked */ }
    if (now - lastPing.current > PING_EVERY_MS) void ping();
  }, [ping]);

  useEffect(() => {
    if (!active) return;
    leaving.current = false;
    lastActivity.current = Date.now();
    void ping();

    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY && e.newValue) lastActivity.current = Math.max(lastActivity.current, Number(e.newValue));
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));
    window.addEventListener("storage", onStorage);

    const tick = setInterval(() => {
      const now = Date.now();
      if (expiresAt.current && now >= expiresAt.current) return void signOut("expired");
      const left = idleMs - (now - lastActivity.current);
      if (left <= 0) return void signOut("idle");
      setSecondsLeft(left <= WARN_BEFORE_MS ? Math.ceil(left / 1000) : null);
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActive));
      window.removeEventListener("storage", onStorage);
      clearInterval(tick);
    };
  }, [active, idleMs, markActive, ping, signOut]);

  if (!active || secondsLeft === null) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" role="alertdialog" aria-modal="true" aria-labelledby="idle-title" aria-describedby="idle-desc">
      <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Clock size={18} className="text-amber-400" aria-hidden />
          </span>
          <p id="idle-title" className="text-white font-bold">Still there?</p>
        </div>
        <p id="idle-desc" className="mt-3 text-sm text-gray-400">
          For security you will be signed out in <span className="font-semibold text-white tabular-nums">{secondsLeft}s</span> because of inactivity.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => void signOut("manual")}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition"
          >
            <LogOut size={14} aria-hidden /> Sign out
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => { lastPing.current = 0; lastActivity.current = 0; markActive(); setSecondsLeft(null); }}
            className="flex-[1.4] min-h-11 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 transition"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
