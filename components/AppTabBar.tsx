"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, House, Info, Phone, Users, type LucideIcon } from "lucide-react";

type Tab = { href: string; label: string; icon: LucideIcon; also?: string[] };

// Leadership opens from the About page, so the About tab stays lit there.
const tabs: Tab[] = [
  { href: "/",        label: "Home",    icon: House },
  { href: "/members", label: "Members", icon: Users },
  { href: "/verify",  label: "Verify",  icon: BadgeCheck },
  { href: "/about",   label: "About",   icon: Info, also: ["/leadership"] },
  { href: "/contact", label: "Contact", icon: Phone },
];

function isActive(pathname: string, tab: Tab) {
  if (tab.href === "/") return pathname === "/";
  return [tab.href, ...(tab.also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`));
}

// Bottom navigation shown only inside the Android app (see the `app` variant in globals.css).
// A floating, see-through capsule like WhatsApp's: one rounded highlight slides to the tapped tab
// straight away, before the new page has finished loading.
export default function AppTabBar() {
  const pathname = usePathname();
  // The tab just tapped, tied to the path it was tapped on so it clears once the page changes.
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  const pending = tapped && tapped.from === pathname ? tapped.href : null;
  const activeIndex = tabs.findIndex((t) => (pending ? pending === t.href : isActive(pathname, t)));

  return (
    <>
      {/* Keeps the footer clear of the floating bar. */}
      <div aria-hidden className="hidden app:block h-[calc(5.75rem+env(safe-area-inset-bottom))]" />
      <nav
        aria-label="App"
        className="hidden app:block fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-full border border-white/70 bg-white/65 backdrop-blur-xl backdrop-saturate-150 shadow-[0_10px_40px_-8px_rgba(16,40,30,0.35),0_2px_6px_-2px_rgba(16,40,30,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]"
      >
        <ul className="relative grid grid-cols-5 h-16 p-1">
          {/* The sliding highlight behind the active tab. */}
          <li
            aria-hidden
            className={`absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/5)] rounded-full bg-ink/[0.07] transition-[translate,opacity] duration-[400ms] ease-[cubic-bezier(0.3,1.3,0.5,1)] ${
              activeIndex < 0 ? "opacity-0" : "opacity-100"
            }`}
            style={{ translate: `${Math.max(activeIndex, 0) * 100}% 0` }}
          />
          {tabs.map((tab, i) => {
            const active = i === activeIndex;
            const Icon = tab.icon;
            return (
              <li key={tab.href} className="relative">
                <Link
                  href={tab.href}
                  onClick={() => !isActive(pathname, tab) && setTapped({ href: tab.href, from: pathname })}
                  aria-current={active ? "page" : undefined}
                  className="flex h-full flex-col items-center justify-center gap-0.5 rounded-full select-none active:scale-95 transition-[scale] duration-150 [-webkit-tap-highlight-color:transparent]"
                >
                  <Icon
                    size={23}
                    strokeWidth={active ? 2.3 : 1.9}
                    aria-hidden
                    className={`transition-colors duration-300 ${active ? "text-forest" : "text-ink"}`}
                  />
                  <span
                    className={`text-[11px] font-semibold transition-colors duration-300 ${
                      active ? "text-forest" : "text-ink"
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
