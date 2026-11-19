"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import DownloadButton from "@/components/admin/DownloadButton";
import { DocumentPreview } from "@/components/DocumentViewer";

/** Certificate preview (tap to zoom) and download on the public verification page. */
export default function CertificateDownload({ memberId, name }: { memberId: string; name: string }) {
  const [error, setError] = useState("");
  return (
    <>
      <div className="mt-3">
        <DocumentPreview
          src={`/api/certificates/${memberId}?format=preview`}
          sharpSrc={`/api/certificates/${memberId}?format=png&view=1`}
          alt={`Membership certificate of ${name}`}
          loadingLabel="Loading certificate..."
        />
      </div>
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
