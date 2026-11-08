import { BadgeCheck, Building2, CalendarCheck, CalendarX, Download, Hash, ImageDown, MapPin, ShieldAlert, ShieldCheck, User } from "lucide-react";
import MemberPhoto from "@/components/MemberPhoto";
import type { PhotoFrame } from "@/lib/photoFrame";

// Everything a public verification may reveal. Contact details and IDs are deliberately absent.
export interface VerificationRecord {
  id: string;
  membershipNo: string;
  name: string;
  photo?: string;
  photoFrame?: PhotoFrame;
  category: string;
  designation?: string;
  organization?: string;
  department?: string;
  district?: string;
  joinedDate?: string;
  expiryDate?: string;
  status: "Active" | "Expired" | "Inactive" | "Pending";
}

const STATUS = {
  Active:   { line: "Active — Valid Membership",     pill: "bg-emerald-600 text-white", text: "text-emerald-700", icon: ShieldCheck },
  Expired:  { line: "Expired — Membership Expired",  pill: "bg-orange-500 text-white",  text: "text-orange-700",  icon: CalendarX },
  Inactive: { line: "Inactive — Membership Inactive", pill: "bg-red-600 text-white",    text: "text-red-700",     icon: ShieldAlert },
  Pending:  { line: "Pending — Not Yet Approved",    pill: "bg-amber-500 text-white",   text: "text-amber-700",   icon: ShieldAlert },
} as const;

function formatDate(iso?: string) {
  return iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" })
    : undefined;
}

export default function VerificationResult({ member, orgName }: { member: VerificationRecord; orgName: string }) {
  const s = STATUS[member.status];
  const details = [
    { icon: Hash,          label: "Membership Number", value: member.membershipNo, mono: true },
    { icon: BadgeCheck,    label: "Category",          value: member.category },
    { icon: User,          label: "Designation",       value: member.designation },
    { icon: Building2,     label: "Organization",      value: [member.organization, member.department].filter(Boolean).join(" · ") },
    { icon: MapPin,        label: "District",          value: member.district },
    { icon: CalendarCheck, label: "Joining Date",      value: formatDate(member.joinedDate) },
    { icon: CalendarX,     label: "Expiry Date",       value: formatDate(member.expiryDate) },
  ].filter((d) => d.value);

  return (
    <article className="animate-rise bg-white border border-line rounded-xl overflow-hidden grid sm:grid-cols-[minmax(0,280px)_1fr]">
      {/* Same centred portrait frame as the member profile page */}
      <div className="flex items-center justify-center bg-canvas px-6 py-8 border-b border-line sm:border-b-0 sm:border-r">
        <div className="w-full max-w-[240px] rounded-xl bg-white p-2 ring-1 ring-line shadow-[0_18px_40px_-24px_rgba(16,59,43,0.55)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-canvas">
            <MemberPhoto src={member.photo} frame={member.photoFrame} alt={member.name} sizes="240px" priority />
            <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow ${s.pill}`}>
              {member.status}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">{orgName}</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink break-words text-balance">{member.name}</h2>
        <p className={`mt-2 inline-flex items-center gap-1.5 text-sm font-bold ${s.text}`}>
          <s.icon size={16} aria-hidden /> {s.line}
        </p>

        <dl className="mt-5 border-t border-line divide-y divide-line">
          {details.map((d) => (
            <div key={d.label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted min-w-0">
                <d.icon size={13} className="shrink-0" aria-hidden /> {d.label}
              </dt>
              <dd className={`text-[15px] font-semibold text-ink text-right break-words min-w-0 ${d.mono ? "font-mono text-sm whitespace-nowrap shrink-0" : ""}`}>{d.value}</dd>
            </div>
          ))}
        </dl>

        {member.status === "Active" && (
          <div className="mt-5 rounded-lg border border-line bg-canvas p-4">
            <p className="text-sm font-bold text-ink">Membership card</p>
            <p className="mt-0.5 text-xs text-muted">Print-ready PDF at standard ID-card size, front and back.</p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <a href={`/api/cards/${member.id}?side=pdf`} download className="btn btn-primary justify-center !min-h-11">
                <Download size={16} aria-hidden /> Download card
              </a>
              <div className="grid grid-cols-2 sm:flex gap-2">
                <a href={`/api/cards/${member.id}?side=front`} download className="btn btn-outline justify-center !min-h-11 !px-3.5">
                  <ImageDown size={15} aria-hidden /> Front
                </a>
                <a href={`/api/cards/${member.id}?side=back`} download className="btn btn-outline justify-center !min-h-11 !px-3.5">
                  <ImageDown size={15} aria-hidden /> Back
                </a>
              </div>
            </div>
          </div>
        )}

        <p className="mt-5 text-xs text-muted">
          Contact details are not shown. This page confirms membership only and is not a member directory.
        </p>
      </div>
    </article>
  );
}
