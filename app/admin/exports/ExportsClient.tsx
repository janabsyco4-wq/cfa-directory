"use client";

import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, FolderArchive, Loader2, X } from "lucide-react";
import DownloadButton from "@/components/admin/DownloadButton";
import { Feedback, primaryBtn, secondaryBtn } from "@/components/admin/FormField";
import { makeZip } from "@/lib/zipStore";

type Totals = { members: number; pictures: number };
type Summary = Totals & { districts: (Totals & { name: string })[] };
type PictureList = { files: { name: string; url: string }[]; withoutPicture: string[]; zipName: string };

const PARALLEL = 6;

async function fetchPicture(url: string, signal: AbortSignal) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(String(res.status));
      return new Uint8Array(await res.arrayBuffer());
    } catch (err) {
      if (signal.aborted || attempt === 2) throw err;
    }
  }
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function ExportsClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/admin/exports")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSummary)
      .catch(() => setLoadFailed(true));
    return () => abort.current?.abort();
  }, []);

  const chosen = summary?.districts.filter((d) => selected.includes(d.name)) ?? [];
  const totals: Totals | undefined = !summary ? undefined : selected.length
    ? chosen.reduce((sum, d) => ({ members: sum.members + d.members, pictures: sum.pictures + d.pictures }), { members: 0, pictures: 0 })
    : summary;
  const scope = !selected.length ? "All districts" : selected.length === 1 ? selected[0] : `${selected.length} districts`;
  const query = selected.length ? `?${new URLSearchParams(selected.map((district) => ["district", district]))}` : "";

  function choose(next: string[]) {
    setSelected(next);
    setResult("");
    setError("");
  }

  async function downloadPictures() {
    if (abort.current) return;
    const controller = new AbortController();
    abort.current = controller;
    setError("");
    setResult("");
    setProgress({ done: 0, total: 0 });
    try {
      const res = await fetch(`/api/admin/exports/photos${query}`, { signal: controller.signal });
      if (!res.ok) throw new Error(res.status === 401 ? "Your session has ended. Please sign in again to download." : "The picture list could not be loaded. Please try again.");
      const list: PictureList = await res.json();
      if (!list.files.length) throw new Error("There are no pictures to download for this selection.");

      // Filled by position: pictures finish in any order, but the ZIP keeps member order.
      const fetched: ({ name: string; data: Uint8Array<ArrayBuffer> } | undefined)[] = [];
      const failed: string[] = [];
      let next = 0;
      let done = 0;
      setProgress({ done, total: list.files.length });
      await Promise.all(Array.from({ length: PARALLEL }, async () => {
        while (next < list.files.length && !controller.signal.aborted) {
          const position = next++;
          const file = list.files[position];
          try {
            fetched[position] = { name: file.name, data: await fetchPicture(file.url, controller.signal) };
          } catch {
            if (!controller.signal.aborted) failed.push(file.name);
          }
          setProgress({ done: ++done, total: list.files.length });
        }
      }));
      if (controller.signal.aborted) return;
      const files = fetched.filter((f) => f !== undefined);
      if (!files.length) throw new Error("None of the pictures could be downloaded. Check your connection and try again.");

      const notes = [
        ...(failed.length ? ["Could not be downloaded:", ...failed, ""] : []),
        ...(list.withoutPicture.length ? ["No picture on record:", ...list.withoutPicture] : []),
      ];
      if (notes.length) files.push({ name: "Missing pictures.txt", data: new TextEncoder().encode(notes.join("\r\n")) });
      save(makeZip(files), list.zipName);
      setResult(failed.length
        ? `Saved ${files.length - 1} of ${list.files.length} pictures. ${failed.length} could not be downloaded; they are listed in "Missing pictures.txt" inside the ZIP.`
        : `Saved ${list.files.length} pictures.`);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "The download failed. Check your connection and try again.");
    } finally {
      abort.current = null;
      setProgress(null);
    }
  }

  const percent = progress?.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">Exports</h1>
        <p className="text-gray-500 text-sm mt-0.5">Download member data and pictures, for everyone or the districts you choose, in member-number order.</p>
      </header>

      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
        <fieldset disabled={!summary || !!progress} className="disabled:opacity-60">
          <div className="flex items-center justify-between gap-3 mb-2 min-h-9">
            <legend className="float-left text-gray-400 text-xs font-semibold uppercase tracking-wider">Districts</legend>
            {selected.length > 0 && (
              <button type="button" onClick={() => choose([])} className="text-green-400 text-sm font-semibold px-2 min-h-9">Clear</button>
            )}
          </div>
          <p aria-live="polite" className="text-white text-sm font-semibold mb-2">
            {!summary ? "Loading districts..." : selected.length
              ? `${scope === selected[0] ? selected[0] : `${selected.length} districts selected`} (${totals?.members ?? 0} members)`
              : `All districts (${summary.members} members). Tick to choose specific ones.`}
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-1 max-h-64 overflow-y-auto rounded-xl border border-gray-800 p-1.5">
            {summary?.districts.map((d) => (
              <label key={d.name} className="flex items-center gap-2.5 min-h-11 px-2.5 rounded-lg text-sm text-gray-200 hover:bg-gray-800 cursor-pointer has-[:checked]:bg-gray-800 has-[:checked]:text-white">
                <input
                  type="checkbox"
                  checked={selected.includes(d.name)}
                  onChange={(e) => choose(e.target.checked ? [...selected, d.name] : selected.filter((n) => n !== d.name))}
                  className="w-4 h-4 shrink-0 accent-green-500"
                />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="shrink-0 text-xs text-gray-500">{d.members}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {loadFailed && <div className="mt-3"><Feedback error="The districts could not be loaded. Refresh the page to try again." /></div>}
      </section>

      <div className="mt-4 sm:mt-5 grid md:grid-cols-2 gap-4 sm:gap-5">
        <section className="flex flex-col bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
          <FileSpreadsheet size={24} className="text-green-400" aria-hidden />
          <h2 className="mt-3 text-white text-base font-bold">Members Excel sheet</h2>
          <p className="mt-1 mb-4 text-gray-500 text-sm">
            {totals ? `${totals.members} members from ${scope}.` : scope}{" "}
            Numbered 1, 2, 3 by member number, with only the data on record.
          </p>
          <DownloadButton
            href={`/api/admin/members/export${query}`}
            disabled={!summary || totals?.members === 0}
            className={`${primaryBtn} mt-auto justify-center w-full`}
            icon={<FileSpreadsheet size={15} aria-hidden />}
            label={<span>Download Excel</span>}
            onStart={() => setResult("")}
            onError={setError}
          />
        </section>

        <section className="flex flex-col bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5">
          <FolderArchive size={24} className="text-green-400" aria-hidden />
          <h2 className="mt-3 text-white text-base font-bold">Member pictures (ZIP)</h2>
          <p className="mt-1 mb-4 text-gray-500 text-sm">
            {totals ? `${totals.pictures} pictures from ${scope}.` : scope}{" "}
            Each file is named with the member&apos;s membership number.
          </p>
          {progress ? (
            <div className="mt-auto" aria-live="polite">
              <div className="flex items-center justify-between gap-3 text-sm text-gray-300">
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin text-green-400" aria-hidden />
                  {progress.total ? `${progress.done} of ${progress.total} pictures` : "Getting the list..."}
                </span>
                <button type="button" onClick={() => abort.current?.abort()} className={`${secondaryBtn} !min-h-9 !px-3`}>
                  <X size={14} aria-hidden /> Cancel
                </button>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-800 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Pictures downloaded">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-500">Please keep this page open until the ZIP downloads.</p>
            </div>
          ) : (
            <button type="button" onClick={downloadPictures} disabled={!summary || !totals?.pictures} className={`${primaryBtn} mt-auto justify-center w-full disabled:opacity-60`}>
              <FolderArchive size={15} aria-hidden /> Download pictures
            </button>
          )}
        </section>
      </div>

      <div className="mt-4 empty:hidden"><Feedback error={error} success={result} /></div>
    </div>
  );
}
