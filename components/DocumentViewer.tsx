"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { createPortal } from "react-dom";
import { Loader2, Minus, Plus, RotateCcw, X, ZoomIn } from "lucide-react";

/** Width ÷ height of the A4 landscape documents (certificate, notifications). */
export const DOC_RATIO = 1123 / 794;

/**
 * A document's preview on a page; tapping it opens it full screen to zoom. The loading note
 * sits behind the image, which covers it once it arrives.
 */
export function DocumentPreview({ src, sharpSrc, alt, loadingLabel }: { src: string; sharpSrc?: string; alt: string; loadingLabel: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-lg border border-line bg-canvas cursor-zoom-in"
        style={{ aspectRatio: String(DOC_RATIO) }}
        aria-label={`${alt}. Open full screen to zoom`}
      >
        <span className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-muted" aria-hidden>
          <Loader2 size={16} className="animate-spin text-forest" /> {loadingLabel}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- generated on request, not a static asset */}
        <img src={src} alt={alt} loading="lazy" className="relative h-full w-full object-contain" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] font-semibold text-white group-hover:bg-ink" aria-hidden>
          <ZoomIn size={13} /> Tap to zoom
        </span>
      </button>
      {open && <DocumentViewer src={src} sharpSrc={sharpSrc} alt={alt} ratio={DOC_RATIO} onClose={close} />}
    </>
  );
}

const MIN = 1;
const MAX = 5;
const DOUBLE_TAP = 2.5;
/** Past this zoom the light preview gets blurry, so the full-resolution image is fetched. */
const SHARP_FROM = 1.4;

type View = { scale: number; x: number; y: number };
type Point = { x: number; y: number };

/**
 * A document (certificate, notification) full screen, zoomable on any device: pinch, double-tap
 * or the buttons on phones, the wheel or buttons on computers, drag to look around. Opens in a
 * portal so no transformed parent can trap the fixed overlay.
 */
export default function DocumentViewer({
  src, sharpSrc, alt, ratio, onClose,
}: {
  /** Shown at once. */
  src: string;
  /** Full-resolution version, loaded the first time someone zooms in. */
  sharpSrc?: string;
  alt: string;
  /** Width ÷ height of the document. */
  ratio: number;
  onClose: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [wantSharp, setWantSharp] = useState(false);
  const [sharpReady, setSharpReady] = useState(false);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ dist: number; mid: Point; start: View } | null>(null);
  const drag = useRef<{ from: Point; start: View } | null>(null);
  const lastTap = useRef<{ at: number; p: Point } | null>(null);

  // Lock the page behind, close on Esc.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  /** Size of the document as drawn at zoom 1 (fitted in the stage). */
  function fitted() {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return { w: 0, h: 0, r: null };
    const w = Math.min(r.width, r.height * ratio);
    return { w, h: w / ratio, r };
  }

  /** Keeps the document covering the stage instead of drifting off it. */
  function clamp(v: View): View {
    const { w, h, r } = fitted();
    if (!r) return v;
    const scale = Math.min(MAX, Math.max(MIN, v.scale));
    const mx = Math.max(0, (w * scale - r.width) / 2);
    const my = Math.max(0, (h * scale - r.height) / 2);
    return { scale, x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) };
  }

  /** Point on screen → offset from the stage centre. */
  function local(p: Point): Point {
    const r = stage.current?.getBoundingClientRect();
    return r ? { x: p.x - (r.left + r.width / 2), y: p.y - (r.top + r.height / 2) } : { x: 0, y: 0 };
  }

  /** Zooms to `scale` keeping the point `at` (stage-centre offset) where it is. */
  function zoomAt(base: View, scale: number, at: Point): View {
    const s = Math.min(MAX, Math.max(MIN, scale));
    const k = s / base.scale;
    return clamp({ scale: s, x: at.x - (at.x - base.x) * k, y: at.y - (at.y - base.y) * k });
  }

  function apply(next: View) {
    setView(next);
    if (next.scale >= SHARP_FROM && sharpSrc) setWantSharp(true);
  }

  function onPointerDown(e: ReactPointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      drag.current = null;
      pinch.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        mid: local({ x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }),
        start: view,
      };
    } else if (pts.length === 1) {
      drag.current = { from: { x: e.clientX, y: e.clientY }, start: view };
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pinch.current && pts.length >= 2) {
      const { dist, mid, start } = pinch.current;
      const now = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const at = local({ x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 });
      const zoomed = zoomAt(start, start.scale * (now / Math.max(dist, 1)), mid);
      apply(clamp({ ...zoomed, x: zoomed.x + at.x - mid.x, y: zoomed.y + at.y - mid.y }));
    } else if (drag.current && view.scale > 1) {
      const { from, start } = drag.current;
      apply(clamp({ ...start, x: start.x + e.clientX - from.x, y: start.y + e.clientY - from.y }));
    }
  }

  function onPointerUp(e: ReactPointerEvent) {
    const start = drag.current?.from;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      drag.current = { from: p, start: view };
      return;
    }
    drag.current = null;
    // A tap (no real movement): two in quick succession toggle the zoom there.
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) return;
    const p = { x: e.clientX, y: e.clientY };
    const prev = lastTap.current;
    if (prev && e.timeStamp - prev.at < 320 && Math.hypot(p.x - prev.p.x, p.y - prev.p.y) < 30) {
      lastTap.current = null;
      apply(view.scale > 1 ? { scale: 1, x: 0, y: 0 } : zoomAt(view, DOUBLE_TAP, local(p)));
    } else {
      lastTap.current = { at: e.timeStamp, p };
    }
  }

  function onWheel(e: ReactWheelEvent) {
    apply(zoomAt(view, view.scale * Math.exp(-e.deltaY * 0.0015), local({ x: e.clientX, y: e.clientY })));
  }

  const step = (factor: number) => apply(zoomAt(view, view.scale * factor, { x: 0, y: 0 }));
  const zoomed = view.scale > 1.01;

  const btn = "w-11 h-11 inline-flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:opacity-40 transition";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[70] flex flex-col bg-[#0b0f0d]">
      <div className="flex items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <p className="text-xs text-white/70 truncate pl-1">
          {zoomed ? `${Math.round(view.scale * 100)}%` : "Pinch or double-tap to zoom"}
        </p>
        <button type="button" onClick={onClose} aria-label="Close" className={btn}>
          <X size={20} aria-hidden />
        </button>
      </div>

      <div
        ref={stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        style={{ containerType: "size" }}
        className={`relative flex-1 min-h-0 overflow-hidden touch-none select-none ${zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "center", willChange: "transform" }}
        >
          {/* Fitted to the stage, the same size fitted() works out. */}
          <div className="relative" style={{ width: `min(100cqw, 100cqh * ${ratio})`, aspectRatio: String(ratio) }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated on request, not a static asset */}
            <img src={src} alt={alt} draggable={false} className="absolute inset-0 h-full w-full object-contain" />
            {wantSharp && sharpSrc && (
              // eslint-disable-next-line @next/next/no-img-element -- generated on request, not a static asset
              <img
                src={sharpSrc}
                alt=""
                aria-hidden
                draggable={false}
                onLoad={() => setSharpReady(true)}
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${sharpReady ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </div>
        </div>
        {wantSharp && !sharpReady && (
          <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
            <Loader2 size={14} className="animate-spin" aria-hidden /> Loading sharper image...
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => step(1 / 1.5)} disabled={!zoomed} aria-label="Zoom out" className={btn}>
          <Minus size={20} aria-hidden />
        </button>
        <button type="button" onClick={() => apply({ scale: 1, x: 0, y: 0 })} disabled={!zoomed} aria-label="Fit to screen" className={btn}>
          <RotateCcw size={18} aria-hidden />
        </button>
        <button type="button" onClick={() => step(1.5)} disabled={view.scale >= MAX} aria-label="Zoom in" className={btn}>
          <Plus size={20} aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}
