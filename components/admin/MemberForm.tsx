"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Loader2, Save, ArrowLeft, Camera } from "lucide-react";

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
  "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition";

export default function MemberForm({ initialData, memberId, mode }: Props) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm]           = useState<MemberFormData>({ ...EMPTY, ...initialData });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [preview, setPreview]     = useState<string>(initialData?.photo ?? "");

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
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

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

    const payload = { ...form, fee: Number(form.fee) };

    try {
      const url    = mode === "new" ? "/api/admin/members" : `/api/admin/members/${memberId}`;
      const method = mode === "new" ? "POST" : "PUT";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
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

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.push("/admin/members")}
          className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {mode === "new" ? "Add New Member" : "Edit Member"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {mode === "new" ? "Fill in all required fields to register a member." : `Editing: ${form.firstName} ${form.lastName}`}
          </p>
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

        {/* Left — photo + membership */}
        <div className="space-y-5">
          {/* Photo upload */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Photo</p>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-gray-800 flex-shrink-0">
                {preview ? (
                  <>
                    <Image src={preview} alt="Preview" fill className="object-cover" sizes="112px" />
                    <button
                      type="button"
                      onClick={() => { setPreview(""); set("photo", ""); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-600 transition"
                    >
                      <X size={11} />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Camera size={24} className="text-gray-600" />
                    <span className="text-gray-600 text-[10px]">No photo</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-gray-700 disabled:opacity-50 transition w-full justify-center"
              >
                <Upload size={14} />
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              <p className="text-gray-600 text-[11px] text-center">JPEG, PNG, WEBP · max 5MB</p>
            </div>
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
              <Field label="CNIC" required>
                <input value={form.cnic} onChange={handleCnic}
                  placeholder="42101-1234567-1" required maxLength={15} className={inputCls} />
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

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/members")}
              className="px-5 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Saving..." : mode === "new" ? "Add Member" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
