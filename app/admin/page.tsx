"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users, UserCheck, UserX, Clock,
  TrendingUp, UserPlus, ArrowRight, RefreshCw,
} from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { MembershipCategory } from "@/models/Member";

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
    joinedDate: string;
    membershipNo: string;
  }[];
}

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-white">{value}</p>
      <p className="text-gray-400 text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Corporate:        "bg-emerald-500",
  Executive:        "bg-blue-500",
  Associate:        "bg-violet-500",
  Overseas:         "bg-sky-500",
  Women:            "bg-rose-500",
  Student:          "bg-amber-500",
  "Honorary Member":"bg-gray-500",
};

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/admin/stats");
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Failed to load stats.");
      else         setStats(json);
    } catch { setError("Failed to load stats."); }
    finally   { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of CFA membership</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            href="/admin/members/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition"
          >
            <UserPlus size={14} />
            Add Member
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
          {error} — Make sure MongoDB is connected.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Members"   value={stats.total}    icon={Users}     color="bg-green-600"  sub="all time" />
            <StatCard label="Active"          value={stats.active}   icon={UserCheck} color="bg-emerald-600" sub="currently active" />
            <StatCard label="Inactive"        value={stats.inactive} icon={UserX}     color="bg-red-600"    sub="deactivated" />
            <StatCard label="Pending"         value={stats.pending}  icon={Clock}     color="bg-amber-600"  sub="awaiting approval" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Category breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-green-400" />
                <h2 className="text-white font-bold text-sm">By Category</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.categories).map(([cat, count]) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-xs font-medium">{cat}</span>
                        <span className="text-white text-xs font-bold">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CATEGORY_COLORS[cat] ?? "bg-gray-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent members */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-green-400" />
                  <h2 className="text-white font-bold text-sm">Recent Members</h2>
                </div>
                <Link
                  href="/admin/members"
                  className="flex items-center gap-1 text-green-400 text-xs font-semibold hover:text-green-300 transition"
                >
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-3">
                {stats.recent.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-green-600 flex items-center justify-center">
                      {m.photo ? (
                        <Image src={m.photo} alt="" width={36} height={36} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {m.firstName[0]}{m.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-gray-500 text-[11px] font-mono">{m.membershipNo}</p>
                    </div>
                    <CategoryBadge category={m.membershipCategory} size="sm" />
                  </div>
                ))}
                {stats.recent.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-6">No members yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
