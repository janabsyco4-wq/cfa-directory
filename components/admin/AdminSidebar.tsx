"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, UserPlus, LogOut,
  Menu, X, ExternalLink,
} from "lucide-react";

const navItems = [
  { href: "/admin",             label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/members",     label: "Members",    icon: Users           },
  { href: "/admin/members/new", label: "Add Member", icon: UserPlus        },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // Longest matching prefix wins so "Add Member" doesn't also light up "Members".
  const activeHref = navItems
    .map((n) => n.href)
    .filter((href) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)))
    .sort((a, b) => b.length - a.length)[0];
  const current = pathname.endsWith("/edit")
    ? "Edit Member"
    : navItems.find((n) => n.href === activeHref)?.label ?? "Admin";

  const brand = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/95 p-0.5 flex-shrink-0">
        <Image src="/logo.avif" alt="" width={36} height={36} className="object-contain w-full h-full" />
      </div>
      <div className="min-w-0">
        <p className="text-white font-bold text-sm leading-tight">CFA Admin</p>
        <p className="text-gray-500 text-[11px]">Member management</p>
      </div>
    </div>
  );

  const links = (
    <div className="flex flex-col h-full">
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 min-h-11 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-green-600/15 text-green-300 ring-1 ring-inset ring-green-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={17} className="flex-shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 min-h-11 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ExternalLink size={15} aria-hidden />
          View Website
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 min-h-11 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <LogOut size={15} aria-hidden />
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 z-40">
        <div className="px-5 h-20 flex items-center border-b border-gray-800">{brand}</div>
        {links}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-3 flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="w-11 h-11 -ml-1 flex items-center justify-center rounded-xl text-gray-300 hover:bg-gray-800 transition"
        >
          <Menu size={20} />
        </button>
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/95 p-0.5 flex-shrink-0">
          <Image src="/logo.avif" alt="" width={32} height={32} className="object-contain w-full h-full" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] text-gray-500">CFA Admin</p>
          <p className="text-white font-semibold text-sm truncate">{current}</p>
        </div>
        {activeHref !== "/admin/members/new" && (
          <Link
            href="/admin/members/new"
            aria-label="Add member"
            className="ml-auto w-11 h-11 flex items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-500 transition"
          >
            <UserPlus size={18} />
          </Link>
        )}
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/60 animate-[fade_.15s_ease-out]" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[min(18rem,85vw)] bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl animate-[drawer-in_.2s_ease-out]">
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
              {brand}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{links}</div>
          </aside>
        </div>
      )}
    </>
  );
}
