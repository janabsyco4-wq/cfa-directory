"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Check, Copy, Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, Mail, ShieldCheck, Smartphone,
} from "lucide-react";
import { Feedback, Field, Panel, inputCls, primaryBtn, secondaryBtn } from "@/components/admin/FormField";
import PhoneField from "@/components/admin/PhoneField";

interface AdminProfile {
  login: string;
  name: string;
  mobile: string;
  whatsapp: string;
  mfaEnabled: boolean;
  recoveryCodesLeft: number;
}

type Result = { ok: boolean; data: Record<string, unknown> & { error?: string } };

async function call(intent: string, payload: Record<string, unknown> = {}): Promise<Result> {
  try {
    const res = await fetch("/api/admin/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent, ...payload }),
    });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, data: { error: "Network error. Please try again." } };
  }
}

const TABS = [
  { id: "profile",  label: "Profile",        icon: Smartphone },
  { id: "password", label: "Password",       icon: KeyRound },
  { id: "email",    label: "Login email",    icon: Mail },
  { id: "security", label: "MFA & security", icon: ShieldCheck },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function ProfileClient() {
  const [tab, setTab]     = useState<Tab>("profile");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((json) => (json.admin ? setAdmin(json.admin) : setError("Unable to load your profile. Please sign in again.")))
      .catch(() => setError("Unable to load your profile. Please sign in again."));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <header>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Profile & Security</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your administrator profile, password, login email, and two-factor authentication.</p>
      </header>

      {!admin ? (
        error ? <Feedback error={error} /> : (
          <div className="flex items-center justify-center min-h-48 gap-3 text-gray-500">
            <Loader2 size={20} className="animate-spin" /> <span className="text-sm">Loading profile...</span>
          </div>
        )
      ) : (
        <>
          <nav role="tablist" aria-label="Account settings" className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap min-h-10 px-3 rounded-xl text-sm font-medium transition ${
                  tab === id ? "bg-green-600/15 text-green-300 ring-1 ring-inset ring-green-500/30" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={15} aria-hidden /> {label}
              </button>
            ))}
          </nav>

          {tab === "profile"  && <ProfileTab admin={admin} onSaved={setAdmin} />}
          {tab === "password" && <PasswordTab login={admin.login} />}
          {tab === "email"    && <EmailTab admin={admin} onSaved={setAdmin} />}
          {tab === "security" && <SecurityTab admin={admin} onSaved={setAdmin} />}
        </>
      )}
    </div>
  );
}

function ProfileTab({ admin, onSaved }: { admin: AdminProfile; onSaved: (a: AdminProfile) => void }) {
  const [name, setName]         = useState(admin.name);
  const [mobile, setMobile]     = useState(admin.mobile);
  const [whatsapp, setWhatsapp] = useState(admin.whatsapp);
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState({ error: "", success: "" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { ok, data } = await call("profile", { name, mobile, whatsapp });
    setBusy(false);
    if (ok && data.admin) {
      onSaved(data.admin as AdminProfile);
      setMsg({ error: "", success: "Profile saved." });
    } else setMsg({ error: data.error ?? "Unable to save profile.", success: "" });
  }

  return (
    <Panel title="Profile details">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputCls} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mobile number">
            <PhoneField label="Mobile number" value={mobile} onChange={setMobile} autoComplete="tel" />
          </Field>
          <Field label="WhatsApp number">
            <PhoneField label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} />
          </Field>
        </div>
        <Field label="Login email">
          <input value={admin.login} disabled className={inputCls} />
        </Field>
        <Feedback {...msg} />
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {busy ? "Saving..." : "Save profile"}
        </button>
      </form>
    </Panel>
  );
}

function PasswordInput({
  label, value, onChange, autoComplete,
}: { label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className={`${inputCls} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-300"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </Field>
  );
}

function PasswordTab({ login }: { login: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState({ error: "", success: "" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) return setMsg({ error: "The new passwords do not match.", success: "" });
    setBusy(true);
    const { ok, data } = await call("password", { currentPassword: current, newPassword: next });
    setBusy(false);
    if (ok) {
      setCurrent(""); setNext(""); setConfirm("");
      setMsg({ error: "", success: "Password changed. Any other signed-in sessions have been signed out." });
    } else setMsg({ error: data.error ?? "Unable to change password.", success: "" });
  }

  return (
    <Panel title="Change password" description="Use at least 12 characters with upper-case, lower-case, and a number.">
      <form onSubmit={submit} className="space-y-4">
        <PasswordInput label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordInput label="New password" value={next} onChange={setNext} autoComplete="new-password" />
        <PasswordInput label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <Feedback {...msg} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {busy ? "Changing..." : "Change password"}
          </button>
          <span className="text-xs text-gray-500">Account: {login}</span>
        </div>
      </form>
    </Panel>
  );
}

function EmailTab({ admin, onSaved }: { admin: AdminProfile; onSaved: (a: AdminProfile) => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState({ error: "", success: "" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { ok, data } = await call("email", { newEmail: email, password });
    setBusy(false);
    if (ok && data.admin) {
      onSaved(data.admin as AdminProfile);
      setEmail(""); setPassword("");
      setMsg({ error: "", success: String(data.message ?? "Login email changed.") });
    } else setMsg({ error: data.error ?? "Unable to change login email.", success: "" });
  }

  return (
    <Panel title="Change login email" description="You will sign in with the new email straight away. Confirm with your current password.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Current login">
          <input value={admin.login} disabled className={inputCls} />
        </Field>
        <Field label="New login email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={inputCls} />
        </Field>
        <PasswordInput label="Current password" value={password} onChange={setPassword} autoComplete="current-password" />
        <Feedback {...msg} />
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
          {busy ? "Saving..." : "Change login email"}
        </button>
      </form>
    </Panel>
  );
}

function SecurityTab({ admin, onSaved }: { admin: AdminProfile; onSaved: (a: AdminProfile) => void }) {
  const [setup, setSetup]       = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode]         = useState("");
  const [codes, setCodes]       = useState<string[] | null>(null);
  const [regenPw, setRegenPw]   = useState("");
  const [disablePw, setDisablePw] = useState("");
  const [busy, setBusy]         = useState(false);
  const [copied, setCopied]     = useState(false);
  const [msg, setMsg]           = useState({ error: "", success: "" });

  async function run(intent: string, payload: Record<string, unknown>, onOk: (data: Record<string, unknown>) => void) {
    setBusy(true);
    setMsg({ error: "", success: "" });
    const { ok, data } = await call(intent, payload);
    setBusy(false);
    if (ok) onOk(data);
    else setMsg({ error: data.error ?? "Something went wrong.", success: "" });
  }

  const startSetup = () => run("totp-setup", {}, (d) => setSetup({ secret: String(d.secret), qr: String(d.qr) }));

  const enable = (e: FormEvent) => {
    e.preventDefault();
    run("totp-enable", { secret: setup?.secret, code }, (d) => {
      onSaved(d.admin as AdminProfile);
      setCodes(d.recoveryCodes as string[]);
      setSetup(null); setCode("");
      setMsg({ error: "", success: "MFA enabled. Save your recovery codes now — they are shown only once." });
    });
  };

  const regenerate = (e: FormEvent) => {
    e.preventDefault();
    run("recovery-regenerate", { password: regenPw }, (d) => {
      onSaved(d.admin as AdminProfile);
      setCodes(d.recoveryCodes as string[]);
      setRegenPw("");
      setMsg({ error: "", success: "New recovery codes generated. The old ones no longer work." });
    });
  };

  const disable = (e: FormEvent) => {
    e.preventDefault();
    run("totp-disable", { password: disablePw }, (d) => {
      onSaved(d.admin as AdminProfile);
      setCodes(null); setDisablePw("");
      setMsg({ error: "", success: "MFA disabled." });
    });
  };

  function copyCodes() {
    if (!codes) return;
    navigator.clipboard.writeText(codes.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Panel
      title="Multi-factor authentication"
      description={admin.mfaEnabled
        ? `MFA is on. Sign-in asks for a code from your authenticator app. ${admin.recoveryCodesLeft} recovery codes left.`
        : "MFA is off. Turn it on with an authenticator app such as Google Authenticator or Microsoft Authenticator."}
    >
      <div className="space-y-5">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
          admin.mfaEnabled ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-gray-800 text-gray-400 border border-gray-700"
        }`}>
          <ShieldCheck size={13} aria-hidden /> {admin.mfaEnabled ? "Enabled" : "Not enabled"}
        </span>

        {codes && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-amber-200">Recovery codes — store them somewhere safe</p>
            <p className="text-xs text-gray-400 mt-1">Each code works once. Use one to sign in if you lose your authenticator device.</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 font-mono text-sm text-white">
              {codes.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <button type="button" onClick={copyCodes} className={`${secondaryBtn} mt-4`}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy codes"}
            </button>
          </div>
        )}

        {!admin.mfaEnabled && !setup && (
          <button type="button" disabled={busy} onClick={startSetup} className={primaryBtn}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            {busy ? "Starting..." : "Enable MFA"}
          </button>
        )}

        {setup && (
          <form onSubmit={enable} className="space-y-4">
            <p className="text-sm text-gray-300">Scan this QR code with your authenticator app, then enter the 6-digit code it shows.</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated server-side */}
            <img src={setup.qr} alt="MFA enrollment QR code" width={200} height={200} className="rounded-xl bg-white p-2" />
            <Field label="Or enter this secret manually">
              <input value={setup.secret} readOnly className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Verification code">
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" required className={`${inputCls} tracking-widest`} />
            </Field>
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {busy ? "Verifying..." : "Verify & enable"}
              </button>
              <button type="button" onClick={() => { setSetup(null); setCode(""); }} className={secondaryBtn}>Cancel</button>
            </div>
          </form>
        )}

        {admin.mfaEnabled && (
          <div className="grid sm:grid-cols-2 gap-4">
            <form onSubmit={regenerate} className="space-y-3 rounded-xl border border-gray-800 p-4">
              <p className="text-sm font-semibold text-white">Regenerate recovery codes</p>
              <input type="password" value={regenPw} onChange={(e) => setRegenPw(e.target.value)} placeholder="Current password" autoComplete="current-password" required className={inputCls} />
              <button type="submit" disabled={busy} className={`${secondaryBtn} w-full`}>Regenerate codes</button>
            </form>
            <form onSubmit={disable} className="space-y-3 rounded-xl border border-gray-800 p-4">
              <p className="text-sm font-semibold text-white">Disable MFA</p>
              <input type="password" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} placeholder="Current password" autoComplete="current-password" required className={inputCls} />
              <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 min-h-11 px-5 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50 transition">
                Disable MFA
              </button>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Sessions</p>
            <p className="text-xs text-gray-500 mt-1">
              You are signed out after 30 minutes of inactivity, after 8 hours, or when the browser closes.
              Signed in somewhere you no longer use? End those sessions now.
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("logout-others", {}, () => setMsg({ error: "", success: "All other devices have been signed out." }))}
            className={`${secondaryBtn} shrink-0`}
          >
            <LogOut size={15} aria-hidden /> Sign out other devices
          </button>
        </div>

        <Feedback {...msg} />
      </div>
    </Panel>
  );
}
