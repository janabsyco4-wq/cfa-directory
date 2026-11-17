// CFA Pakistan app service worker.
//
// What it keeps on the phone, so the app opens fast and the fixed parts show without internet:
//   - build files (/_next/static): saved once, they never change under the same name
//   - icons, logo, fonts and site images: shown from the phone, refreshed in the background
//   - the public pages below: always fetched fresh when online (so contact details and other
//     admin edits show at once); the last copy is shown only when there is no internet
//
// What it never touches: /api (members, verify, cards, PDFs), /admin, other websites
// (member photos on Cloudinary) and anything that is not a GET.

const VERSION = "v1";
const STATIC_CACHE = `cfa-static-${VERSION}`;
const ASSET_CACHE = `cfa-assets-${VERSION}`;
const PAGE_CACHE = `cfa-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

// Pages that are safe to show from the phone when offline. Member lists come from /api,
// so these pages hold no member data of their own.
const OFFLINE_PAGES = ["/", "/about", "/contact", "/leadership", "/members", "/members/lookup", "/verify"];
const PRECACHE = [OFFLINE_URL, ...OFFLINE_PAGES, "/icon.png", "/logo.avif"];

const MAX_ASSETS = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      // One missing page must not stop the rest from being saved.
      await Promise.all(
        PRECACHE.map((url) =>
          fetch(url, { cache: "no-store" })
            .then((res) => (res.ok ? cache.put(url, res) : undefined))
            .catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, ASSET_CACHE, PAGE_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith("cfa-") && !keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/api") return;
  if (url.pathname.startsWith("/admin")) return;
  if (url.pathname === "/sw.js") return;

  // Next.js page data for in-app navigation: always live. If it fails, Next.js reloads the
  // page as a normal navigation, which the branch below answers from the phone.
  if (req.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (req.mode === "navigate") {
    event.respondWith(page(req, url));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/image") || /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, event));
  }
});

// Fresh from the server when online; the saved copy (or the offline page) when not.
async function page(req, url) {
  const key = url.pathname.replace(/\/+$/, "") || "/";
  const savable = OFFLINE_PAGES.includes(key) && !url.search;
  try {
    const res = await fetch(req);
    if (savable && res.ok && res.type === "basic") {
      const cache = await caches.open(PAGE_CACHE);
      await cache.put(key, res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(PAGE_CACHE);
    return (
      (savable && (await cache.match(key))) ||
      (await cache.match(OFFLINE_URL)) ||
      new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
    );
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(ASSET_CACHE);
  // Any cache: the logo and icon are saved with the pages at install time.
  const hit = await caches.match(req);
  const refresh = fetch(req)
    .then(async (res) => {
      if (res.ok) {
        await cache.put(req, res.clone());
        await trim(cache);
      }
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  return (await refresh) || new Response("", { status: 504 });
}

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ASSETS; i++) await cache.delete(keys[i]);
}
