import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Award, Compass, Landmark, Quote, Target } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { about, leadership, officialPages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Leadership",
  description: "Leadership of the Chamber of Food and Agriculture Pakistan.",
};

const ROLE_ICONS: Record<string, typeof Award> = { President: Award, "Secretary General": Landmark };

const commitments = [
  { icon: Target,  label: "Our mission", text: about.mission },
  { icon: Compass, label: "Our vision",  text: about.vision },
];

export default function LeadershipPage() {
  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Our Leadership"
        intro="The office bearers of the Chamber of Food and Agriculture Pakistan, as listed on the official CFA website."
      />

      {/* Office bearers */}
      <section aria-labelledby="office-bearers" className="container-site py-10 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] gap-8 lg:gap-14 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow">Office bearers</p>
            <h2 id="office-bearers" className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink leading-tight text-balance">
              Leading the chamber, by the farmers, for the farmers
            </h2>
            <p className="mt-4 text-muted leading-relaxed">{about.founding}</p>
            <p className="mt-3 text-muted leading-relaxed hidden sm:block">{about.belief}</p>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:gap-6">
            {leadership.map((p, i) => {
              const RoleIcon = ROLE_ICONS[p.title] ?? Award;
              return (
                <li
                  key={p.name}
                  className="animate-rise group flex flex-col bg-white border border-line rounded-xl overflow-hidden shadow-[0_18px_40px_-28px_rgba(16,59,43,0.55)]"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className="relative aspect-[4/5] bg-forest-deep overflow-hidden">
                    <Image
                      src={p.photo}
                      alt={`${p.name}, ${p.title}`}
                      fill
                      priority={i === 0}
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      style={{ objectPosition: p.objectPosition }}
                    />
                    {/* Shared bottom shade makes differently-lit portraits read as one set */}
                    <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest-deep/70 to-transparent" />
                    <span className="absolute left-2 top-2 sm:left-3 sm:top-3 inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/95 px-2 py-1 sm:px-3 text-[10px] sm:text-xs font-bold text-forest shadow-sm">
                      <RoleIcon size={12} className="text-gold" aria-hidden />
                      {p.title}
                    </span>
                  </div>
                  <div className="relative flex-1 p-3 sm:p-5 lg:p-6">
                    <span aria-hidden className="absolute left-3 sm:left-5 lg:left-6 top-0 h-[3px] w-10 sm:w-14 -translate-y-1/2 rounded-full bg-gold" />
                    <h3 className="font-heading text-sm sm:text-lg lg:text-xl font-extrabold text-ink leading-snug break-words">{p.name}</h3>
                    <p className="mt-1 text-xs sm:text-sm font-semibold text-forest">{p.title}</p>
                    <p className="mt-2 sm:mt-3 text-[11px] sm:text-xs text-muted leading-snug">Chamber of Food &amp; Agriculture Pakistan</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* What the leadership stands for */}
      <section aria-labelledby="commitments" className="bg-white border-y border-line">
        <div className="container-site py-10 sm:py-16">
          <p className="eyebrow">What we stand for</p>
          <h2 id="commitments" className="mt-3 text-2xl sm:text-3xl font-extrabold text-ink">The mandate our leadership carries</h2>
          <ul className="mt-6 sm:mt-8 grid md:grid-cols-2 gap-4 sm:gap-5">
            {commitments.map(({ icon: Icon, label, text }) => (
              <li key={label} className="relative rounded-xl border border-line bg-canvas p-5 sm:p-7">
                <Quote size={44} className="absolute right-4 top-4 text-forest/[0.07]" aria-hidden />
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-forest">
                  <span className="w-8 h-8 rounded-md bg-forest text-white flex items-center justify-center">
                    <Icon size={16} aria-hidden />
                  </span>
                  {label}
                </span>
                <p className="mt-4 text-ink/90 leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Full council on the official site */}
      <section className="container-site py-10 sm:py-16">
        <div className="relative overflow-hidden rounded-xl bg-forest-deep text-white p-6 sm:p-10">
          <div aria-hidden className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-[28px] border-gold/10" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-gold text-xs font-bold tracking-[0.18em] uppercase">Central Executive Council</p>
              <h2 className="mt-2 text-xl sm:text-2xl font-extrabold">Meet the full leadership team</h2>
              <p className="mt-2 text-white/75 leading-relaxed">
                The complete leadership and the Central Executive Council are published on the official CFA website.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a href={officialPages.leadership} target="_blank" rel="noopener noreferrer" className="btn btn-gold justify-center">
                Our Leadership <ArrowUpRight size={16} aria-hidden />
              </a>
              <a href={officialPages.executiveCouncil} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light justify-center">
                Executive Council <ArrowUpRight size={16} aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
