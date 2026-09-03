"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import {
  Search, ShieldCheck, User, Building2, MapPin,
  Phone, Mail, CreditCard, Calendar, FileText,
  Hash, AlertCircle, Loader2, CheckCircle2,
} from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { MembershipCategory } from "@/models/Member";

interface MemberDetail {
  _id: string;
  membershipNo: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  email: string;
  ntn: string;
  address: string;
  district: string;
  businessName: string;
  businessType: string;
  membershipCategory: MembershipCategory;
  fee: number;
  status: string;
  joinedDate: string;
  photo: string;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={12} className="text-green-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-400 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-gray-800 text-sm font-semibold break-words">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    Inactive: "bg-red-50    text-red-700      border-red-200",
    Pending:  "bg-amber-50  text-amber-700    border-amber-200",
  };
  const dot: Record<string, string> = {
    Active: "bg-emerald-500", Inactive: "bg-red-500", Pending: "bg-amber-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${styles[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot[status] ?? "bg-gray-400"}`} />
      {status}
    </span>
  );
}

const headerGradient: Record<MembershipCategory, string> = {
  Corporate:        "from-emerald-700 to-green-600",
  Executive:        "from-blue-700    to-blue-600",
  Associate:        "from-violet-700  to-purple-600",
  Overseas:         "from-sky-700     to-cyan-600",
  Women:            "from-rose-700    to-pink-600",
  Student:          "from-amber-600   to-orange-500",
  "Honorary Member":"from-gray-700    to-gray-600",
};

export default function LookupPage() {
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [member, setMember]   = useState<MemberDetail | null>(null);
  const [error, setError]     = useState("");

  function handleCnicChange(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 5) setQuery(digits);
    else if (digits.length <= 12) setQuery(`${digits.slice(0,5)}-${digits.slice(5)}`);
    else setQuery(`${digits.slice(0,5)}-${digits.slice(5,12)}-${digits.slice(12)}`);
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setMember(null);
    setError("");
    try {
      const res  = await fetch(`/api/members/lookup?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Member not found.");
      else         setMember(json.member);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const initials   = member ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase() : "";
  const gradient   = member ? (headerGradient[member.membershipCategory] ?? "from-green-700 to-emerald-600") : "";
  const feeDisplay =
    member?.membershipCategory === "Overseas" ? `USD ${member.fee}`
    : member?.fee === 0 ? "Free"
    : `Rs. ${member?.fee?.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 text-[11px] font-bold tracking-[0.2em] uppercase">CFA Pakistan</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Member Lookup</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 flex items-center gap-2 sm:gap-3">
            <ShieldCheck className="text-green-600 flex-shrink-0" size={24} />
            Member Lookup
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Enter your CNIC to verify and retrieve your full member profile.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* ── Search form ──────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={15} className="text-green-600 flex-shrink-0" />
              <label className="text-sm font-bold text-gray-900">CNIC</label>
            </div>
            <p className="text-gray-400 text-xs mb-4">
              Enter your CNIC number to verify membership. Format: 42101-1234567-1
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleCnicChange(e.target.value)}
                  placeholder="42101-1234567-1"
                  maxLength={15}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm w-full sm:w-auto"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={15} />}
                <span>{loading ? "Searching..." : "Search"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 mb-6 sm:mb-8">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={15} className="text-red-500" />
            </div>
            <div>
              <p className="text-red-800 font-bold text-sm">No Member Found</p>
              <p className="text-red-600 text-sm mt-0.5">
                No member is registered with CNIC <span className="font-mono font-bold">{query}</span>. Please check and try again.
              </p>
            </div>
          </div>
        )}

        {/* ── Member profile ───────────────────────────────────────────── */}
        {member && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md">

            {/* Header */}
            <div className={`bg-gradient-to-br ${gradient} p-5 sm:p-8`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Photo */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-4 ring-white/25 shadow-xl">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={`${member.firstName} ${member.lastName}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      <span className="text-white font-extrabold text-2xl">{initials}</span>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <CheckCircle2 size={13} className="text-green-300 flex-shrink-0" />
                    <span className="text-green-200 text-[11px] font-semibold tracking-wider uppercase">Verified Member</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white break-words">
                    {member.firstName} {member.lastName}
                  </h2>
                  {member.businessName && member.businessName !== "N/A" && (
                    <p className="text-white/70 text-sm mt-1 break-words">{member.businessName}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                    <CategoryBadge category={member.membershipCategory} size="md" />
                    <StatusBadge status={member.status} />
                  </div>
                  <p className="text-white/50 text-xs font-mono mt-3 tracking-wider">{member.membershipNo}</p>
                </div>
              </div>
            </div>

            {/* Details — single col on mobile, two col on sm+ */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 lg:gap-x-8">
                <div>
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 pb-2 border-b border-gray-100">
                    Personal Information
                  </p>
                  <InfoRow icon={User}       label="Father's Name" value={member.fatherName} />
                  <InfoRow icon={CreditCard} label="CNIC"          value={member.cnic} />
                  <InfoRow icon={Phone}      label="Phone"         value={member.phone} />
                  <InfoRow icon={Mail}       label="Email"         value={member.email} />
                  <InfoRow icon={FileText}   label="NTN"           value={member.ntn} />
                </div>
                <div className="mt-4 sm:mt-0">
                  <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 pb-2 border-b border-gray-100">
                    Business & Membership
                  </p>
                  <InfoRow icon={Building2} label="Business Type"  value={member.businessType} />
                  <InfoRow icon={MapPin}    label="Address"        value={member.address} />
                  <InfoRow icon={MapPin}    label="District"       value={member.district} />
                  <InfoRow icon={Hash}      label="Membership Fee" value={feeDisplay} />
                  <InfoRow
                    icon={Calendar}
                    label="Joined Date"
                    value={new Date(member.joinedDate).toLocaleDateString("en-PK", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Idle state ───────────────────────────────────────────────── */}
        {!member && !error && !loading && (
          <div className="text-center py-16 sm:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-sm">
              <ShieldCheck size={28} className="text-green-500" />
            </div>
            <p className="text-gray-700 font-bold text-base sm:text-lg">Verify Your Membership</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2 max-w-xs mx-auto leading-relaxed">
              Enter your CNIC number above to view your full member profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
