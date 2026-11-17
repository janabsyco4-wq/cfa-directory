"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { APK_URL } from "@/lib/site";

// Once downloaded, never ask again on this device. "Not now" only hides it for this visit.
const DOWNLOADED_KEY = "cfa-app-downloaded";
const LATER_KEY = "cfa-app-later";

type Mode = "phone" | "computer";

// Offers the Android app in front of the page each time someone opens the site.
// Not shown inside the app itself, on iPhone/iPad (an APK can't install there), or once downloaded.
export default function AppDownloadPrompt() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const primary = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const apple = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const inApp =
      document.documentElement.classList.contains("in-app") ||
      window.matchMedia("(display-mode: standalone)").matches;
    let skip = apple || inApp;
    try {
      skip ||= localStorage.getItem(DOWNLOADED_KEY) === "1" || sessionStorage.getItem(LATER_KEY) === "1";
    } catch {}
    // Decided after mount: the server can't see the device or what this browser remembers.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state once
    if (!skip) setMode(/Android/i.test(ua) ? "phone" : "computer");
  }, []);

  const open = mode !== null;

  useEffect(() => {
    if (!open) return;
    primary.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      try {
        sessionStorage.setItem(LATER_KEY, "1");
      } catch {}
      setMode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  function later() {
    try {
      sessionStorage.setItem(LATER_KEY, "1");
    } catch {}
    setMode(null);
  }

  function onDownload() {
    try {
      localStorage.setItem(DOWNLOADED_KEY, "1");
    } catch {}
    setDownloaded(true);
  }

  return (
    <div className="app:hidden! fixed inset-0 z-[60] overflow-y-auto overscroll-contain">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={downloaded ? () => setMode(null) : later}
        className="fixed inset-0 w-full h-full bg-ink/50 animate-fade"
      />
      {/* Scrolls on short screens instead of cutting the card off. */}
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-3 sm:p-6 pointer-events-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-prompt-title"
        className="pointer-events-auto relative w-full max-w-sm rounded-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 shadow-[0_20px_60px_-15px_rgba(16,40,30,0.5)] animate-rise text-center"
      >
        <button
          type="button"
          onClick={downloaded ? () => setMode(null) : later}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center rounded-full text-muted hover:bg-canvas"
        >
          <X size={18} aria-hidden />
        </button>

        <Image
          src="/icon.png"
          alt=""
          width={64}
          height={64}
          className="mx-auto w-16 h-16 rounded-2xl border border-line object-contain"
        />
        <h2 id="app-prompt-title" className="mt-4 text-xl font-extrabold text-ink">
          {downloaded ? "Almost done" : "Get the CFA Pakistan App"}
        </h2>

        {downloaded ? (
          <>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              {mode === "phone"
                ? "Open the downloaded file to install the app. If your phone asks, allow installing from your browser."
                : "Send the downloaded file to an Android phone and open it there to install the app."}
            </p>
            <button type="button" onClick={() => setMode(null)} className="btn btn-primary w-full mt-6">
              Done
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Search members and verify memberships faster. The app opens even without internet.
            </p>

            {mode === "computer" && (
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-canvas p-3 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG */}
                <img src="/download/app-qr.svg" alt="QR code for the app download" width={96} height={96} className="w-24 h-24 rounded-lg bg-white flex-shrink-0" />
                <p className="text-sm text-ink leading-snug">
                  <span className="font-semibold">Scan with your Android phone</span>
                  <span className="block text-muted mt-1">The app downloads straight to the phone.</span>
                </p>
              </div>
            )}

            <a
              ref={primary}
              href={APK_URL}
              download="CFA-Pakistan.apk"
              onClick={onDownload}
              className="btn btn-primary w-full mt-6"
            >
              <Download size={17} aria-hidden />
              {mode === "computer" ? "Download APK" : "Download App"}
            </a>
            <button type="button" onClick={later} className="mt-2 w-full min-h-11 text-sm font-semibold text-muted hover:text-ink">
              Not now
            </button>
            <p className="mt-1 text-[11px] text-muted">For Android phones · 2.7 MB</p>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
