"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { uploadImage } from "@/lib/uploadImage";
import type { UploadKind } from "@/lib/cloudinary";

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  kind: UploadKind;
  /** Tailwind aspect class for the preview box, e.g. "aspect-[1.586]" for an ID card. */
  aspect?: string;
  /** Checkerboard backdrop so transparent PNGs are visible. */
  transparent?: boolean;
  onError?: (message: string) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export default function ImageUploadField({
  label, hint, value, onChange, kind, aspect = "aspect-video", transparent, onError,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return onError?.("Upload a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return onError?.("Images must be 10 MB or smaller.");

    onError?.("");
    setUploading(true);
    try {
      onChange(await uploadImage(file, kind));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const backdrop = transparent
    ? "bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:16px_16px]"
    : "bg-gray-800/40";

  return (
    <div>
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">{label}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={uploading}
        onChange={handleFile}
      />
      {value ? (
        <>
          <div className={`relative ${aspect} rounded-xl border border-gray-700 overflow-hidden ${backdrop}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded artwork is shown unaltered */}
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-contain" />
            {uploading && (
              <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center gap-2 text-sm text-white">
                <Loader2 size={18} className="animate-spin" /> Uploading...
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-gray-700 disabled:opacity-50 transition"
            >
              <Upload size={14} aria-hidden /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 min-h-10 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50 transition"
            >
              <Trash2 size={14} aria-hidden /> Remove
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`w-full ${aspect} flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/40 px-4 text-gray-400 hover:border-green-600/60 hover:text-gray-200 disabled:opacity-50 transition`}
        >
          {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} aria-hidden />}
          <span className="text-sm font-semibold">{uploading ? "Uploading..." : `Upload ${label.toLowerCase()}`}</span>
          <span className="text-[11px] text-gray-500">JPG, PNG or WebP · up to 10 MB</span>
        </button>
      )}
      {hint && <p className="text-gray-500 text-[11px] mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  );
}
