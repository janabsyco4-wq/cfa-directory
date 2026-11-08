"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, CreditCard, Download, ExternalLink,
  Copy, Loader2, Pencil, Printer, QrCode, Search, X,
} from "lucide-react";
import MemberAvatar from "@/components/admin/MemberAvatar";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { Feedback, primaryBtn, secondaryBtn } from "@/components/admin/FormField";
import type { PhotoFrame } from "@/lib/photoFrame";
import { cardTier } from "@/lib/cardTier";

interface CardMember {
  _id: string;
  membershipNo: string;
  firstName: string;
  lastName: string;
  membershipCategory: string;
  status: string;
  photo: string;
  photoFrame?: PhotoFrame;
  cardFront?: string;
  cardBack?: string;
}

type ListData = { members: CardMember[]; total: number; totalPages: number };

/** The card as members get it (uploaded artwork if any, else the generated design). */
function CardPreview({ src, label }: { src: string; label: string }) {
  const [loaded, setLoaded] = useState<string>("");
  return (
    <div className="relative aspect-[1.586] overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={src} src={src} alt={label} onLoad={() => setLoaded(src)}
        className={`h-full w-full object-contain transition-opacity ${loaded === src ? "opacity-100" : "opacity-0"}`} />
      {loaded !== src && (
        <div className="absolute inset-0 grid place-items-center text-gray-500">
          <Loader2 size={22} className="animate-spin" aria-label="Preparing card" />
        </div>
      )}
    </div>
  );
}

/** Public /verify link for this member, plus a QR code to place on the card artwork. */
function VerificationLink({ memberId, fileBase }: { memberId: string; fileBase: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy]     = useState(false);
  const url = typeof window === "undefined" ? `/verify/${memberId}` : `${window.location.origin}/verify/${memberId}`;

  async function downloadQr() {
    setBusy(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const a = document.createElement("a");
      a.href = await QRCode.toDataURL(url, { width: 1024, margin: 2, errorCorrectionLevel: "M" });
      a.download = `${fileBase.replace(/[^A-Za-z0-9_-]+/g, "_")}_verify_qr.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Verification link</p>
      <p className="text-gray-500 text-xs mt-1">The QR code on the back of the card opens this page, so anyone can scan it to confirm the membership.</p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input readOnly value={url} aria-label="Verification link" onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 px-3.5 min-h-10 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-mono" />
        <div className="grid grid-cols-3 sm:flex gap-2">
          <button type="button" className={`${secondaryBtn} !min-h-10 !px-3`}
            onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={downloadQr} disabled={busy} className={`${secondaryBtn} !min-h-10 !px-3`}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />} QR code
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className={`${secondaryBtn} !min-h-10 !px-3`}>
            <ExternalLink size={14} /> Open
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CardsClient({ initialMemberId }: { initialMemberId?: string }) {
  const [search, setSearch]       = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage]           = useState(1);
  // Each response is tagged with the query it answers, so "loading" is simply "tag differs".
  const [list, setList]           = useState<{ key: string; data: ListData | null } | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialMemberId);
  const [loaded, setLoaded]       = useState<{ id: string; member: CardMember | null; error: string } | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
  // Bumped after an upload change so the previews reload.
  const [version, setVersion]     = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const listKey = `${page}|${debounced}`;
  useEffect(() => {
    let cancelled = false;
    const key = `${page}|${debounced}`;
    const p = new URLSearchParams({ page: String(page), limit: "20", search: debounced });
    fetch(`/api/admin/members?${p}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data) => { if (!cancelled) setList({ key, data }); });
    return () => { cancelled = true; };
  }, [page, debounced]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    fetch(`/api/admin/members/${selectedId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setLoaded({ id: selectedId, member: json.member ?? null, error: json.member ? "" : "Member not found." });
      })
      .catch(() => { if (!cancelled) setLoaded({ id: selectedId, member: null, error: "Failed to load member." }); });
    window.history.replaceState(null, "", `/admin/cards?member=${selectedId}`);
    return () => { cancelled = true; };
  }, [selectedId]);

  const listData  = list?.data ?? null;
  const loading   = list?.key !== listKey;
  const current   = loaded && loaded.id === selectedId ? loaded : null;
  const selected  = current?.member ?? null;
  const loadError = current?.error ?? "";

  function selectMember(id: string | undefined) {
    setSelectedId(id);
    setError("");
    setSaved(false);
  }

  async function saveSide(side: "cardFront" | "cardBack", url: string) {
    if (!selected) return;
    const id = selected._id;
    const previous = selected[side] ?? "";
    const apply = (value: string) =>
      setLoaded((l) => (l?.member && l.id === id ? { ...l, member: { ...l.member, [side]: value } } : l));

    apply(url);
    setSaving(true); setSaved(false); setError("");
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [side]: url }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Unable to save the card.");
      setSaved(true);
      setVersion((v) => v + 1);
      setList((prev) => prev?.data ? {
        ...prev,
        data: { ...prev.data, members: prev.data.members.map((m) => (m._id === id ? { ...m, [side]: url } : m)) },
      } : prev);
    } catch (err) {
      apply(previous);
      setError(err instanceof Error ? err.message : "Unable to save the card.");
    } finally {
      setSaving(false);
    }
  }

  const name = selected ? `${selected.firstName} ${selected.lastName}`.trim() : "";
  const fileBase = selected ? `${selected.membershipNo}_${name}` : "";
  const cardUrl = (side: "front" | "back") => (selected ? `/api/cards/${selected._id}?side=${side}&view=1&v=${version}` : "");
  const tier = selected ? cardTier(selected.membershipCategory) : "silver";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Print-only sheet: both sides at CR80 size (3.375in on the long edge). */}
      <style>{`
        @media print {
          @page { margin: 0.5in; }
          body * { visibility: hidden !important; }
          #card-print, #card-print * { visibility: visible !important; }
          #card-print { position: absolute; inset: 0; display: flex !important; flex-direction: column; align-items: center; gap: 0.4in; padding-top: 0.25in; }
          #card-print img { max-width: 3.375in; max-height: 3.375in; }
        }
      `}</style>
      {selected && (
        <div id="card-print" className="hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardUrl("front")} alt="Card front" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardUrl("back")} alt="Card back" />
        </div>
      )}

      <header className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Membership Cards</h1>
        <p className="text-gray-500 text-sm mt-0.5">Every member&apos;s card is made automatically from their details: gold for Associate and Student members, silver for everyone else.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-5 items-start">
        {/* Member picker */}
        <section className={`bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden ${selectedId ? "hidden lg:block" : ""}`}>
          <div className="p-3 space-y-2 border-b border-gray-800">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or member no."
                aria-label="Search members"
                className="w-full pl-9 pr-10 min-h-11 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-300">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <ul className="divide-y divide-gray-800 lg:max-h-[calc(100dvh-16rem)] overflow-y-auto">
            {loading && !listData ? (
              [...Array(6)].map((_, i) => (
                <li key={i} className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-800 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-2/3 bg-gray-800 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-gray-800 rounded animate-pulse" />
                  </div>
                </li>
              ))
            ) : !listData ? (
              <li className="text-center text-red-400 py-12 text-sm">Could not load members. Refresh to try again.</li>
            ) : listData.members.length === 0 ? (
              <li className="text-center text-gray-500 py-12 text-sm">No members match this view.</li>
            ) : (
              listData.members.map((m) => {
                const custom = !!(m.cardFront || m.cardBack);
                const gold = cardTier(m.membershipCategory) === "gold";
                const active = m._id === selectedId;
                return (
                  <li key={m._id}>
                    <button
                      type="button"
                      onClick={() => selectMember(m._id)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition ${active ? "bg-green-600/10" : "hover:bg-gray-800/60"}`}
                    >
                      <MemberAvatar photo={m.photo} frame={m.photoFrame} firstName={m.firstName} lastName={m.lastName} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-100">{m.firstName} {m.lastName}</span>
                        <span className="block truncate font-mono text-[11px] text-gray-500">{m.membershipNo}</span>
                      </span>
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        custom ? "bg-sky-500/10 text-sky-300" : gold ? "bg-amber-500/10 text-amber-300" : "bg-gray-800 text-gray-300"
                      }`}>
                        <CreditCard size={11} aria-hidden /> {custom ? "Custom" : gold ? "Gold" : "Silver"}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {listData && listData.totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-800">
              <p className="text-gray-500 text-xs">Page {page} of {listData.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page"
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPage((p) => Math.min(listData.totalPages, p + 1))} disabled={page === listData.totalPages} aria-label="Next page"
                  className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 transition">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Card workspace */}
        <section className={`bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 ${selectedId ? "" : "hidden lg:block"}`}>
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center text-center py-20 text-gray-500">
              <CreditCard size={32} aria-hidden />
              <p className="mt-3 text-sm font-semibold text-gray-300">Select a member</p>
              <p className="mt-1 text-xs">Choose a member on the left to see, download or print their card.</p>
            </div>
          ) : !selected ? (
            loadError ? <Feedback error={loadError} /> : (
              <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
                <Loader2 size={20} className="animate-spin" /> <span className="text-sm">Loading member...</span>
              </div>
            )
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => selectMember(undefined)} aria-label="Back to member list"
                  className="lg:hidden p-2.5 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition">
                  <ArrowLeft size={18} />
                </button>
                <MemberAvatar photo={selected.photo} frame={selected.photoFrame} firstName={selected.firstName} lastName={selected.lastName} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-white">{name}</p>
                  <p className="truncate text-xs text-gray-500">
                    <span className="font-mono">{selected.membershipNo}</span> · {selected.membershipCategory} · {selected.status}
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500" aria-live="polite">
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : saved ? <><Check size={13} className="text-green-400" /> Saved</> : null}
                </span>
                <Link href={`/admin/members/${selected._id}/edit`} aria-label={`Edit ${name}`}
                  className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-green-400 transition">
                  <Pencil size={16} />
                </Link>
              </div>

              <Feedback error={error} />

<p className="text-xs text-gray-500">
                {tier === "gold" ? "Gold" : "Silver"} card ({selected.membershipCategory}). Name, number, designation and dates come from the
                member&apos;s details, so edit the member to change what the card shows.
              </p>

              <div className="grid md:grid-cols-2 gap-5">
                {(["front", "back"] as const).map((side) => (
                  <div key={side} className="space-y-2">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      Card {side}{selected[side === "front" ? "cardFront" : "cardBack"] ? " · custom upload" : ""}
                    </p>
                    <CardPreview src={cardUrl(side)} label={`Card ${side}`} />
                    <div className="grid grid-cols-2 gap-2">
                      <a href={`/api/cards/${selected._id}?side=${side}`} download
                        className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-gray-700 transition">
                        <Download size={14} aria-hidden /> Download
                      </a>
                      <a href={cardUrl(side)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 hover:text-white transition">
                        <ExternalLink size={14} aria-hidden /> Full size
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-gray-800 pt-4">
                <a href={`/api/cards/${selected._id}?side=pdf`} download className={primaryBtn}>
                  <Download size={15} aria-hidden /> Download PDF (both sides)
                </a>
                <button type="button" onClick={() => window.print()} className={secondaryBtn}>
                  <Printer size={15} aria-hidden /> Print card
                </button>
                <p className="text-xs text-gray-500 basis-full sm:basis-auto">Both at standard ID-card size (3.375 × 2.125 in).</p>
              </div>

              <details className="rounded-xl border border-gray-800 bg-gray-950/40 p-4" open={!!(selected.cardFront || selected.cardBack)}>
                <summary className="cursor-pointer text-gray-300 text-sm font-semibold">Use your own artwork instead (optional)</summary>
                <p className="text-gray-500 text-xs mt-1">An uploaded side replaces the generated design for this member. Remove it to go back to the generated card.</p>
                <div className="mt-3 grid md:grid-cols-2 gap-5">
                  {(["cardFront", "cardBack"] as const).map((side) => (
                    <ImageUploadField
                      key={side}
                      label={side === "cardFront" ? "Custom front" : "Custom back"}
                      kind="card"
                      aspect="aspect-[1.586]"
                      value={selected[side] ?? ""}
                      onChange={(next) => saveSide(side, next)}
                      onError={setError}
                    />
                  ))}
                </div>
              </details>

              <VerificationLink memberId={selected._id} fileBase={fileBase} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
