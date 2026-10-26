"use client";

import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-site py-20 text-center">
      <AlertTriangle size={32} className="mx-auto text-gold" aria-hidden />
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Something went wrong</h1>
      <p className="mt-2 text-muted">This page could not be loaded right now. Please try again.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          <RotateCw size={15} aria-hidden /> Try again
        </button>
        <Link href="/" className="btn btn-outline">Go home</Link>
      </div>
    </div>
  );
}
