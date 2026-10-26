"use client";

import { useEffect, useState, type ElementType } from "react";
import Link from "next/link";
import {
  Users, UserCheck, UserX, Clock, ChartPie,
  UserPlus, ArrowRight, RefreshCw, ChevronRight,
} from "lucide-react";
import MemberAvatar from "@/components/admin/MemberAvatar";
import type { MembershipCategory } from "@/models/Member";
import type { PhotoFrame } from "@/lib/photoFrame";

interface Stats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  categories: Record<string, number>;
  recent: {
    _id: string;
    firstName: string;
    lastName: string;
    membershipCategory: MembershipCategory;
    status: string;
    photo: string;
    photoFrame?: PhotoFrame;
    joinedDate: string;
    membershipNo: string;
  }[];
}

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number; icon: ElementType; color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-1 text-[1.75rem] font-extrabold leading-none tracking-tight text-white tabular-nums">{value}</p>
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} aria-hidden />
      </span>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Corporate: "#34d399",
  Executive: "#60a5fa",
  Associate: "#a78bfa",
  Overseas: "#38bdf8",
  Women: "#fb7185",
  Student: "#fbbf24",
  "Honorary Member": "#9ca3af",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch("/api/admin/stats", { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) setError(json.error ?? "Failed to load stats.");
        else setStats(json);
      } catch {
        if (!controller.signal.aborted) setError("Failed to load stats.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [refresh]);

  function reload() {
    setLoading(true);
    setError("");
    setRefresh((value) => value + 1);
  }

  const categories = Object.entries(stats?.categories ?? {});
  let end = 0;
  const segments = categories.map(([category, count]) => {
    const start = end;
    end += stats?.total ? (count / stats.total) * 100 : 0;
    return `${CATEGORY_COLORS[category] ?? "#9ca3af"} ${start}% ${end}%`;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Dashboard</h1>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">Your membership overview</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            aria-label="Refresh dashboard"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm font-medium text-gray-300 transition hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} aria-hidden />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/admin/members/new"
            className="hidden min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-500 sm:inline-flex"
          >
            <UserPlus size={16} aria-hidden /> Add Member
          </Link>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error} — Please try refreshing the dashboard.
        </div>
      )}

      <div aria-busy={loading} className="space-y-4 sm:space-y-5">
        {loading && !stats ? (
          <>
            <div role="status" className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <span className="sr-only">Loading membership overview</span>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-[86px] animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} aria-hidden className="h-80 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
              ))}
            </div>
          </>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total Members" value={stats.total} icon={Users} color="bg-green-500/10 text-green-300" />
              <StatCard label="Active" value={stats.active} icon={UserCheck} color="bg-emerald-500/10 text-emerald-300" />
              <StatCard label="Inactive" value={stats.inactive} icon={UserX} color="bg-rose-500/10 text-rose-300" />
              <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-amber-500/10 text-amber-300" />
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
              <section aria-labelledby="category-heading" className="flex min-w-0 flex-col rounded-2xl border border-gray-800 bg-gray-900">
                <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3.5">
                  <h2 id="category-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ChartPie size={16} className="text-green-400" aria-hidden /> By Category
                  </h2>
                  <span className="text-xs text-gray-500">{categories.length} categories</span>
                </div>
                {categories.length > 0 ? (
                  <div className="flex flex-1 items-center gap-4 p-4 lg:gap-5 lg:p-5">
                    <div
                      aria-hidden
                      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full lg:h-28 lg:w-28"
                      style={{ background: `conic-gradient(${segments.join(", ")})` }}
                    >
                      <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-gray-900 lg:h-[90px] lg:w-[90px]">
                        <span className="text-2xl font-extrabold tracking-tight text-white tabular-nums">{stats.total}</span>
                        <span className="mt-0.5 text-[10px] text-gray-400">Members</span>
                      </div>
                    </div>
                    <ul className="min-w-0 flex-1 space-y-3">
                      {categories.map(([category, count]) => (
                        <li key={category} className="flex items-center gap-2.5 text-xs">
                          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] ?? "#9ca3af" }} />
                          <span className="min-w-0 flex-1 text-gray-300">{category}</span>
                          <span className="font-semibold text-white tabular-nums">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="p-6 text-center text-sm text-gray-400">Categories will appear when members are added.</p>
                )}
              </section>

              <section aria-labelledby="recent-heading" className="min-w-0 rounded-2xl border border-gray-800 bg-gray-900">
                <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3.5">
                  <h2 id="recent-heading" className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Users size={16} className="text-green-400" aria-hidden /> Recent Members
                  </h2>
                  <Link href="/admin/members" className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300">
                    View all <ArrowRight size={13} aria-hidden />
                  </Link>
                </div>
                <ul className="divide-y divide-gray-800/80 px-3">
                  {stats.recent.map((member) => (
                    <li key={member._id}>
                      <Link
                        href={`/admin/members/${member._id}/edit`}
                        className="-mx-1 flex min-h-12 items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-800/60 focus-visible:outline-2 focus-visible:outline-green-500 sm:min-h-14 sm:py-2"
                      >
                        <MemberAvatar photo={member.photo} frame={member.photoFrame} firstName={member.firstName} lastName={member.lastName} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-100">{member.firstName} {member.lastName}</p>
                          <p className="mt-0.5 truncate font-mono text-[11px] leading-none text-gray-500 sm:leading-normal">{member.membershipNo}</p>
                        </div>
                        <span className="hidden shrink-0 rounded-md border border-gray-700 px-2 py-1 text-[10px] font-medium text-gray-300 xl:inline-flex">{member.membershipCategory}</span>
                        <ChevronRight size={15} className="shrink-0 text-gray-500" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
                {stats.recent.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-400">No members yet.</p>
                    <Link href="/admin/members/new" className="mt-3 inline-block text-sm font-semibold text-green-400 hover:text-green-300">Add your first member</Link>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
