"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { navLinks } from "@/lib/site";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  // Menu is tied to the path it was opened on, so any navigation closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const setOpen = (next: boolean) => setMenuPath(next ? pathname : null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuPath(null);
    const onResize = () => window.matchMedia("(min-width: 1024px)").matches && setMenuPath(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-white transition-shadow duration-200 border-b ${
        scrolled ? "border-line shadow-[0_4px_20px_-12px_rgba(16,59,43,0.35)]" : "border-line/70"
      }`}
    >
      <div className="container-site">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0" aria-label="CFA Pakistan — Home">
            <Image
              src="/logo.avif"
              alt=""
              width={40}
              height={40}
              priority
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain flex-shrink-0"
            />
            <span className="leading-tight min-w-0">
              <span className="block font-heading font-bold text-ink text-[13px] sm:text-sm truncate">
                Chamber of Food &amp; Agriculture
              </span>
              <span className="block text-[10px] font-semibold tracking-[0.18em] uppercase text-gold">
                Pakistan
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "text-forest" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={`absolute left-3 right-3 -bottom-[13px] h-[2px] bg-gold transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/members" className="btn btn-primary hidden sm:inline-flex !min-h-0 !py-2.5">
              Explore Members
              <ArrowRight size={15} aria-hidden />
            </Link>
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 -mr-1.5 rounded-md text-ink hover:bg-canvas"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-x-0 top-16 bottom-0 w-full bg-ink/40 animate-fade"
        />
        <div id="mobile-menu" className="animate-fade lg:hidden relative border-t border-line bg-white shadow-lg max-h-[calc(100dvh-4rem)] overflow-y-auto">
          <nav aria-label="Mobile" className="container-site py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ul className="divide-y divide-line">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between min-h-12 py-3 text-base font-medium ${
                        active ? "text-forest" : "text-ink"
                      }`}
                    >
                      {link.label}
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/members"
              onClick={() => setOpen(false)}
              className="btn btn-primary w-full mt-3 sm:hidden"
            >
              Explore Members
              <ArrowRight size={15} aria-hidden />
            </Link>
          </nav>
        </div>
        </>
      )}
    </header>
  );
}
