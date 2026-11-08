"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, X, UserPlus, Pencil, Trash2,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  AlertTriangle, Loader2, CreditCard, Download, FileSpreadsheet, FileText,
} from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import MemberAvatar from "@/components/admin/MemberAvatar";
import DownloadButton from "@/components/admin/DownloadButton";
import MemberDownloadSheet from "@/components/admin/MemberDownloadSheet";
import type { MembershipCategory } from "@/models/Member";
import type { PhotoFrame } from "@/lib/photoFrame";
import { MEMBER_STATUSES } from "@/lib/memberStatus";
import { cardTier } from "@/lib/cardTier";

const CATEGORIES = ["All","Corporate","Executive","Associate","Overseas","Women","Student","Honorary Member"];
const STATUSES   = ["All", ...MEMBER_STATUSES];

interface Member {
  _id: string;
  membershipNo: string;
  firstName: string;
  lastName: string;
  membershipCategory: MembershipCategory;
  businessName: string;
  district: string;
  status: string;
  photo: string;
  photoFrame?: PhotoFrame;
  joinedDate: string;
  phone: string;
  cardFront?: string;
  cardBack?: string;
  email: string;
}

interface ApiResponse {
  members: Member[];
  total: number;
  page: number;
  totalPages: number;
  districts?: string[];
}

function StatusPill({ status }: { status: string }) {
  const s: Record<string, string> = {
    Active:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Expired:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Inactive: "bg-red-500/10    text-red-400    border-red-500/20",
    Pending:  "bg-amber-500/10  text-amber-400  border-amber-500/20",
  };
  const dot: Record<string, string> = {
    Active: "bg-emerald-400", Expired: "bg-orange-400", Inactive: "bg-red-400", Pending: "bg-amber-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${s[status] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? "bg-gray-500"}`} />
      {status}
    </span>
  );
}

function CardStatus({ member }: { member: Member }) {
  const custom = !!(member.cardFront || member.cardBack);
  const gold = cardTier(member.membershipCategory) === "gold";
  return (
    <Link
      href={`/admin/cards?member=${member._id}`}
      aria-label={`Membership card for ${member.firstName} ${member.lastName}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition hover:brightness-125 ${
        custom ? "bg-sky-500/10 text-sky-300 border-sky-500/20" : gold ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-gray-700/40 text-gray-300 border-gray-600"
      }`}
    >
      <CreditCard size={12} aria-hidden />
      {custom ? "Custom" : gold ? "Gold" : "Silver"}
    </Link>
  );
}

export default function AdminMembersPage() {
  const [search, setSearch]     = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadFor, setDownloadFor] = useState<Member | null>(null);
  const [category, setCategory] = useState("All");
  const [status, setStatus]     = useState("All");
  const [district, setDistrict] = useState("All");
  const [page, setPage]         = useState(1);
  const [data, setData]         = useState<ApiResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [debounced, setDebounced] = useState("");

  // Delete state
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debounced, category, status, district]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        page: String(page), limit: "20",
        search: debounced,
        category: category === "All" ? "" : category,
        status:   status   === "All" ? "" : status,
        district: district === "All" ? "" : district,
      });
      const res  = await fetch(`/api/admin/members?${p}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } finally { setLoading(false); }
  }, [page, debounced, category, status, district]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/members/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    setDeleting(false);
    fetchMembers();
  }

  // Excel export follows whatever the list is currently filtered to.
  const filtered = !!debounced.trim() || category !== "All" || status !== "All" || district !== "All";
  const exportHref = `/api/admin/members/export?${new URLSearchParams({
    search: debounced.trim(),
    category: category === "All" ? "" : category,
    status: status === "All" ? "" : status,
    district: district === "All" ? "" : district,
  })}`;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Members</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data ? `${data.total} total members` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DownloadButton
            href="/api/admin/forms/membership"
            title="Download the blank membership application form (PDF)"
            className="inline-flex items-center gap-2 min-h-10 px-3.5 sm:px-4 rounded-xl border border-gray-700 bg-gray-900 text-gray-200 text-sm font-semibold hover:bg-gray-800 transition"
            icon={<FileText size={15} className="text-green-400" aria-hidden />}
            label={<><span className="sm:hidden">Form</span><span className="hidden sm:inline">Blank form</span></>}
            onError={setDownloadError}
          />
          <DownloadButton
            href={exportHref}
            title={filtered ? "Export the members matching the current filters" : "Export every member"}
            className="inline-flex items-center gap-2 min-h-10 px-3.5 sm:px-4 rounded-xl border border-gray-700 bg-gray-900 text-gray-200 text-sm font-semibold hover:bg-gray-800 transition"
            icon={<FileSpreadsheet size={15} className="text-green-400" aria-hidden />}
            label={<><span className="sm:hidden">Excel</span><span className="hidden sm:inline">{filtered ? "Export filtered to Excel" : "Export all to Excel"}</span></>}
            onError={setDownloadError}
          />
          <Link
            href="/admin/members/new"
            className="hidden sm:inline-flex items-center gap-2 min-h-10 px-4 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition"
          >
            <UserPlus size={15} aria-hidden />
            Add Member
          </Link>
        </div>
      </div>

      {downloadError && (
        <div role="alert" className="flex items-start justify-between gap-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 max-md:bg-red-950 max-md:fixed max-md:bottom-4 max-md:inset-x-4 max-md:z-50 max-md:mb-0 px-4 py-3 text-sm text-red-300">
          <span>{downloadError}</span>
          <button type="button" onClick={() => setDownloadError("")} aria-label="Dismiss" className="shrink-0 text-red-300 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {downloadFor && (
        <MemberDownloadSheet member={downloadFor} onClose={() => setDownloadFor(null)} onError={setDownloadError} />
      )}

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-5">
        <div className="flex flex-col md:flex-row gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, member no., CNIC"
              aria-label="Search members"
              className="w-full pl-9 pr-10 min-h-11 rounded-xl bg-gray-800 border border-gray-700 text-white text-base sm:text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>
          {/* Category + status */}
          <div className="grid grid-cols-2 md:flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-500 flex-shrink-0 hidden md:block" aria-hidden />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-full md:w-auto min-h-11 bg-gray-800 border border-gray-700 text-gray-300 text-base sm:text-sm rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="w-full md:w-auto min-h-11 bg-gray-800 border border-gray-700 text-gray-300 text-base sm:text-sm rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
            </select>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              aria-label="Filter by district"
              className="col-span-2 w-full md:w-auto min-h-11 bg-gray-800 border border-gray-700 text-gray-300 text-base sm:text-sm rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
            >
              <option value="All">All districts</option>
              {data?.districts?.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-5 py-3.5">Member</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Membership No</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Category</th>
                <th className="hidden xl:table-cell text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">District</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Card</th>
                <th className="hidden xl:table-cell text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Joined</th>
                <th className="px-4 py-3.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-600 py-16 text-sm">
                    No members found.
                  </td>
                </tr>
              ) : (
                data?.members.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <MemberAvatar photo={m.photo} frame={m.photoFrame} firstName={m.firstName} lastName={m.lastName} size={40} />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold">{m.firstName} {m.lastName}</p>
                          <p className="text-gray-500 text-xs truncate max-w-[180px]">{m.businessName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs font-mono whitespace-nowrap">{m.membershipNo}</td>
                    <td className="px-4 py-3.5"><CategoryBadge category={m.membershipCategory} /></td>
                    <td className="hidden xl:table-cell px-4 py-3.5 text-gray-400 text-xs">{m.district}</td>
                    <td className="px-4 py-3.5"><StatusPill status={m.status} /></td>
                    <td className="px-4 py-3.5"><CardStatus member={m} /></td>
                    <td className="hidden xl:table-cell px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(m.joinedDate).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <DownloadButton
                          href={`/api/admin/forms/membership?member=${m._id}`}
                          ariaLabel={`Download filled form for ${m.firstName} ${m.lastName}`}
                          busyLabel={`Preparing form for ${m.firstName} ${m.lastName}`}
                          title="Download filled form (PDF)"
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-700 hover:text-green-400 transition"
                          icon={<FileText size={14} />}
                          spinnerSize={14}
                          onError={setDownloadError}
                        />
                        <Link
                          href={`/admin/members/${m._id}/edit`}
                          aria-label={`Edit ${m.firstName} ${m.lastName}`}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-700 hover:text-green-400 transition"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => { setDeleteId(m._id); setDeleteName(`${m.firstName} ${m.lastName}`); }}
                          aria-label={`Delete ${m.firstName} ${m.lastName}`}
                          className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-800">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-4 bg-gray-800 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-gray-800 rounded animate-pulse w-1/3" />
              </div>
            ))
          ) : data?.members.length === 0 ? (
            <p className="text-center text-gray-600 py-12 text-sm">No members found.</p>
          ) : (
            data?.members.map((m) => (
              <div key={m._id} className="relative p-3 sm:p-4 flex items-start gap-3 active:bg-gray-800/60 transition">
                <MemberAvatar photo={m.photo} frame={m.photoFrame} firstName={m.firstName} lastName={m.lastName} size={52} />
                <div className="flex-1 min-w-0">
                  {/* Name and number wrap rather than cut off; the buttons sit on their own row below. */}
                  <Link
                    href={`/admin/members/${m._id}/edit`}
                    className="block text-white text-sm font-semibold leading-snug break-words after:absolute after:inset-0 after:content-['']"
                  >
                    {m.firstName} {m.lastName}
                  </Link>
                  <p className="mt-0.5 text-gray-500 text-[11px] font-mono break-words">
                    <span className="whitespace-nowrap">{m.membershipNo}</span>{m.district ? ` · ${m.district}` : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <CategoryBadge category={m.membershipCategory} size="sm" />
                    <StatusPill status={m.status} />
                    <span className="relative z-10"><CardStatus member={m} /></span>
                  </div>
                  <div className="relative z-10 mt-1 -mr-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setDownloadFor(m)}
                      aria-label={`Download for ${m.firstName} ${m.lastName}`}
                      className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-green-400 transition"
                    >
                      <Download size={16} />
                    </button>
                    <Link
                      href={`/admin/members/${m._id}/edit`}
                      aria-label={`Edit ${m.firstName} ${m.lastName}`}
                      className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700 hover:text-green-400 transition"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => { setDeleteId(m._id); setDeleteName(`${m.firstName} ${m.lastName}`); }}
                      aria-label={`Delete ${m.firstName} ${m.lastName}`}
                      className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800">
            <p className="text-gray-600 text-xs">
              Page {data.page} of {data.totalPages} · {data.total} members
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold">Delete Member</p>
                <p className="text-gray-500 text-xs mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete <span className="text-white font-semibold">{deleteName}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
