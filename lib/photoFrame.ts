import type { CSSProperties } from "react";

export interface PhotoFrame {
  x: number;
  y: number;
  zoom: number;
}

export const DEFAULT_FRAME: PhotoFrame = { x: 50, y: 25, zoom: 1 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 2.5;

function clamp(v: unknown, min: number, max: number, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeFrame(v?: Partial<PhotoFrame> | null): PhotoFrame {
  return {
    x: Math.round(clamp(v?.x, 0, 100, DEFAULT_FRAME.x)),
    y: Math.round(clamp(v?.y, 0, 100, DEFAULT_FRAME.y)),
    zoom: Math.round(clamp(v?.zoom, MIN_ZOOM, MAX_ZOOM, DEFAULT_FRAME.zoom) * 100) / 100,
  };
}

export function isDefaultFrame(f: PhotoFrame) {
  return f.x === DEFAULT_FRAME.x && f.y === DEFAULT_FRAME.y && f.zoom === DEFAULT_FRAME.zoom;
}

// Scaling around the same point the crop is anchored to keeps the chosen focus centred as zoom grows.
export function frameStyle(frame?: Partial<PhotoFrame> | null): CSSProperties {
  const f = normalizeFrame(frame);
  const origin = `${f.x}% ${f.y}%`;
  return {
    objectFit: "cover",
    objectPosition: origin,
    transformOrigin: origin,
    transform: f.zoom === 1 ? undefined : `scale(${f.zoom})`,
  };
}
