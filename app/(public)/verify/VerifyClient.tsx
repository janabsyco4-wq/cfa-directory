"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, IdCard, Loader2, SearchX, ShieldCheck, TriangleAlert } from "lucide-react";
import VerificationResult, { type VerificationRecord } from "@/components/VerificationResult";
import { formatMemberNo } from "@/lib/memberNumber";

type Mode = "card" | "cnic";
type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; member: VerificationRecord }
  | { kind: "notfound" }
  | { kind: "error"; message: string };

function formatCnic(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

const MODES: { value: Mode; label: string; icon: typeof CreditCard }[] = [
  { value: "card", label: "Membership Card Number", icon: CreditCard },
  { value: "cnic", label: "CNIC Number",            icon: IdCard },
];

export default function VerifyClient({ orgName }: { orgName: string }) {
  const [mode, setMode]   = useState<Mode>("card");
  const [card, setCard]   = useState("");
  const [cnic, setCnic]   = useState("");
  const [hint, setHint]   = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  function switchMode(next: Mode) {
    setMode(next);
    setHint("");
    setState({ kind: "idle" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setHint("");
    const value = mode === "cnic" ? cnic : card.trim();
    if (mode === "cnic" && !/^\d{5}-\d{7}-\d$/.test(value)) return setHint("Enter a valid CNIC in the format XXXXX-XXXXXXX-X.");
    if (mode === "card" && value.replace(/[^a-z0-9]/gi, "").length < 3) return setHint("Enter a membership card number.");

    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/members/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, value }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 404) setState({ kind: "notfound" });
      else if (!res.ok) setState({ kind: "error", message: json.error ?? "Something went wrong. Please try again shortly." });
      else setState({ kind: "found", member: json.member });
    } catch {
      setState({ kind: "error", message: "Something went wrong. Please try again shortly." });
    }
  }

  const loading = state.kind === "loading";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <form onSubmit={submit} noValidate className="animate-rise bg-white border border-line rounded-lg p-4 sm:p-6">
        <div role="group" aria-label="Search method" className="grid grid-cols-2 gap-1 rounded-md bg-canvas border border-line p-1">
          {MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => switchMode(value)}
              className={`flex items-center justify-center gap-2 min-h-11 rounded px-2 text-[13px] sm:text-sm font-semibold transition ${
                mode === value ? "bg-forest text-white shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Icon size={15} aria-hidden className="hidden sm:block" /> {label}
            </button>
          ))}
        </div>

        <label htmlFor="verify-input" className="block mt-5 text-sm font-bold text-ink">
          {mode === "card" ? "Membership Card Number" : "CNIC Number"}
        </label>
        <p className="text-muted text-xs mt-0.5 mb-3">
          {mode === "card" ? "Printed on the front of the membership card." : "Format: 42101-1234567-1"}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input
            id="verify-input"
            key={mode}
            type="text"
            inputMode={mode === "cnic" ? "numeric" : "text"}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={mode === "card" ? card : cnic}
            onChange={(e) => (mode === "card" ? setCard(formatMemberNo(e.target.value)) : setCnic(formatCnic(e.target.value)))}
            placeholder={mode === "card" ? "EMCN 0092 CFAP 0792" : "XXXXX-XXXXXXX-X"}
            maxLength={mode === "cnic" ? 15 : 19}
            aria-invalid={!!hint}
            aria-describedby={hint ? "verify-hint" : undefined}
            className="flex-1 px-4 py-3 rounded-md border border-line bg-white text-base sm:text-sm text-ink font-mono tracking-wide placeholder:text-muted/70 placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-forest/15 focus:border-forest transition"
          />
          <button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ShieldCheck size={16} aria-hidden />}
            {loading ? "Verifying..." : "Verify Member"}
          </button>
        </div>
        {hint && <p id="verify-hint" role="alert" className="mt-2 text-sm text-red-700">{hint}</p>}
      </form>

      <div aria-live="polite">
        {state.kind === "found" && <VerificationResult key={state.member.id} member={state.member} orgName={orgName} />}

        {state.kind === "loading" && (
          <div className="bg-white border border-line rounded-xl overflow-hidden grid sm:grid-cols-[220px_1fr]" aria-hidden>
            <div className="h-64 sm:h-[300px] skeleton" />
            <div className="p-6 space-y-3">
              <div className="h-4 w-1/3 skeleton rounded" />
              <div className="h-8 w-2/3 skeleton rounded" />
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-9 skeleton rounded" />)}
            </div>
          </div>
        )}

        {(state.kind === "notfound" || state.kind === "error") && (
          <div className="animate-rise bg-white border border-line rounded-lg p-6 sm:p-8 text-center">
            {state.kind === "notfound"
              ? <SearchX size={28} className="mx-auto text-red-600" aria-hidden />
              : <TriangleAlert size={28} className="mx-auto text-amber-600" aria-hidden />}
            <h2 className="mt-3 text-lg font-extrabold text-ink">
              {state.kind === "notfound" ? "No matching membership record found" : "Unable to verify right now"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {state.kind === "notfound"
                ? "Check the number and try again. If the issue persists, contact the Chamber."
                : state.message}
            </p>
          </div>
        )}

        {state.kind === "idle" && (
          <div className="text-center py-10 sm:py-14">
            <div className="w-16 h-16 rounded-2xl bg-forest/5 border border-forest/15 flex items-center justify-center mx-auto">
              <ShieldCheck size={26} className="text-forest" aria-hidden />
            </div>
            <p className="mt-4 text-ink font-bold">Membership status in seconds</p>
            <p className="mt-1.5 text-muted text-sm max-w-sm mx-auto leading-relaxed">
              Results show the member&apos;s name, photo, category and validity. Phone numbers, email, CNIC and address stay private.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
