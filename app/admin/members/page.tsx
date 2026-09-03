"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, X, UserPlus, Pencil, Trash2,
  ChevronLeft, ChevronRight, SlidersHorizontal,
  AlertTriangle, Loader2,
} from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { MembershipCategory } from "@/models/Member";

const CATEGORIES = ["All","Corporate","Executive","Associate","Overseas","Women","Student","Honorary Member"];
const STATUSES   = ["All","Active","Inactive","Pending"];

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
  joinedDate: string;
  phone: string;
  email: string;
}

interface ApiResponse {
  members: Member[];
  total: number;
  page: number;
  totalPages: number;
}

function StatusPill({ status }: { status: string }) {
  const s: Record<string, string> = {
    Active:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Inactive: "bg-red-500/10    text-red-400    border-red-500/20",
    Pending:  "bg-amber-500/10  text-amber-400  border-amber-500/20",
  };
  const dot: Record<string, string> = {
    Active: "bg-emerald-400", Inactive: "bg-red-400", Pending: "bg-amber-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${s[status] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] ?? "bg-gray-500"}`} />
      {status}
    </span>
  );
}

export default function AdminMembersPage() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus]     = useState("All");
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

  useEffect(() => { setPage(1); }, [debounced, category, status]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        page: String(page), limit: "20",
        search: debounced,
        category: category === "All" ? "" : category,
        status:   status   === "All" ? "" : status,
      });
      const res  = await fetch(`/api/admin/members?${p}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } finally { setLoading(false); }
  }, [page, debounced, category, status]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/admin/members/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    setDeleting(false);
    fetchMembers();
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Members</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data ? `${data.total} total members` : "Loading..."}
          </p>
        </div>
        <Link
          href="/admin/members/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition self-start sm:self-auto"
        >
          <UserPlus size={15} />
          Add Member
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, membership no, CNIC..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X size={13} />
              </button>
            )}
          </div>
          {/* Category */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-500 flex-shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
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
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">District</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Joined</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-600 py-16 text-sm">
                    No members found.
                  </td>
                </tr>
              ) : (
                data?.members.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-green-700">
                          {m.photo ? (
                            <Image src={m.photo} alt="" width={36} height={36} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{m.firstName[0]}{m.lastName[0]}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{m.firstName} {m.lastName}</p>
                          <p className="text-gray-500 text-xs truncate max-w-[160px]">{m.businessName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs font-mono">{m.membershipNo}</td>
                    <td className="px-4 py-3.5"><CategoryBadge category={m.membershipCategory} /></td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">{m.district}</td>
                    <td className="px-4 py-3.5"><StatusPill status={m.status} /></td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">
                      {new Date(m.joinedDate).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/admin/members/${m._id}/edit`}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-700 hover:text-green-400 transition"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => { setDeleteId(m._id); setDeleteName(`${m.firstName} ${m.lastName}`); }}
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
              <div key={m._id} className="p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-green-700">
                  {m.photo ? (
                    <Image src={m.photo} alt="" width={44} height={44} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{m.firstName[0]}{m.lastName[0]}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{m.firstName} {m.lastName}</p>
                  <p className="text-gray-500 text-[11px] font-mono">{m.membershipNo}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <CategoryBadge category={m.membershipCategory} />
                    <StatusPill status={m.status} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Link href={`/admin/members/${m._id}/edit`} className="p-2 rounded-lg text-gray-500 hover:bg-gray-700 hover:text-green-400 transition">
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => { setDeleteId(m._id); setDeleteName(`${m.firstName} ${m.lastName}`); }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
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
