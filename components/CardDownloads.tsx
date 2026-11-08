"use client";

import { useState } from "react";
import { Download, ImageDown } from "lucide-react";
import DownloadButton from "@/components/admin/DownloadButton";

/**
 * The card download buttons on the public verification page. The card is drawn on request,
 * which takes a moment, so each button shows its own progress while the rest of the page
 * stays usable.
 */
export default function CardDownloads({ memberId }: { memberId: string }) {
  const [error, setError] = useState("");
  const href = (side: string) => `/api/cards/${memberId}?side=${side}`;

  return (
    <>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <DownloadButton
          href={href("pdf")}
          icon={<Download size={16} aria-hidden />}
          label="Download card"
          busyLabel="Preparing card..."
          spinnerSize={16}
          spinnerClassName="text-white"
          className="btn btn-primary justify-center !min-h-11"
          onError={setError}
        />
        <div className="grid grid-cols-2 sm:flex gap-2">
          {(["front", "back"] as const).map((side) => (
            <DownloadButton
              key={side}
              href={href(side)}
              icon={<ImageDown size={15} aria-hidden />}
              label={side === "front" ? "Front" : "Back"}
              busyLabel="Preparing..."
              spinnerClassName="text-forest"
              className="btn btn-outline justify-center !min-h-11 !px-3.5"
              onError={setError}
            />
          ))}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
    </>
  );
}
