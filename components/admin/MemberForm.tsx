"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Save, ArrowLeft, Camera, Trash2 } from "lucide-react";
import PhotoFramer from "@/components/admin/PhotoFramer";
import { DEFAULT_FRAME, normalizeFrame, type PhotoFrame } from "@/lib/photoFrame";

export type MemberFormData = {
  membershipNo: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  email: string;
  ntn: string;
  address: string;
  district: string;
  businessName: string;
  businessType: string;
  membershipCategory: string;
  fee: number | string;
  status: string;
  joinedDate: string;
  photo: string;
  photoFrame?: PhotoFrame;
};

const EMPTY: MemberFormData = {
  membershipNo: "", firstName: "", lastName: "", fatherName: "",
  cnic: "", phone: "", email: "", ntn: "", address: "", district: "",
  businessName: "", businessType: "", membershipCategory: "Corporate",
  fee: 30000, status: "Active", joinedDate: new Date().toISOString().split("T")[0],
  photo: "",
};

const CATEGORIES = ["Corporate","Executive","Associate","Overseas","Women","Student","Honorary Member"];
const STATUSES   = ["Active","Inactive","Pending"];
const FEES: Record<string, number> = {
  Corporate: 30000, Executive: 5000, Associate: 2000,
  Overseas: 100, Women: 3000, Student: 0, "Honorary Member": 0,
};

interface Props {
  initialData?: Partial<MemberFormData>;
  memberId?: string;          // present on edit
  mode: "new" | "edit";
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition";

export default function MemberForm({ initialData, memberId, mode }: Props) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]           = useState<MemberFormData>({ ...EMPTY, ...initialData });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [preview, setPreview]     = useState<string>(initialData?.photo ?? "");
  const [frame, setFrame]         = useState<PhotoFrame>(() => normalizeFrame(initialData?.photoFrame));

  function formatCnic(raw: string) {
    // Strip everything except digits, max 13 digits
    const digits = raw.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }

  function formatPhone(raw: string) {
    // Allow + at start, strip other non-digits
    const hasPlus = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    if (!digits) return hasPlus ? "+" : "";
    if (hasPlus) {
      // +92 3XX XXXXXXX
      if (digits.length <= 2) return `+${digits}`;
      if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    // 03XX-XXXXXXX
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  function set(field: keyof MemberFormData, value: string | number) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-fill fee when category changes
      if (field === "membershipCategory") {
        next.fee = FEES[value as string] ?? 0;
      }
      return next;
    });
  }

  function handleCnic(e: ChangeEvent<HTMLInputElement>) {
    set("cnic", formatCnic(e.target.value));
  }

  function handlePhone(e: ChangeEvent<HTMLInputElement>) {
    set("phone", formatPhone(e.target.value));
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setFrame(DEFAULT_FRAME);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      set("photo", json.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(form.photo);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");

    const payload = {
      ...form,
      fee: Number(form.fee),
      photoFrame: form.photo ? frame : undefined,
    };

    try {
      const url    = mode === "new" ? "/api/admin/members" : `/api/admin/members/${memberId}`;
      const method = mode === "new" ? "POST" : "PUT";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (!res.ok) { setError(json.error ?? "Save failed."); return; }

      setSuccess(mode === "new" ? "Member added successfully!" : "Member updated successfully!");
      if (mode === "new") {
        setTimeout(() => router.push("/admin/members"), 1000);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const cancelButton = (
    <button
      type="button"
      onClick={() => router.push("/admin/members")}
      className="flex-1 sm:flex-none min-h-11 px-5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition"
    >
      Cancel
    </button>
  );
  const saveButton = (
    <button
      type="submit"
      disabled={saving || uploading}
      className="flex-[2] sm:flex-none inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
      {saving ? "Saving..." : mode === "new" ? "Add Member" : "Save Changes"}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 lg:sticky lg:top-0 lg:z-20 lg:-mx-4 lg:px-4 lg:py-4 lg:-mt-4 lg:bg-gray-950/90 lg:backdrop-blur">
        <button
          type="button"
          onClick={() => router.push("/admin/members")}
          aria-label="Back to members"
          className="p-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
            {mode === "new" ? "Add New Member" : "Edit Member"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5 truncate">
            {mode === "new" ? "Fill in the required fields to register a member." : `${form.firstName} ${form.lastName}`}
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          {cancelButton}
          {saveButton}
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm mb-6">
          {success}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left — photo + membership (side by side on tablets) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-5 items-start content-start">
          {/* Photo upload + framing */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Photo</p>
              {preview && <span className="text-[11px] text-gray-500">Adjust how it shows</span>}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {preview ? (
              <div className="relative">
                <PhotoFramer src={preview} frame={frame} onChange={setFrame} />
                {uploading && (
                  <div className="absolute inset-0 rounded-xl bg-gray-900/70 flex items-center justify-center gap-2 text-sm text-white">
                    <Loader2 size={18} className="animate-spin" /> Uploading...
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-gray-700 disabled:opacity-50 transition"
                  >
                    <Upload size={14} aria-hidden /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPreview(""); set("photo", ""); setFrame(DEFAULT_FRAME); }}
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50 transition"
                  >
                    <Trash2 size={14} aria-hidden /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/40 px-4 py-8 text-gray-400 hover:border-green-600/60 hover:text-gray-200 disabled:opacity-50 transition"
              >
                {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} aria-hidden />}
                <span className="text-sm font-semibold">{uploading ? "Uploading..." : "Upload photo"}</span>
                <span className="text-[11px] text-gray-500">JPEG, PNG, WEBP · max 5MB</span>
              </button>
            )}
          </div>

          {/* Membership fields */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Membership</p>
            <Field label="Membership No" required>
              <input value={form.membershipNo} onChange={(e) => set("membershipNo", e.target.value)}
                placeholder="CFA-2024-001" required className={inputCls} />
            </Field>
            <Field label="Category" required>
              <select value={form.membershipCategory} onChange={(e) => set("membershipCategory", e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Fee (Rs / USD)">
              <input type="number" value={form.fee} onChange={(e) => set("fee", e.target.value)}
                min={0} className={inputCls} />
            </Field>
            <Field label="Status" required>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Joined Date" required>
              <input type="date" value={form.joinedDate} onChange={(e) => set("joinedDate", e.target.value)}
                required className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Right — personal + business */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal info */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Personal Information</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First Name" required>
                <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Ahmed" required className={inputCls} />
              </Field>
              <Field label="Last Name" required>
                <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Khan" required className={inputCls} />
              </Field>
              <Field label="Father's Name">
                <input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)}
                  placeholder="Muhammad Khan" className={inputCls} />
              </Field>
              <Field label="CNIC" required={mode === "new"}>
                <input value={form.cnic} onChange={handleCnic}
                  placeholder="42101-1234567-1" required={mode === "new"} maxLength={15} className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={handlePhone}
                  placeholder="+92 300 1234567" maxLength={16} className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="member@example.com" className={inputCls} />
              </Field>
              <Field label="NTN">
                <input value={form.ntn} onChange={(e) => set("ntn", e.target.value)}
                  placeholder="1234567-8" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Business + Location */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Business & Location</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business Name">
                <input value={form.businessName} onChange={(e) => set("businessName", e.target.value)}
                  placeholder="AgroFarm Pakistan Pvt Ltd" className={inputCls} />
              </Field>
              <Field label="Business Type">
                <input value={form.businessType} onChange={(e) => set("businessType", e.target.value)}
                  placeholder="Agricultural Farming" className={inputCls} />
              </Field>
              <Field label="District">
                <input value={form.district} onChange={(e) => set("district", e.target.value)}
                  placeholder="Karachi" className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <textarea value={form.address} onChange={(e) => set("address", e.target.value)}
                    placeholder="Plot 45, SITE Area, Karachi" rows={3}
                    className={`${inputCls} resize-none`} />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned save bar so saving never needs a long scroll back down; desktop uses the sticky header instead */}
      <div className="lg:hidden sticky bottom-0 z-20 mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-gray-950/90 backdrop-blur border-t border-gray-800 flex items-center justify-end gap-3">
        <p className="hidden sm:block mr-auto text-xs text-gray-500">
          Fields marked <span className="text-red-400">*</span> are required.
        </p>
        {cancelButton}
        {saveButton}
      </div>
    </form>
  );
}
