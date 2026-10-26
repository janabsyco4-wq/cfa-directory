import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Eye, Target } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { about, FOUNDED, officialPages, TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About CFA",
  description: about.summary,
};

const officialLinks = [
  { label: "About Food and Agriculture", href: officialPages.about },
  { label: "Our Objectives",             href: officialPages.objectives },
  { label: "Scope of Work",              href: officialPages.scope },
  { label: "Our Partners",               href: officialPages.partners },
  { label: "Our Chambers",               href: officialPages.chambers },
  { label: "Projects",                   href: officialPages.projects },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About CFA" title="Chamber of Food and Agriculture Pakistan" intro={TAGLINE} />

      <section className="container-site py-14 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div className="space-y-5 text-muted leading-relaxed">
          <p className="text-lg text-ink leading-relaxed">{about.summary}</p>
          <p>{about.belief}</p>
          <p>{about.purpose}</p>
          <p>{about.founding}</p>
          <dl className="pt-4 grid grid-cols-2 gap-4">
            <div className="border-l-2 border-gold pl-4">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-forest">Established</dt>
              <dd className="font-heading text-2xl font-extrabold text-ink mt-1">{FOUNDED}</dd>
            </div>
            <div className="border-l-2 border-gold pl-4">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-forest">Type</dt>
              <dd className="font-heading text-lg font-bold text-ink mt-1">Non-profit, independent</dd>
            </div>
          </dl>
        </div>
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
          <Image
            src="/images/about-maize-seedlings.webp"
            alt="Young maize seedlings growing in rows of tilled soil"
            fill
            priority
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="bg-white border-y border-line">
        <div className="container-site py-14 sm:py-20 grid md:grid-cols-2 gap-5">
          {[
            { icon: Target, title: "Mission", text: about.mission },
            { icon: Eye,    title: "Vision",  text: about.vision },
          ].map((b) => (
            <div key={b.title} className="border border-line rounded-lg p-6 sm:p-8 bg-canvas">
              <b.icon size={22} className="text-gold" aria-hidden />
              <h2 className="mt-4 text-xl font-extrabold text-ink">{b.title}</h2>
              <p className="mt-3 text-muted leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-site py-14 sm:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Learn more</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-ink">On the official CFA website</h2>
          </div>
          <Link href="/members" className="btn btn-primary self-start">
            Explore Member Directory <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {officialLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 bg-white border border-line rounded-md px-5 py-4 text-sm font-semibold text-ink hover:border-forest hover:text-forest transition-colors"
              >
                {l.label}
                <ArrowUpRight size={16} className="text-gold flex-shrink-0" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
