import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

// Shown by the service worker when there is no internet and the page asked for was never saved.
export default function OfflinePage() {
  return (
    <main className="flex-1 flex items-center justify-center bg-canvas px-4 py-16">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- plain img so it loads from the phone's saved copy */}
        <img src="/logo.avif" alt="CFA Pakistan" width={88} height={88} className="mx-auto mb-6 h-22 w-22 object-contain" />
        <h1 className="font-heading text-2xl font-bold text-ink">No internet connection</h1>
        <p className="mt-3 text-muted">
          Member details, verification and cards need the internet. Connect and try again.
        </p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full reload, so the service worker answers it */}
        <a href="/" className="btn-primary mt-8 inline-block rounded-lg px-6 py-3 font-semibold">
          Try again
        </a>
      </div>
    </main>
  );
}
