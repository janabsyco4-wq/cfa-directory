import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, ExternalLink } from "lucide-react";
import { about, contact, navLinks, OFFICIAL_SITE, TAGLINE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-white/70">
      <div className="container-site pt-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:py-16">
        <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-md bg-white p-1 flex-shrink-0">
                <Image src="/logo.avif" alt="" width={48} height={48} className="w-full h-full object-contain" />
              </span>
              <span className="leading-tight">
                <span className="block font-heading font-bold text-white">Chamber of Food &amp; Agriculture</span>
                <span className="block text-[11px] font-semibold tracking-[0.18em] uppercase text-gold mt-0.5">Pakistan</span>
              </span>
            </div>
            <p className="mt-5 text-sm leading-relaxed max-w-md">{about.platform}</p>
            <p className="mt-3 text-sm font-medium text-gold">{TAGLINE}</p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-7">
            <h2 className="text-white text-xs font-bold tracking-[0.16em] uppercase mb-4">Explore</h2>
            <ul className="sm:space-y-2.5 text-[15px] sm:text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex items-center min-h-10 sm:min-h-0 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/members/lookup" className="inline-flex items-center min-h-10 sm:min-h-0 hover:text-white transition-colors">Verify a Member</Link>
              </li>
              <li>
                <Link href="/admin" className="inline-flex items-center min-h-10 sm:min-h-0 hover:text-white transition-colors">Admin Panel</Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="text-white text-xs font-bold tracking-[0.16em] uppercase mb-4">Contact</h2>
            <ul className="space-y-1 sm:space-y-3 text-[15px] sm:text-sm">
              <li>
                <a href={`mailto:${contact.emails[0]}`} className="flex items-start gap-2.5 py-2 sm:py-0 hover:text-white transition-colors">
                  <Mail size={15} className="text-gold mt-0.5 flex-shrink-0" aria-hidden />
                  <span className="break-all">{contact.emails[0]}</span>
                </a>
              </li>
              <li>
                <a href={contact.phone.href} className="flex items-center gap-2.5 py-2 sm:py-0 hover:text-white transition-colors">
                  <Phone size={15} className="text-gold flex-shrink-0" aria-hidden />
                  {contact.phone.display}
                </a>
              </li>
              <li>
                <a
                  href={contact.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 py-2 sm:py-0 hover:text-white transition-colors"
                >
                  <ExternalLink size={15} className="text-gold flex-shrink-0" aria-hidden />
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-center sm:text-left">
          <p>© {new Date().getFullYear()} Chamber of Food and Agriculture Pakistan. All rights reserved.</p>
          <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            Official website: cfapak.org <ExternalLink size={11} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
