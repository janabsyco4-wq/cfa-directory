"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Lock, User, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

const REASONS: Record<string, string> = {
  idle: "You were signed out after 30 minutes of inactivity.",
  expired: "Your session has ended. Please sign in again.",
};

export default function LoginClient({ reason }: { reason?: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, code: needsCode ? code : undefined }),
      });
      const json = await res.json();
      if (json.mfaRequired) setNeedsCode(true);
      if (!res.ok || json.mfaRequired) {
        setError(json.error ?? "");
        setLoading(false);
        return;
      }

      // Success - redirect to admin dashboard
      window.location.href = "/admin";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-11 -ml-1 px-1 mb-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white focus-visible:outline-2 focus-visible:outline-green-500 transition"
        >
          <ArrowLeft size={16} aria-hidden /> Back to website
        </Link>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-green-500/30 mb-4">
              <Image src="/logo.avif" alt="CFA" width={64} height={64} className="object-contain w-full h-full" />
            </div>
            <h1 className="text-white font-extrabold text-xl tracking-tight">CFA Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Chamber of Food & Agriculture Pakistan</p>
          </div>

          {reason && REASONS[reason] && !error && (
            <p role="status" className="mb-4 text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {REASONS[reason]}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login */}
            <div className={needsCode ? "hidden" : undefined}>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email or username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className={needsCode ? "hidden" : undefined}>
              <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-300 transition"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Second factor */}
            {needsCode && (
              <div>
                <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Authentication code
                </label>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm tracking-widest placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1.5">
                  Enter the 6-digit code from your authenticator app, or a recovery code.
                </p>
                <button
                  type="button"
                  onClick={() => { setNeedsCode(false); setCode(""); setError(""); }}
                  className="text-xs text-gray-400 hover:text-white mt-2"
                >
                  Use a different account
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password || (needsCode && !code)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
              {loading ? "Signing in..." : needsCode ? "Verify & Sign In" : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center">
            <Link href="/admin/reset" className="text-sm text-gray-400 hover:text-white underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Protected admin area · cfapak.org
        </p>
      </div>
    </div>
  );
}
