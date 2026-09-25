"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, X, Users, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin, Loader2 } from "lucide-react";
import MemberCard from "@/components/MemberCard";
import { MembershipCategory } from "@/models/Member";

const CATEGORIES: ("All" | MembershipCategory)[] = [
  "All", "Corporate", "Executive", "Associate",
  "Overseas", "Women", "Student", "Honorary Member",
];

interface Member {
  _id: string;
  membershipNo: string;
  firstName: string;
  lastName: string;
  membershipCategory: MembershipCategory;
  photo?: string;
  businessName?: string;
  district?: string;
}

interface ApiResponse {
  members: Member[];
  total: number;
  page: number;
  totalPages: number;
  districts?: string[];
}

export default function MembersPage() {
  const [search, setSearch]                   = useState("");
  const [category, setCategory]               = useState<"All" | MembershipCategory>("All");
  const [district, setDistrict]               = useState("All");
  const [districts, setDistricts]             = useState<string[]>([]);
  const [page, setPage]                       = useState(1);
  const [allMembers, setAllMembers]           = useState<Member[]>([]);
  const [displayedMembers, setDisplayedMembers] = useState<Member[]>([]);
  const [total, setTotal]                     = useState(0);
  const [totalPages, setTotalPages]           = useState(0);
  const [loading, setLoading]                 = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filtersOpen, setFiltersOpen]         = useState(false);
  const displayBatch = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { 
    setPage(1); 
    setDisplayBatch.current = 0;
    setDisplayedMembers([]);
  }, [debouncedSearch, category, district]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setDisplayBatch.current = 0;
    setDisplayedMembers([]);
    try {
      const params = new URLSearchParams({
        page:     String(page),
        limit:    "20",
        search:   debouncedSearch,
        category: category === "All" ? "" : category,
        district: district === "All" ? "" : district,
      });
      const res  = await fetch(`/api/members?${params}`);
      const json = await res.json();
      if (res.ok && json.members) {
        setAllMembers(json.members);
        setTotal(json.total);
        setTotalPages(json.totalPages);
        // Update districts list from first load (no filters)
        if (json.districts && json.districts.length > 0) {
          setDistricts(json.districts);
        }
        // Start progressive loading - first 5
        setDisplayedMembers(json.members.slice(0, 5));
        displayBatch.current = 1;
      } else {
        setAllMembers([]);
        setDisplayedMembers([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch {
      setAllMembers([]);
      setDisplayedMembers([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, district]);

  // Progressive loading effect - load 5 more every 200ms
  useEffect(() => {
    if (displayBatch.current > 0 && displayBatch.current < 4 && allMembers.length > displayedMembers.length) {
      const timer = setTimeout(() => {
        const nextBatch = displayBatch.current + 1;
        setDisplayedMembers(allMembers.slice(0, nextBatch * 5));
        displayBatch.current = nextBatch;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [displayedMembers, allMembers]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const start = total > 0 ? (page - 1) * 20 + 1 : 0;
  const end   = total > 0 ? Math.min(page * 20, total) : 0;
  const hasFilters = category !== "All" || district !== "All" || search !== "";
  const isProgressiveLoading = displayedMembers.length < allMembers.length;

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setDistrict("All");
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 text-[11px] font-bold tracking-[0.2em] uppercase">CFA Pakistan</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">Directory</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
                Member Directory
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                All active members of the Chamber of Food and Agriculture Pakistan
              </p>
            </div>
            {total > 0 && !loading && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 sm:px-4 py-2 self-start sm:self-auto">
                <Users size={13} className="text-green-600 flex-shrink-0" />
                <span className="text-green-700 font-bold text-sm">{total}</span>
                <span className="text-green-600 text-xs sm:text-sm">active members</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl mb-6 sm:mb-8 shadow-sm overflow-hidden">

          {/* Search + toggle row — always visible */}
          <div className="flex gap-2 sm:gap-4 items-center p-3 sm:p-4">
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or business..."
                className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                filtersOpen || hasFilters
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
              }`}
            >
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && !filtersOpen && (
                <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              )}
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium transition"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Collapsible filter panels */}
          {filtersOpen && (
            <div className="border-t border-gray-100 px-3 sm:px-4 pb-4 pt-3 space-y-4">
              {/* Category chips */}
              <div>
                <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-2">Category</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                        category === cat
                          ? "bg-green-600 text-white border-green-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* City / District chips */}
              {districts.length > 0 && (
                <div>
                  <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1">
                    <MapPin size={10} /> City / District
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      onClick={() => setDistrict("All")}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                        district === "All"
                          ? "bg-green-600 text-white border-green-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
                      }`}
                    >
                      All Cities
                    </button>
                    {districts.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDistrict(d)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                          district === d
                            ? "bg-green-600 text-white border-green-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Results count ─────────────────────────────────────────────── */}
        {total > 0 && !loading && (
          <p className="text-gray-400 text-xs mb-4 font-medium">
            Showing{" "}
            <span className="text-gray-700">{start}–{end}</span>{" "}
            of{" "}
            <span className="text-gray-700">{total}</span> members
          </p>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-100 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2 bg-gray-100 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedMembers.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {displayedMembers.map((m) => (
                <MemberCard
                  key={m._id}
                  membershipNo={m.membershipNo}
                  firstName={m.firstName}
                  lastName={m.lastName}
                  membershipCategory={m.membershipCategory}
                  photo={m.photo}
                  businessName={m.businessName}
                  district={m.district}
                />
              ))}
            </div>
            
            {/* Progressive loading indicator */}
            {isProgressiveLoading && (
              <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Loading more members...</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 sm:py-24">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users size={22} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold text-sm sm:text-base">No members found</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Try adjusting your search or filter</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-xs text-green-600 hover:text-green-700 font-semibold underline">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 sm:mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <span className="px-3 sm:px-4 py-2 text-sm text-gray-600">
              <strong className="text-gray-900">{page}</strong>
              <span className="text-gray-400"> / </span>
              {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 hover:border-green-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
