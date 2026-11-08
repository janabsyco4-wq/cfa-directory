"use client";

import { useState } from "react";
import { CreditCard, FileText, ImageDown, X } from "lucide-react";
import DownloadButton from "@/components/admin/DownloadButton";

const ROW = "flex w-full items-center gap-3 min-h-14 px-4 rounded-xl bg-gray-800 border border-gray-700 text-left text-white text-sm font-semibold active:bg-gray-700 transition";
const ICON = "shrink-0 text-green-400";

/** Phone-sized panel for choosing what to download for one member. Stays open until the file arrives. */
export default function MemberDownloadSheet({
  member, onClose, onError,
}: {
  member: { _id: string; firstName: string; lastName: string; membershipNo: string; photo?: string };
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const [working, setWorking] = useState("");
  const name = `${member.firstName} ${member.lastName}`.trim();
  const close = () => { if (!working) onClose(); };

  const options = [
    { key: "form", label: "Form", hint: "Filled membership form (PDF)", href: `/api/admin/forms/membership?member=${member._id}`, icon: <FileText size={20} className={ICON} aria-hidden /> },
    { key: "card", label: "Card", hint: "Front and back (PDF)", href: `/api/cards/${member._id}?side=pdf`, icon: <CreditCard size={20} className={ICON} aria-hidden /> },
    { key: "picture", label: "Picture", hint: "Member's photo", href: `/api/admin/members/${member._id}/photo`, icon: <ImageDown size={20} className={ICON} aria-hidden /> },
  ];

  return (
    <div className="md:hidden fixed inset-0 z-50 flex items-end bg-black/60" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Download for ${name}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl border-t border-gray-700 bg-gray-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-white text-base font-bold truncate">Download</p>
            <p className="text-gray-500 text-xs truncate">{name} · <span className="font-mono">{member.membershipNo}</span></p>
          </div>
          <button type="button" onClick={close} disabled={!!working} aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((o) => {
            const noPicture = o.key === "picture" && !member.photo;
            return (
              <DownloadButton
                key={o.key}
                href={o.href}
                className={ROW}
                disabled={noPicture || (!!working && working !== o.key)}
                icon={o.icon}
                spinnerSize={20}
                label={
                  <span className="min-w-0">
                    <span className="block">{o.label}</span>
                    <span className="block text-gray-400 text-xs font-normal">{noPicture ? "No picture on record" : o.hint}</span>
                  </span>
                }
                onStart={() => setWorking(o.key)}
                onDone={() => { setWorking(""); onClose(); }}
                onError={onError}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
