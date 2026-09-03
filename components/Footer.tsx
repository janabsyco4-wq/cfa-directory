import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="h-1 bg-gradient-to-r from-green-600 via-green-400 to-emerald-400" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 p-1 ring-1 ring-white/10">
                <Image
                  src="/logo.avif"
                  alt="CFA Pakistan Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-white font-bold text-sm sm:text-base truncate">Chamber of Food & Agriculture</p>
                <p className="text-green-400 text-[11px] font-semibold tracking-[0.12em] uppercase mt-0.5">
                  Pakistan
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              Empowering Farmers, Feeding the Future. Pakistan's premier platform
              uniting the food and agriculture sector for sustainable growth.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-green-400 text-xs font-medium">Portal Active</span>
            </div>
          </div>

          {/* Spacer — desktop only */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-4">
              Navigation
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/",               label: "Home" },
                { href: "/members",        label: "Member Directory" },
                { href: "/members/lookup", label: "Verify a Member" },
                { href: "/admin",          label: "Admin Panel" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-green-400 transition-colors flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-white font-semibold text-xs tracking-[0.2em] uppercase mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              <li>
                <a
                  href="mailto:chamberoffoodandagriculturepk@gmail.com"
                  className="group flex items-start gap-3 hover:text-green-400 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail size={12} className="text-green-400" />
                  </div>
                  <span className="text-xs sm:text-sm break-all leading-relaxed">
                    chamberoffoodandagriculturepk@gmail.com
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+923422500004"
                  className="group flex items-center gap-3 hover:text-green-400 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Phone size={12} className="text-green-400" />
                  </div>
                  <span className="text-xs sm:text-sm">+92 342 2500004</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <MapPin size={12} className="text-green-400" />
                </div>
                <span className="text-xs sm:text-sm">Pakistan</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Chamber of Food and Agriculture Pakistan. All rights reserved.
          </p>
          <a
            href="https://cfapak.org"
            className="flex items-center gap-1.5 text-gray-500 hover:text-green-400 text-xs transition-colors"
          >
            cfapak.org
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </footer>
  );
}
