"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent, type KeyboardEvent } from "react";
import { Move, RotateCcw, ZoomIn } from "lucide-react";
import {
  DEFAULT_FRAME, MAX_ZOOM, MIN_ZOOM, frameStyle, isDefaultFrame, normalizeFrame, type PhotoFrame,
} from "@/lib/photoFrame";

interface Props {
  src: string;
  frame: PhotoFrame;
  onChange: (frame: PhotoFrame) => void;
}

const PREVIEWS = [
  { label: "Card · mobile", cls: "aspect-[4/5] w-16 rounded-md" },
  { label: "Card · desktop", cls: "aspect-[4/3] w-24 rounded-md" },
  { label: "Avatar", cls: "aspect-square w-12 rounded-xl" },
];

function Slider({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
        <span className="font-mono normal-case tracking-normal text-gray-300">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full h-6 accent-green-500 cursor-pointer"
      />
    </label>
  );
}

export default function PhotoFramer({ src, frame, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const update = (patch: Partial<PhotoFrame>) => onChange(normalizeFrame({ ...frame, ...patch }));

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: frame.x, y: frame.y };
    setDragging(true);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    const box = boxRef.current?.getBoundingClientRect();
    if (!start || !box) return;
    // Dragging the photo right reveals more of its left side, so the focus point moves the opposite way.
    update({
      x: start.x - ((e.clientX - start.px) / box.width) * 100 / frame.zoom,
      y: start.y - ((e.clientY - start.py) / box.height) * 100 / frame.zoom,
    });
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, Partial<PhotoFrame>> = {
      ArrowLeft: { x: frame.x + step }, ArrowRight: { x: frame.x - step },
      ArrowUp: { y: frame.y + step }, ArrowDown: { y: frame.y - step },
    };
    if (moves[e.key]) { e.preventDefault(); update(moves[e.key]); }
  }

  return (
    <div className="space-y-4">
      <div
        ref={boxRef}
        tabIndex={0}
        role="group"
        aria-label="Photo framing. Drag the photo or use arrow keys to reposition."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        className={`relative mx-auto w-full max-w-[260px] aspect-[4/5] rounded-xl overflow-hidden bg-gray-800 touch-none select-none outline-none ring-offset-2 ring-offset-gray-900 focus-visible:ring-2 focus-visible:ring-green-500 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <Image src={src} alt="" fill sizes="260px" draggable={false} style={frameStyle(frame)} className="pointer-events-none" />
        <div
          aria-hidden
          className={`absolute inset-0 pointer-events-none transition-opacity ${dragging ? "opacity-100" : "opacity-0"}`}
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "33.333% 33.333%",
            backgroundPosition: "-1px -1px",
          }}
        />
        {!dragging && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white whitespace-nowrap pointer-events-none">
            <Move size={12} aria-hidden /> Drag to reposition
          </span>
        )}
      </div>

      <div className="space-y-3">
        <Slider
          label="Zoom" value={frame.zoom} min={MIN_ZOOM} max={MAX_ZOOM} step={0.05}
          display={`${frame.zoom.toFixed(2)}×`} onChange={(zoom) => update({ zoom })}
        />
        <Slider
          label="Left ↔ Right" value={frame.x} min={0} max={100} step={1}
          display={`${frame.x}%`} onChange={(x) => update({ x })}
        />
        <Slider
          label="Top ↕ Bottom" value={frame.y} min={0} max={100} step={1}
          display={`${frame.y}%`} onChange={(y) => update({ y })}
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">How it will look</p>
        <div className="flex items-end justify-center gap-4">
          {PREVIEWS.map((p) => (
            <figure key={p.label} className="flex flex-col items-center gap-1.5">
              <div className={`relative overflow-hidden bg-gray-800 ${p.cls}`}>
                <Image src={src} alt="" fill sizes="96px" style={frameStyle(frame)} />
              </div>
              <figcaption className="text-[10px] text-gray-500 whitespace-nowrap">{p.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(DEFAULT_FRAME)}
        disabled={isDefaultFrame(frame)}
        className="w-full inline-flex items-center justify-center gap-2 min-h-10 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <RotateCcw size={14} aria-hidden /> Reset framing
      </button>
      <p className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-relaxed">
        <ZoomIn size={12} className="mt-0.5 flex-shrink-0" aria-hidden />
        Framing applies to the public directory card, profile page and admin lists. Save the member to apply it.
      </p>
    </div>
  );
}
