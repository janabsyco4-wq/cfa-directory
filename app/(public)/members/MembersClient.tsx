"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight, Users, AlertTriangle, RotateCw, SlidersHorizontal } from "lucide-react";
import MemberCard from "@/components/MemberCard";
import MemberCardSkeleton from "@/components/MemberCardSkeleton";
import {
  CATEGORIES, PAGE_SIZE, SORT_OPTIONS,
  type DirectoryPage, type SortKey,
} from "@/lib/directory";

export interface DirectoryParams {
  search: string;
  category: string;
  district: string;
  sort: SortKey;
  page: number;
}

export const DEFAULT_PARAMS: DirectoryParams = { search: "", category: "", district: "", sort: "newest", page: 1 };

export function parseParams(get: (key: string) => string | null): DirectoryParams {
  const sort = get("sort");
  return {
    search:   (get("search") ?? "").slice(0, 100),
    category: CATEGORIES.includes(get("category") as never) ? (get("category") as string) : "",
    district: get("district") ?? "",
    sort:     SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : "newest",
    page:     Math.max(1, parseInt(get("page") ?? "1") || 1),
  };
}

function toQuery(p: DirectoryParams) {
  const q = new URLSearchParams();
  if (p.search)   q.set("search", p.search);
  if (p.category) q.set("category", p.category);
  if (p.district) q.set("district", p.district);
  if (p.sort !== "newest") q.set("sort", p.sort);
  if (p.page > 1) q.set("page", String(p.page));
  return q.toString();
}

function isDefault(p: DirectoryParams) {
  return toQuery(p) === "";
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

// 16px text on mobile stops iOS Safari from zooming into focused fields
const fieldClass =
  "w-full h-12 md:h-11 rounded-lg md:rounded-md border border-line bg-white text-base md:text-sm text-ink focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15";
const labelClass = "block text-xs font-semibold text-muted mb-1.5";
const pageBtnClass =
  "inline-flex items-center justify-center gap-1 h-11 sm:h-10 px-4 sm:px-3 rounded-lg sm:rounded-md border border-line bg-white text-sm font-medium text-ink hover:border-forest disabled:opacity-40 disabled:pointer-events-none";

export default function MembersClient({
  initialData,
  initialParams = DEFAULT_PARAMS,
}: {
  initialData: DirectoryPage | null;
  initialParams?: DirectoryParams;
}) {
  const useInitial = !!initialData && isDefault(initialParams);

  const [params, setParams]           = useState<DirectoryParams>(initialParams);
  const [searchInput, setSearchInput] = useState(initialParams.search);
  const [data, setData]               = useState<DirectoryPage | null>(useInitial ? initialData : null);
  const [districts, setDistricts]     = useState<string[]>(initialData?.districts ?? []);
  const [status, setStatus]           = useState<"ready" | "loading" | "error">(useInitial ? "ready" : "loading");
  const [reloadKey, setReloadKey]     = useState(0);
  const [sheetOpen, setSheetOpen]     = useState(false);
  const skipFetch    = useRef(useInitial);
  const resultsRef   = useRef<HTMLDivElement>(null);
  const filtersBtnRef = useRef<HTMLButtonElement>(null);
  const sheetCloseRef = useRef<HTMLButtonElement>(null);

  const update = (patch: Partial<DirectoryParams>) =>
    setParams((p) => ({ ...p, page: 1, ...patch }));

  useEffect(() => {
    const value = searchInput.trim();
    if (value === params.search) return;
    const t = setTimeout(() => setParams((p) => ({ ...p, search: value, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput, params.search]);

  useEffect(() => {
    const qs = toQuery(params);
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (next !== window.location.pathname + window.location.search) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [params]);

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const ctrl = new AbortController();
    setStatus("loading");
    const q = new URLSearchParams(toQuery(params));
    q.set("limit", String(PAGE_SIZE));
    fetch(`/api/members?${q}`, { signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !Array.isArray(json.members)) throw new Error(json.error);
        return json as DirectoryPage;
      })
      .then((json) => {
        setData(json);
        if (json.districts?.length) setDistricts(json.districts);
        setStatus("ready");
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setStatus("error");
      });
    return () => ctrl.abort();
  }, [params, reloadKey]);

  useEffect(() => {
    if (!sheetOpen) return;
    const filtersBtn = filtersBtnRef.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    const onResize = () => window.matchMedia("(min-width: 768px)").matches && setSheetOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      filtersBtn?.focus();
    };
  }, [sheetOpen]);

  function goToPage(page: number) {
    setParams((p) => ({ ...p, page }));
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearAll() {
    setSearchInput("");
    setParams((p) => ({ ...DEFAULT_PARAMS, sort: p.sort }));
  }

  const chips = [
    params.search   && { key: "search",   label: `“${params.search}”`, clear: () => { setSearchInput(""); update({ search: "" }); } },
    params.category && { key: "category", label: params.category,       clear: () => update({ category: "" }) },
    params.district && { key: "district", label: params.district,       clear: () => update({ district: "" }) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const filterCount = (params.category ? 1 : 0) + (params.district ? 1 : 0) + (params.sort !== "newest" ? 1 : 0);

  const total      = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const start = total ? (params.page - 1) * PAGE_SIZE + 1 : 0;
  const end   = Math.min(params.page * PAGE_SIZE, total);

  const renderFields = (prefix: string) => (
    <>
      <div>
        <label htmlFor={`${prefix}-category`} className={labelClass}>Category</label>
        <select
          id={`${prefix}-category`}
          value={params.category}
          onChange={(e) => update({ category: e.target.value })}
          className={`${fieldClass} px-3`}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor={`${prefix}-district`} className={labelClass}>District</label>
        <select
          id={`${prefix}-district`}
          value={params.district}
          onChange={(e) => update({ district: e.target.value })}
          className={`${fieldClass} px-3`}
        >
          <option value="">All districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          {params.district && !districts.includes(params.district) && (
            <option value={params.district}>{params.district}</option>
          )}
        </select>
      </div>

      <div className="md:col-span-2 lg:col-span-1">
        <label htmlFor={`${prefix}-sort`} className={labelClass}>Sort by</label>
        <select
          id={`${prefix}-sort`}
          value={params.sort}
          onChange={(e) => update({ sort: e.target.value as SortKey })}
          className={`${fieldClass} px-3`}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    </>
  );

  return (
    <div className="container-site pb-10 md:py-10">
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="animate-rise sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-canvas border-b border-line
                   md:static md:mx-0 md:bg-white md:border md:rounded-lg md:p-5 md:grid md:gap-4 md:grid-cols-2
                   lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]"
      >
        <div className="flex gap-2 md:contents">
          <div className="flex-1 min-w-0 md:col-span-2 lg:col-span-1">
            <label htmlFor="member-search" className={`${labelClass} sr-only md:not-sr-only`}>
              Search members
            </label>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
              <input
                id="member-search"
                type="search"
                enterKeyHint="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name or organization"
                maxLength={100}
                autoComplete="off"
                className={`${fieldClass} pl-10 md:pl-9 ${searchInput ? "pr-11" : "pr-3"} placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden`}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 inline-flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-canvas"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <button
            ref={filtersBtnRef}
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className="md:hidden relative inline-flex items-center gap-1.5 h-12 px-3.5 rounded-lg border border-line bg-white text-sm font-semibold text-ink active:bg-canvas"
          >
            <SlidersHorizontal size={17} aria-hidden />
            Filters
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-forest text-white text-[11px] font-bold">
                {filterCount}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
        </div>

        <div className="hidden md:contents">{renderFields("filter")}</div>
      </form>

      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="filters-title">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 w-full bg-ink/45 animate-fade"
          />
          <div className="animate-sheet absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto bg-white rounded-t-2xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="sticky top-0 bg-white pt-2.5 px-4 pb-3 border-b border-line">
              <div className="mx-auto w-10 h-1 rounded-full bg-line" aria-hidden />
              <div className="mt-2.5 flex items-center justify-between">
                <h2 id="filters-title" className="text-lg font-bold text-ink">Filters</h2>
                <button
                  ref={sheetCloseRef}
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="w-10 h-10 -mr-2 inline-flex items-center justify-center rounded-md text-muted hover:bg-canvas"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="px-4 py-5 grid gap-4">{renderFields("sheet")}</div>
            <div className="px-4 pt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update({ category: "", district: "", sort: "newest" })}
                disabled={filterCount === 0}
                className="btn btn-outline disabled:opacity-50"
              >
                Reset
              </button>
              <button type="button" onClick={() => setSheetOpen(false)} className="btn btn-primary">
                {status === "ready" ? `Show ${total} ${total === 1 ? "member" : "members"}` : "Show results"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={resultsRef} className="scroll-mt-40 md:scroll-mt-24 mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-h-9">
        <p className="text-[13px] sm:text-sm text-muted" aria-live="polite">
          {status === "loading" && "Loading members…"}
          {status === "error" && "Members could not be loaded."}
          {status === "ready" && (total > 0
            ? <>Showing <strong className="text-ink">{start}–{end}</strong> of <strong className="text-ink">{total}</strong> {total === 1 ? "member" : "members"}</>
            : "No matching members")}
        </p>

        {chips.length > 0 && (
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible">
            <span className="hidden sm:inline text-xs text-muted">Active filters:</span>
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="flex-shrink-0 inline-flex items-center gap-1.5 h-8 max-w-[14rem] rounded-full border border-forest/25 bg-forest/5 pl-3 pr-2 text-xs font-medium text-forest hover:bg-forest/10"
                aria-label={`Remove filter ${c.label}`}
              >
                <span className="truncate">{c.label}</span> <X size={13} className="flex-shrink-0" aria-hidden />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="flex-shrink-0 h-8 px-1 text-xs font-semibold text-muted underline underline-offset-2 hover:text-ink">
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 sm:mt-4" aria-busy={status === "loading"}>
        {status === "loading" ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => <MemberCardSkeleton key={i} />)}
          </div>
        ) : status === "error" ? (
          <div className="bg-white border border-line rounded-xl text-center px-5 py-12 sm:px-6 sm:py-14">
            <AlertTriangle size={28} className="mx-auto text-gold" aria-hidden />
            <h2 className="mt-3 text-lg font-bold text-ink">We couldn’t load the directory</h2>
            <p className="mt-1 text-sm text-muted">Please check your connection and try again.</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="btn btn-primary mt-5 w-full sm:w-auto">
              <RotateCw size={15} aria-hidden /> Try again
            </button>
          </div>
        ) : data && data.members.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {data.members.map((m, i) => (
              <li key={m._id} className="animate-fade flex" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <MemberCard member={m} priority={i < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-white border border-line rounded-xl text-center px-5 py-12 sm:px-6 sm:py-14">
            <Users size={28} className="mx-auto text-muted/60" aria-hidden />
            <h2 className="mt-3 text-lg font-bold text-ink">No members found</h2>
            <p className="mt-1 text-sm text-muted">Try a different name, or remove some filters.</p>
            {chips.length > 0 && (
              <button type="button" onClick={clearAll} className="btn btn-outline mt-5 w-full sm:w-auto">Clear all filters</button>
            )}
          </div>
        )}
      </div>

      {status === "ready" && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 sm:mt-10 flex items-center justify-between sm:justify-center gap-1.5">
          <button
            type="button"
            onClick={() => goToPage(params.page - 1)}
            disabled={params.page <= 1}
            className={pageBtnClass}
          >
            <ChevronLeft size={16} aria-hidden /> Previous
          </button>
          <p className="sm:hidden text-sm text-muted">
            Page <strong className="text-ink">{params.page}</strong> of {totalPages}
          </p>
          <div className="hidden sm:flex items-center gap-1.5">
            {pageWindow(params.page, totalPages).map((n, i) =>
              n === "…" ? (
                <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => goToPage(n)}
                  aria-current={n === params.page ? "page" : undefined}
                  aria-label={`Page ${n}`}
                  className={`h-10 min-w-10 px-3 rounded-md text-sm font-semibold border ${
                    n === params.page
                      ? "bg-forest border-forest text-white"
                      : "bg-white border-line text-ink hover:border-forest"
                  }`}
                >
                  {n}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            onClick={() => goToPage(params.page + 1)}
            disabled={params.page >= totalPages}
            className={pageBtnClass}
          >
            Next <ChevronRight size={16} aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
