"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import Image from "next/image";

const navLinks = [
  { href: "/",               label: "Home" },
  { href: "/members",        label: "Directory" },
  { href: "/members/lookup", label: "Member Lookup" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-green-100">
              <Image
                src="/logo.avif"
                alt="CFA Pakistan"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-gray-900 font-bold text-xs sm:text-sm tracking-tight truncate">
                Chamber of Food & Agriculture
              </p>
              <p className="text-green-600 text-[10px] font-semibold tracking-[0.12em] uppercase hidden xs:block">
                Pakistan — cfapak.org
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  pathname === link.href
                    ? "text-green-700 bg-green-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {pathname === link.href && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-green-500 rounded-full" />
                )}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center">
            <Link
              href="/members/lookup"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors shadow-sm"
            >
              <ShieldCheck size={14} />
              Verify Member
            </Link>
          </div>

          {/* Mobile: CTA + toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/members/lookup"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-500 transition-colors"
            >
              <ShieldCheck size={12} />
              Verify
            </Link>
            <button
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-green-700 bg-green-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
