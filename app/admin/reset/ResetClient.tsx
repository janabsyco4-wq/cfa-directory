"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock, Mail, ShieldOff } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition";
const labelCls = "block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5";

function Steps({ enabled }: { enabled: boolean }) {
  return (
    <ol className="space-y-3 text-sm text-gray-300">
      <li className="flex gap-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-gray-800 text-gray-300 text-xs font-bold flex items-center justify-center">1</span>
        <span>
          In <strong className="text-white">Vercel</strong> → your project → <strong className="text-white">Settings → Environment Variables</strong>, add{" "}
          <code className="px-1.5 py-0.5 rounded bg-gray-800 text-green-300 text-xs">ADMIN_RESET_CODE</code> with any secret of at least 16 characters.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-gray-800 text-gray-300 text-xs font-bold flex items-center justify-center">2</span>
        <span><strong className="text-white">Redeploy</strong> the latest deployment so the code takes effect{enabled ? " (done)" : ""}.</span>
      </li>
      <li className="flex gap-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-gray-800 text-gray-300 text-xs font-bold flex items-center justify-center">3</span>
        <span>Enter that code below with a new password.</span>
      </li>
      <li className="flex gap-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-gray-800 text-gray-300 text-xs font-bold flex items-center justify-center">4</span>
        <span>Afterwards <strong className="text-white">delete the variable</strong> and redeploy, which switches reset off again.</span>
      </li>
    </ol>
  );
}

export default function ResetClient({ enabled }: { enabled: boolean }) {
  const [login, setLogin]       = useState("");
  const [code, setCode]         = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [disableMfa, setDisableMfa] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("The new passwords do not match.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, code, newPassword: password, disableMfa }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setDone(true);
      else setError(json.error ?? "Reset failed. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh overflow-y-auto bg-gray-950 flex items-start sm:items-center justify-center p-4 py-8">
      <div className="relative w-full max-w-md">
        <Link href="/admin/login" className="inline-flex items-center gap-2 min-h-11 -ml-1 px-1 mb-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition">
          <ArrowLeft size={16} aria-hidden /> Back to sign in
        </Link>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-green-600/15 flex items-center justify-center">
              <KeyRound size={20} className="text-green-400" aria-hidden />
            </span>
            <div>
              <h1 className="text-white font-extrabold text-xl">Reset admin password</h1>
              <p className="text-gray-500 text-sm">For the website owner only</p>
            </div>
          </div>

          {done ? (
            <div className="mt-6 space-y-4">
              <p className="flex items-start gap-2 text-green-300 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-3">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" aria-hidden />
                Password changed. All devices have been signed out{disableMfa ? " and two-factor sign-in is off" : ""}.
              </p>
              <p className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-3">
                Now delete <code className="text-xs">ADMIN_RESET_CODE</code> in Vercel and redeploy, so nobody else can use it.
              </p>
              <Link href="/admin/login" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition">
                <Lock size={15} aria-hidden /> Sign in with the new password
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6">
                {!enabled && (
                  <p className="mb-4 text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    Reset is switched off. Only the owner can switch it on:
                  </p>
                )}
                <Steps enabled={enabled} />
              </div>

              {enabled && (
                <form onSubmit={submit} className="mt-6 pt-6 border-t border-gray-800 space-y-4">
                  <div>
                    <label htmlFor="login" className={labelCls}>Login email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden />
                      <input id="login" type="email" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" required className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="code" className={labelCls}>Reset code (from Vercel)</label>
                    <input id="code" type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" required className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="pw" className={labelCls}>New password</label>
                    <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required className={inputCls} />
                    <p className="text-gray-500 text-xs mt-1.5">At least 12 characters with upper-case, lower-case, and a number.</p>
                  </div>
                  <div>
                    <label htmlFor="pw2" className={labelCls}>Confirm new password</label>
                    <input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className={inputCls} />
                  </div>
                  <label className="flex items-start gap-3 rounded-xl border border-gray-800 p-3 text-sm text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={disableMfa} onChange={(e) => setDisableMfa(e.target.checked)} className="mt-0.5 h-4 w-4 accent-green-500" />
                    <span>
                      <span className="flex items-center gap-1.5 font-semibold text-white"><ShieldOff size={14} aria-hidden /> Also turn off two-factor sign-in</span>
                      <span className="text-gray-500 text-xs">Only if the authenticator phone is lost.</span>
                    </span>
                  </label>
                  {error && <p role="alert" className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                  <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 disabled:opacity-50 transition">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={15} />}
                    {busy ? "Resetting..." : "Reset password"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
