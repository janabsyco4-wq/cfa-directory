import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, Phone, Globe, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { contact, officialPages, OFFICIAL_SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the Chamber of Food and Agriculture Pakistan.",
};

export default function ContactPage() {
  const items = [
    ...contact.emails.map((e) => ({ icon: Mail, label: "Email", value: e, href: `mailto:${e}`, external: false })),
    { icon: Phone, label: "Phone",    value: contact.phone.display, href: contact.phone.href, external: false },
    { icon: Globe, label: "Facebook", value: "facebook.com/pakistankisanboard", href: contact.facebook, external: true },
    { icon: Globe, label: "Website",  value: "cfapak.org", href: OFFICIAL_SITE, external: true },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Get in touch with CFA Pakistan"
        intro="Reach the Chamber of Food and Agriculture through its official contact channels."
      />

      <section className="container-site py-14 sm:py-20 grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
        <ul className="grid sm:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <li key={it.value} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <a
                href={it.href}
                {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex h-full items-start gap-4 bg-white border border-line rounded-lg p-5 hover:border-forest transition-colors"
              >
                <span className="w-10 h-10 rounded-md bg-forest/5 border border-forest/15 flex items-center justify-center flex-shrink-0">
                  <it.icon size={18} className="text-forest" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-[0.14em] text-muted">{it.label}</span>
                  <span className="block mt-1 font-semibold text-ink break-all">{it.value}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <aside className="bg-forest-deep text-white rounded-lg p-6 sm:p-8">
          <ShieldCheck size={24} className="text-gold" aria-hidden />
          <h2 className="mt-4 text-xl font-extrabold">Verifying a member?</h2>
          <p className="mt-2 text-white/75 leading-relaxed">
            You can confirm an active CFA Pakistan membership online using the member’s CNIC.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/members/lookup" className="btn btn-gold">Verify a member</Link>
            <a href={officialPages.contact} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
              Contact page on cfapak.org <ArrowUpRight size={16} aria-hidden />
            </a>
          </div>
        </aside>
      </section>
    </>
  );
}
