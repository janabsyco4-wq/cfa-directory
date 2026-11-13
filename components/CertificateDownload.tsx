"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import DownloadButton from "@/components/admin/DownloadButton";

/** Certificate download on the public verification page; progress shows on the button. */
export default function CertificateDownload({ memberId }: { memberId: string }) {
  const [error, setError] = useState("");
  return (
    <>
      <div className="mt-3 flex">
        <DownloadButton
          href={`/api/certificates/${memberId}?format=pdf`}
          icon={<Award size={16} aria-hidden />}
          label="Download certificate"
          busyLabel="Preparing certificate..."
          spinnerClassName="text-forest"
          className="btn btn-outline justify-center !min-h-11 w-full sm:w-auto"
          onError={setError}
        />
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
    </>
  );
}
