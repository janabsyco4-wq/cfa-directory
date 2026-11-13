"use client";

import { useState, type FormEvent } from "react";
import { Award, Eye, FileBadge, Loader2, Send, Trash2 } from "lucide-react";
import DownloadButton from "@/components/admin/DownloadButton";
import DateField from "@/components/admin/DateField";
import { Feedback, Field, inputCls, Panel, primaryBtn, secondaryBtn } from "@/components/admin/FormField";
import {
  HONORIFICS, notificationList, notificationState, RELATIONS, STATE_LABEL,
  type NotificationInput, type NotificationRecord, type Relation,
} from "@/lib/notifications";

export interface DocumentMember {
  membershipNo: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  designation?: string;
  district?: string;
  notifications?: Parameters<typeof notificationList>[0];
}

const STATE_PILL = {
  "in-force": "bg-green-500/15 text-green-400",
  upcoming: "bg-amber-500/15 text-amber-400",
  ended: "bg-gray-700 text-gray-400",
} as const;

/** Calendar day in Pakistan as yyyy-mm-dd. */
function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

/** One year on, less a day: 2026-08-01 → 2027-07-31. */
function yearLater(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });

/** "President, District Jhelum" → post "President", unit "District Jhelum". */
function suggested(m: DocumentMember): NotificationInput {
  const designation = (m.designation ?? "").trim();
  const comma = designation.indexOf(",");
  const post = comma > 0 ? designation.slice(0, comma).trim() : /^(nil|n\/a|-)$/i.test(designation) ? "" : designation;
  const unit = comma > 0 ? designation.slice(comma + 1).trim() : m.district ? `District ${m.district}` : "";
  const from = today();
  return { honorific: "Mr.", relation: "S/O", relativeName: m.fatherName ?? "", post, unit, from, to: yearLater(from) };
}

async function errorOf(res: Response) {
  if (res.status === 401) return "Your session has ended. Please sign in again.";
  return (await res.json().catch(() => null))?.error ?? "Something went wrong. Please try again.";
}

/** Certificate download and the notifications issued to this member, below the edit form. */
export default function MemberDocuments({ memberId, member }: { memberId: string; member: DocumentMember }) {
  const [items, setItems] = useState<NotificationRecord[]>(() => notificationList(member.notifications));
  const [form, setForm] = useState<NotificationInput>(() => suggested(member));
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [certError, setCertError] = useState("");
  const name = `${member.firstName} ${member.lastName}`.trim();
  const set = <K extends keyof NotificationInput>(key: K, value: NotificationInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function issue(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.post.trim()) return setError("Enter the post this member is notified as.");
    if (!form.from || !form.to) return setError("Enter both dates of the period.");
    if (form.to < form.from) return setError("The period must end after it starts.");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/notifications`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) return setError(await errorOf(res));
      const json = await res.json();
      setItems(json.notifications);
      setSuccess(`Notification ${json.number} issued. It now shows on ${name}'s verification page.`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(n: NotificationRecord) {
    if (!window.confirm(`Withdraw notification ${n.number} (${n.post})? It will be removed from the verification page.`)) return;
    setError(""); setSuccess("");
    setRemoving(n.id);
    try {
      const res = await fetch(`/api/admin/members/${memberId}/notifications/${n.id}`, { method: "DELETE" });
      if (!res.ok) return setError(await errorOf(res));
      setItems((await res.json()).notifications);
      setSuccess(`Notification ${n.number} withdrawn.`);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setRemoving("");
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <Panel title="Membership certificate" description="A4 certificate with the seal and signature, drawn from this member's details.">
        <div className="flex flex-wrap gap-2">
          <DownloadButton
            href={`/api/certificates/${memberId}?format=pdf`}
            icon={<Award size={16} />}
            label="Download certificate (PDF)"
            busyLabel="Preparing certificate..."
            spinnerClassName="text-white"
            className={primaryBtn}
            onError={setCertError}
          />
          <a href={`/api/certificates/${memberId}?format=preview`} target="_blank" rel="noopener" className={secondaryBtn}>
            <Eye size={16} /> Preview
          </a>
        </div>
        {certError && <div className="mt-3"><Feedback error={certError} /></div>}
      </Panel>

      <Panel title="Notifications" description="Appoint this member to a post for a period. Each notification shows on their public verification page until you withdraw it.">
        <div className="space-y-4">
          <Feedback error={error} success={success} />

          {items.length > 0 && (
            <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800">
              {items.map((n) => {
                const state = notificationState(n);
                return (
                  <li key={n.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold break-words">{n.post}{n.unit ? `, ${n.unit}` : ""}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        <span className="font-mono">{n.number}</span> · {day(n.from)} to {day(n.to)}
                        <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATE_PILL[state]}`}>{STATE_LABEL[state]}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={`/api/notifications/${n.id}?format=preview`} target="_blank" rel="noopener" title="Preview"
                        className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-green-400 transition" aria-label={`Preview notification ${n.number}`}>
                        <Eye size={16} />
                      </a>
                      <DownloadButton
                        href={`/api/notifications/${n.id}?format=pdf`}
                        icon={<FileBadge size={16} />}
                        ariaLabel={`Download notification ${n.number} (PDF)`}
                        busyLabel={`Preparing notification ${n.number}`}
                        title="Download PDF"
                        className="p-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-green-400 transition"
                        spinnerSize={16}
                        onError={setError}
                      />
                      <button type="button" onClick={() => remove(n)} disabled={!!removing} title="Withdraw"
                        aria-label={`Withdraw notification ${n.number}`}
                        className="p-2.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40 transition">
                        {removing === n.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={issue} className="rounded-xl border border-gray-800 bg-gray-950/40 p-4 space-y-4">
            <p className="text-white text-sm font-bold">Issue a new notification</p>
            <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
              <Field label="Title">
                <select value={form.honorific} onChange={(e) => set("honorific", e.target.value)} className={inputCls}>
                  <option value="">None</option>
                  {HONORIFICS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </Field>
              <Field label="Name">
                <input value={name} disabled className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
              <Field label="Relation" hint="S/O prints “he”; D/O and W/O print “she”.">
                <select value={form.relation} onChange={(e) => set("relation", e.target.value as Relation)} className={inputCls}>
                  {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Father's / husband's name">
                <input value={form.relativeName} onChange={(e) => set("relativeName", e.target.value)} className={inputCls} placeholder="e.g. Yousaf Masih" />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Notified as" required>
                <input value={form.post} onChange={(e) => set("post", e.target.value)} className={inputCls} placeholder="e.g. Vice President (Minority Wing)" required />
              </Field>
              <Field label="Chamber unit" hint="Printed after “Chamber of Food & Agriculture”. Leave blank for the national Chamber.">
                <input value={form.unit} onChange={(e) => set("unit", e.target.value)} className={inputCls} placeholder="e.g. District Sargodha" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" required><DateField value={form.from} onChange={(v) => set("from", v)} required /></Field>
              <Field label="To" required><DateField value={form.to} onChange={(v) => set("to", v)} required min={form.from} /></Field>
            </div>
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {saving ? "Issuing..." : "Issue notification"}
            </button>
          </form>
        </div>
      </Panel>
    </div>
  );
}
