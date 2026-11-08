"use client";

import { useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

async function failureMessage(res: Response) {
  if (res.status === 401) return "Your session has ended. Please sign in again to download.";
  const body = await res.json().catch(() => null);
  return body?.error ?? "The download could not be prepared. Please try again.";
}

/**
 * Fetches a generated file and saves it, showing progress on the button itself.
 * The button can't be pressed again until the file arrives. onError gets the failure
 * message, or "" when a new attempt starts.
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
      const res = await fetch(href);
      if (!res.ok) {
        onError(await failureMessage(res));
        return;
      }
      const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "download";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
