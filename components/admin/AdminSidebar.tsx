"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, UserPlus, LogOut,
  Menu, X, ExternalLink, ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/admin",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/members", label: "Members",     icon: Users           },
  { href: "/admin/members/new", label: "Add Member", icon: UserPlus     },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-green-500/30 flex-shrink-0">
            <Image src="/logo.avif" alt="CFA" width={36} height={36} className="object-contain w-full h-full" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">CFA Admin</p>
            <p className="text-gray-500 text-[11px]">Management Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive(href)
                ? "bg-green-600 text-white shadow-lg shadow-green-900/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon size={17} className="flex-shrink-0" />
            {label}
            {isActive(href) && <ChevronRight size={14} className="ml-auto opacity-70" />}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-white transition-all"
        >
          <ExternalLink size={15} />
          View Website
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-50"
        >
          <LogOut size={15} />
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-gray-900 border-b border-gray-800 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/logo.avif" alt="CFA" width={32} height={32} className="object-contain" />
          </div>
          <span className="text-white font-bold text-sm">CFA Admin</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-gray-900 border-r border-gray-800 z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <Image src="/logo.avif" alt="CFA" width={32} height={32} className="object-contain" />
                </div>
                <span className="text-white font-bold text-sm">CFA Admin</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-800">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
