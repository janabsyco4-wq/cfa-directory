"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { Feedback, Field, Panel, inputCls, primaryBtn } from "@/components/admin/FormField";
import type { OrgSettings } from "@/lib/organization";

type RuleKey = Extract<keyof OrgSettings, `require${string}`>;
type TextKey = Exclude<keyof OrgSettings, RuleKey>;

const DETAILS: [TextKey, string, string][] = [
  ["organizationName", "Organization name", "Chamber of Food & Agriculture Pakistan"],
  ["telephone",        "Telephone number",  "042 35491348"],
  ["email",            "Email address",     "info@cfapak.org"],
  ["website",          "Website URL",       "https://www.cfapak.org"],
  ["presidentTitle",   "President's title", "Ch. Shaukat Ali Chadhar"],
];

const RULES: [RuleKey, string][] = [
  ["requireCnic",     "CNIC"],
  ["requireMobile",   "Mobile number"],
  ["requireWhatsapp", "WhatsApp number"],
  ["requireAddress",  "Address"],
];

export default function OrganizationClient() {
  const [org, setOrg]         = useState<OrgSettings | null>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/organization")
      .then((r) => r.json())
      .then((json) => (json.settings ? setOrg(json.settings) : setError(json.error ?? "Unable to load organization settings.")))
      .catch(() => setError("Unable to load organization settings."));
  }, []);

  function set<K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) {
    setOrg((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!org) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(org),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Unable to save settings.");
      else {
        setOrg(json.settings);
        setSuccess("Organization settings saved. The website footer and contact page now use these details.");
      }
    } catch {
      setError("Unable to save settings.");
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!org) {
    return error ? (
      <div className="max-w-md mx-auto mt-10"><Feedback error={error} /></div>
    ) : (
      <div className="flex items-center justify-center min-h-64 gap-3 text-gray-500">
        <Loader2 size={20} className="animate-spin" /> <span className="text-sm">Loading settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Organization Setup</h1>
          <p className="text-gray-500 text-sm mt-0.5">Chamber identity, reused across the public website.</p>
        </div>
        <button type="submit" disabled={saving} className={`${primaryBtn} max-sm:hidden`}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save settings"}
        </button>
      </header>

      <Feedback error={error} success={success} />

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-5">
          <Panel title="Official details" description="Shown in the website footer, contact page and search listings.">
            <div className="grid sm:grid-cols-2 gap-4">
              {DETAILS.map(([key, label, placeholder]) => (
                <Field key={key} label={label}>
                  <input
                    value={org[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    type={key === "email" ? "email" : "text"}
                    className={inputCls}
                  />
                </Field>
              ))}
              <div className="sm:col-span-2">
                <Field label="Official address">
                  <textarea value={org.address} onChange={(e) => set("address", e.target.value)}
                    rows={2} placeholder="560, Jasmine Block, Bahria Town, Lahore" className={`${inputCls} resize-none`} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="President's designation" hint="Two lines shown under the President's title. Use a line break to separate them.">
                  <textarea value={org.presidentDesignation} onChange={(e) => set("presidentDesignation", e.target.value)}
                    rows={2} className={`${inputCls} resize-none`} />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Brand colors">
            <div className="grid sm:grid-cols-2 gap-4">
              {(["brandPrimary", "brandAccent"] as const).map((key) => (
                <Field key={key} label={key === "brandPrimary" ? "Primary" : "Accent"}>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      aria-label={`${key === "brandPrimary" ? "Primary" : "Accent"} color picker`}
                      value={/^#[0-9a-f]{6}$/i.test(org[key]) ? org[key] : "#1f7a3a"}
                      onChange={(e) => set(key, e.target.value)}
                      className="h-[42px] w-12 shrink-0 rounded-xl bg-gray-800 border border-gray-700 p-1 cursor-pointer"
                    />
                    <input value={org[key]} onChange={(e) => set(key, e.target.value)} placeholder="#1f7a3a" className={inputCls} />
                  </div>
                </Field>
              ))}
            </div>
          </Panel>

          <Panel title="Member form rules" description="Choose which private details are required when adding or editing a member.">
            <div className="grid sm:grid-cols-2 gap-2">
              {RULES.map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 min-h-11 px-3 rounded-xl bg-gray-800/60 border border-gray-700 text-sm text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={org[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="h-4 w-4 accent-green-500"
                  />
                  {label} required
                </label>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-5">
          <Panel title="Organization logo">
            <ImageUploadField
              label="Logo"
              kind="brand"
              aspect="aspect-square"
              transparent
              value={org.logo}
              onChange={(url) => set("logo", url)}
              onError={setError}
              hint="Used in the website footer. A transparent PNG works best."
            />
          </Panel>
          <Panel title="President's signature">
            <ImageUploadField
              label="Signature"
              kind="brand"
              aspect="aspect-[3/1]"
              transparent
              value={org.signature}
              onChange={(url) => set("signature", url)}
              onError={setError}
              hint="Kept on file with the chamber's official details. A transparent PNG is recommended."
            />
          </Panel>
        </div>
      </div>

      <div className="sm:hidden sticky bottom-0 z-20 -mx-4 px-4 py-3 bg-gray-950/90 backdrop-blur border-t border-gray-800">
        <button type="submit" disabled={saving} className={`${primaryBtn} w-full`}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
