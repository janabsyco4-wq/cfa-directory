"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
export default function AppTabBar() {
  const pathname = usePathname();
  return (
    <>
      {/* Keeps the footer clear of the fixed bar. */}
      <div aria-hidden className="hidden app:block h-[calc(4rem+env(safe-area-inset-bottom))]" />
      <nav
        aria-label="App"
        className="hidden app:block fixed inset-x-0 bottom-0 z-50 bg-white border-t border-line shadow-[0_-4px_20px_-12px_rgba(16,59,43,0.35)] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] ${
                    active ? "text-forest font-semibold" : "text-muted font-medium"
                  }`}
                >
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-forest/10" : ""
                    }`}
                  >
                    <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
