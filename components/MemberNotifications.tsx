"use client";

import { useState } from "react";
import { Download, FileBadge, Loader2 } from "lucide-react";
import DownloadButton from "@/components/admin/DownloadButton";
import { notificationState, STATE_LABEL, type NotificationRecord } from "@/lib/notifications";

const PILL = {
  "in-force": "bg-emerald-600 text-white",
  upcoming: "bg-amber-500 text-white",
  ended: "bg-gray-500 text-white",
} as const;

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });
}

/**
 * The document itself, drawn on request. The loading note sits behind the image, which
 * covers it once it arrives (the page is opaque), so no load event is needed.
 */
function Preview({ item }: { item: NotificationRecord }) {
  const src = `/api/notifications/${item.id}?format=preview`;
  return (
    <a href={src} target="_blank" rel="noopener" className="relative block aspect-[1123/794] overflow-hidden rounded-lg border border-line bg-canvas" aria-label={`Open notification ${item.number} full size`}>
      <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-muted" aria-hidden>
        <Loader2 size={16} className="animate-spin text-forest" /> Loading notification...
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated on request, not a static asset */}
      <img
        src={src}
        alt={`Notification ${item.number}: ${item.post}${item.unit ? `, ${item.unit}` : ""}`}
        loading="lazy"
        className="relative h-full w-full object-contain"
      />
    </a>
  );
}

/** Notifications the Chamber has issued to this member, shown on the verification page. */
export default function MemberNotifications({ items }: { items: NotificationRecord[] }) {
  const [error, setError] = useState("");
  return (
    <section id="notifications" className="sm:col-span-2 border-t border-line p-5 sm:p-7 scroll-mt-20">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gold">
        <FileBadge size={14} aria-hidden /> Official notifications
      </p>
      <div className="mt-4 space-y-6">
        {items.map((n) => {
          const state = notificationState(n);
          return (
            <div key={n.id}>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="text-base font-bold text-ink break-words">{n.post}{n.unit ? `, ${n.unit}` : ""}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="font-mono">{n.number}</span> · {formatDay(n.from)} to {formatDay(n.to)}
                  </p>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${PILL[state]}`}>{STATE_LABEL[state]}</span>
              </div>
              <div className="mt-3"><Preview item={n} /></div>
              <div className="mt-3 flex">
                <DownloadButton
                  href={`/api/notifications/${n.id}?format=pdf`}
                  icon={<Download size={16} aria-hidden />}
                  label="Download notification"
                  busyLabel="Preparing notification..."
                  spinnerClassName="text-forest"
                  className="btn btn-outline justify-center !min-h-11 w-full sm:w-auto"
                  onError={setError}
                />
              </div>
            </div>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-700">{error}</p>}
    </section>
  );
}
