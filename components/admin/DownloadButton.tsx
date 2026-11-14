"use client";

import { useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const GENERIC_FAILURE = "The download could not be prepared. Please try again.";
// Files take up to ~10s to draw; past this the browser may have handed the download to the
// system (in-app browsers do), so the button just stops waiting.
const WAIT_MS = 60_000;

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** The server's "ok" / "error:<status>:<message>" cookie for this download, or null on timeout. */
async function waitForSignal(name: string) {
  const until = Date.now() + WAIT_MS;
  while (Date.now() < until) {
    const value = readCookie(name);
    if (value !== null) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
      return value;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

function failureMessage(signal: string) {
  const [, status, ...rest] = signal.split(":");
  if (status === "401") return "Your session has ended. Please sign in again to download.";
  return rest.join(":") || GENERIC_FAILURE;
}

/**
 * Downloads a generated file, showing progress on the button itself. The button opens the
 * file as a plain link that the server answers as an attachment, because phones and in-app
 * browsers show fetched (blob) PDFs in a preview instead of saving them; a cookie from the
 * server (see lib/downloadSignal) says when the file arrived or why it couldn't be made.
 * The button can't be pressed again meanwhile. onError gets the failure message, or "" when
 * a new attempt starts.
 */
export default function DownloadButton({
  href, icon, label, busyLabel, ariaLabel, title, className, spinnerSize = 15, spinnerClassName = "text-green-400", disabled = false, onStart, onDone, onError,
}: {
  href: string;
  icon: ReactNode;
  label?: ReactNode;
  busyLabel?: string;
  ariaLabel?: string;
  title?: string;
  className: string;
  spinnerSize?: number;
  spinnerClassName?: string;
  disabled?: boolean;
  onStart?: () => void;
  onDone?: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  // State only changes on the next render, too late to stop a fast double click.
  const running = useRef(false);

  async function download() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    onStart?.();
    onError("");
    try {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
      const a = document.createElement("a");
      a.href = `${href}${href.includes("?") ? "&" : "?"}dl=${token}`;
      // Empty: keep the file name the server gives.
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      const signal = await waitForSignal(`dl_${token}`);
      if (signal?.startsWith("error:")) onError(failureMessage(signal));
    } catch {
      onError("The download failed. Check your connection and try again.");
    } finally {
      running.current = false;
      setBusy(false);
      onDone?.();
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy || disabled}
      aria-busy={busy}
      aria-label={busy ? (busyLabel ?? "Preparing download") : ariaLabel}
      title={title}
      className={`${className} disabled:opacity-70 ${busy ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"}`}
    >
      {busy ? <Loader2 size={spinnerSize} className={`animate-spin ${spinnerClassName}`} aria-hidden /> : icon}
      {busy && label ? <span>{busyLabel ?? "Preparing..."}</span> : label}
    </button>
  );
}
