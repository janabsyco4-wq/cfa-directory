import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, ExternalLink, MapPin, Globe } from "lucide-react";
import { navLinks, TAGLINE } from "@/lib/site";
import { getPublicContact } from "@/lib/organization";

export default async function Footer() {
  const contact = await getPublicContact();
  const items = [
    { icon: Phone,  label: "Phone",   value: contact.phone.display, href: contact.phone.href },
    { icon: MapPin, label: "Address", value: contact.address },
    { icon: Globe,  label: "Website", value: contact.website.display, href: contact.website.href, external: true },
    { icon: Mail,   label: "Email",   value: contact.emails[0], href: `mailto:${contact.emails[0]}` },
  ].filter((i) => i.value);

  return (
    <footer className="bg-forest-deep text-white/70">
      <div className="container-site pt-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:py-16">
        <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-md bg-white p-1 flex-shrink-0">
                <Image src={contact.logo} alt="" width={48} height={48} className="w-full h-full object-contain" />
              </span>
              <span className="leading-tight font-heading font-bold text-white">{contact.name}</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed max-w-md">
              Membership verification for the Chamber of Food &amp; Agriculture Pakistan.
            </p>
            <p className="mt-3 text-sm font-medium text-gold">{TAGLINE}</p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-6">
            <h2 className="text-white text-xs font-bold tracking-[0.16em] uppercase mb-4">Explore</h2>
            <ul className="sm:space-y-2.5 text-[15px] sm:text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex items-center min-h-10 sm:min-h-0 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/admin/login" className="inline-flex items-center min-h-10 sm:min-h-0 hover:text-white transition-colors">Admin login</Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h2 className="text-white text-xs font-bold tracking-[0.16em] uppercase mb-4">Contact</h2>
            <dl className="space-y-3 text-[15px] sm:text-sm">
              {items.map(({ icon: Icon, label, value, href, external }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={15} className="text-gold mt-1 flex-shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</dt>
                    <dd className="mt-0.5">
                      {href ? (
                        <a
                          href={href}
                          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className="break-all text-white/85 hover:text-white transition-colors"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="whitespace-pre-line text-white/85">{value}</span>
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-center sm:text-left">
          <p>© {new Date().getFullYear()} {contact.name}. All rights reserved.</p>
          <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
            Facebook <ExternalLink size={11} aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
