import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { leadership, officialPages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Leadership",
  description: "Leadership of the Chamber of Food and Agriculture Pakistan.",
};

export default function LeadershipPage() {
  return (
    <>
      <PageHeader
        eyebrow="Leadership"
        title="Our Leadership"
        intro="The office bearers of the Chamber of Food and Agriculture Pakistan, as listed on the official CFA website."
      />

      <section className="container-site py-14 sm:py-20">
        <ul className="grid gap-6 sm:grid-cols-2 max-w-4xl">
          {leadership.map((p, i) => (
            <li key={p.name} className="animate-rise bg-white border border-line rounded-lg overflow-hidden" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="relative aspect-[4/5] bg-canvas">
                <Image
                  src={p.photo}
                  alt={`${p.name}, ${p.title}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 640px) 440px, 100vw"
                  className="object-cover"
                  style={{ objectPosition: p.objectPosition }}
                />
              </div>
              <div className="p-5 sm:p-6 border-t-2 border-gold">
                <h2 className="text-xl font-extrabold text-ink">{p.name}</h2>
                <p className="mt-1 text-forest font-semibold">{p.title}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 bg-white border border-line rounded-lg p-6 sm:p-8 max-w-4xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-muted">
            The full leadership and Central Executive Council are published on the official website.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={officialPages.leadership} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Our Leadership <ArrowUpRight size={16} aria-hidden />
            </a>
            <a href={officialPages.executiveCouncil} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Executive Council <ArrowUpRight size={16} aria-hidden />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
