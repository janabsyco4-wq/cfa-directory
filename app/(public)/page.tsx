import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import { ArrowRight, ArrowUpRight, Search, ShieldCheck } from "lucide-react";
import MemberCard from "@/components/MemberCard";
import { getDirectoryStats, getFeaturedMembers } from "@/lib/members";
import { about, contact, FOUNDED, leadership, officialPages } from "@/lib/site";

export const revalidate = 300;

export const metadata = {
  title: { absolute: "CFA Pakistan — Member Directory of the Chamber of Food and Agriculture" },
  description:
    "Discover members, explore professional connections, and learn about the people and organizations contributing to Pakistan's food and agriculture sector.",
  alternates: { canonical: "/" },
};

async function loadHomeData() {
  try {
    const [stats, featured] = await Promise.all([getDirectoryStats(), getFeaturedMembers(4)]);
    return { stats, featured };
  } catch {
    return { stats: null, featured: [] };
  }
}

const showcase = [
  {
    title: "Sustainable Agriculture",
    text: "Promoting sustainable farming and agribusiness innovation across Pakistan.",
    image: "/images/showcase-crop-rows.webp",
    alt: "Rows of young green crops growing across a cultivated field",
    href: officialPages.scope,
    cta: "Scope of work",
  },
  {
    title: "Food Security",
    text: "Strengthening the entire food and agriculture value chain.",
    image: "/images/showcase-aerial-farmland.webp",
    alt: "Aerial view of patchwork farmland divided into cultivated plots",
    href: officialPages.objectives,
    cta: "Our objectives",
  },
  {
    title: "Market Development",
    text: "Facilitating partnerships and fostering entrepreneurship in the sector.",
    image: "/images/showcase-field-landscape.webp",
    alt: "Cultivated fields and tree lines seen from above in summer",
    href: officialPages.projects,
    cta: "Projects",
  },
];

export default async function HomePage() {
  const { stats, featured } = await loadHomeData();

  const statItems = stats
    ? [
        { value: stats.members,       label: stats.members === 1 ? "Active member" : "Active members" },
        { value: stats.districts,     label: stats.districts === 1 ? "District represented" : "Districts represented" },
        { value: stats.categories,    label: stats.categories === 1 ? "Membership category" : "Membership categories" },
        { value: stats.organizations, label: stats.organizations === 1 ? "Organization listed" : "Organizations listed" },
      ].filter((s) => s.value > 0)
    : [];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Chamber of Food and Agriculture Pakistan",
    alternateName: "CFA Pakistan",
    url: "https://cfapak.org",
    logo: "https://cfa-directory.vercel.app/logo.avif",
    description: about.platform,
    email: contact.emails[0],
    telephone: contact.phone.display,
    foundingDate: FOUNDED,
    nonprofitStatus: "Nonprofit",
    address: { "@type": "PostalAddress", addressCountry: "PK" },
    sameAs: [contact.facebook],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-forest-deep">
        <Image
          src="/images/hero-wheat-harvest.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center -z-10"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep/95 via-forest-deep/85 to-forest/55" aria-hidden />

        <div className="container-site py-12 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="animate-rise text-gold text-xs font-bold tracking-[0.18em] uppercase">
              Chamber of Food &amp; Agriculture Pakistan
            </p>
            <h1
              className="animate-rise mt-4 text-[2rem] leading-[1.12] sm:text-5xl lg:text-[3.4rem] font-extrabold text-white"
              style={{ animationDelay: "60ms" }}
            >
              Connecting Pakistan’s Agriculture &amp; Food Community
            </h1>
            <p className="animate-rise mt-5 text-white/80 text-base sm:text-lg leading-relaxed" style={{ animationDelay: "120ms" }}>
              Discover members, explore professional connections, and learn about the people and organizations
              contributing to Pakistan’s food and agriculture sector.
            </p>

            <Form
              action="/members"
              role="search"
              className="animate-rise mt-8 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:bg-white sm:rounded-md sm:p-1.5 sm:shadow-lg max-w-xl"
              style={{ animationDelay: "180ms" }}
            >
              <label htmlFor="hero-search" className="sr-only">Search members by name or organization</label>
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
                <input
                  id="hero-search"
                  name="search"
                  type="search"
                  maxLength={100}
                  placeholder="Search members by name or organization"
                  className="w-full h-12 rounded-md bg-white pl-11 pr-3 text-[15px] text-ink placeholder:text-muted/80 focus:outline-none sm:focus:ring-0 focus:ring-2 focus:ring-gold"
                />
              </div>
              <button type="submit" className="btn btn-gold h-12 sm:h-auto px-6">Search</button>
            </Form>

            <div className="animate-rise mt-6 flex flex-col sm:flex-row gap-3" style={{ animationDelay: "240ms" }}>
              <Link href="/members" className="btn bg-white text-forest-deep hover:bg-canvas">
                Explore Member Directory <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/about" className="btn btn-ghost-light">Discover CFA Pakistan</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats (live from the member database) */}
      {statItems.length > 0 && (
        <section aria-label="Directory at a glance" className="bg-white border-b border-line">
          <div className="container-site">
            <dl className={`grid ${statItems.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : ["", "grid-cols-1", "grid-cols-2", "grid-cols-3"][statItems.length]}`}>
              {statItems.map((s, i) => (
                <div
                  key={s.label}
                  className={`py-6 sm:py-9 px-2 sm:px-6 text-center border-line ${
                    statItems.length >= 4
                      ? `${i % 2 === 1 ? "border-l" : ""} ${i > 0 ? "lg:border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""}`
                      : i > 0 ? "border-l" : ""
                  }`}
                >
                  <dd className="font-heading text-[1.65rem] leading-none sm:text-4xl font-extrabold text-forest">{s.value.toLocaleString()}</dd>
                  <dt className="mt-2 text-[11px] leading-snug sm:text-sm text-muted font-medium">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* About */}
      <section className="container-site py-12 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            <Image
              src="/images/about-maize-seedlings.webp"
              alt="Young maize seedlings growing in rows of tilled soil"
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-forest text-white px-5 py-4 rounded-tr-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-gold font-bold">Established</p>
              <p className="font-heading text-2xl font-extrabold">{FOUNDED}</p>
            </div>
          </div>
          <div>
            <p className="eyebrow">About CFA</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink leading-tight">
              A platform “by the farmers, for the farmers”
            </h2>
            <p className="mt-5 text-muted leading-relaxed">{about.summary}</p>
            <p className="mt-4 text-muted leading-relaxed">{about.purpose}</p>
            <blockquote className="mt-6 border-l-2 border-gold pl-4 text-ink/90 leading-relaxed">
              <span className="block text-xs font-bold uppercase tracking-[0.14em] text-forest mb-1">Our mission</span>
              {about.mission}
            </blockquote>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/about" className="btn btn-primary">Learn More <ArrowRight size={16} aria-hidden /></Link>
              <a href={officialPages.about} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Read on cfapak.org <ArrowUpRight size={16} aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Members */}
      {featured.length > 0 && (
        <section className="bg-white border-y border-line py-12 sm:py-24">
          <div className="container-site">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Member Directory</p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink">Explore Our Members</h2>
                <p className="mt-3 text-muted max-w-xl">
                  Discover professionals and organizations across Pakistan’s food and agriculture community.
                </p>
              </div>
              <Link href="/members" className="btn btn-outline self-start sm:self-auto">
                View all members <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <ul className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {featured.map((m, i) => (
                <li key={m._id} className={`flex ${i === 3 ? "lg:hidden" : ""}`}><MemberCard member={m} /></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Focus areas */}
      <section className="container-site py-12 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Our Focus</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink">Across the food and agriculture value chain</h2>
          <p className="mt-3 text-muted">{about.platform}</p>
        </div>
        <ul className="mt-8 sm:mt-10 -mx-4 px-4 sm:-mx-6 sm:px-6 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 scrollbar-hide md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {showcase.map((s) => (
            <li key={s.title} className="w-[82%] sm:w-[60%] flex-shrink-0 snap-start md:w-auto">
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block h-full bg-white border border-line rounded-lg overflow-hidden hover:border-forest/40 transition-colors"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 82vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{s.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
                    {s.cta} <ArrowUpRight size={15} aria-hidden />
                    <span className="sr-only">(opens cfapak.org in a new tab)</span>
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Leadership */}
      <section className="bg-forest-deep text-white py-12 sm:py-24">
        <div className="container-site grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="eyebrow !text-gold">Leadership</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold">The people leading CFA</h2>
            <p className="mt-4 text-white/75 leading-relaxed">{about.founding}</p>
            <Link href="/leadership" className="btn btn-gold mt-7">Meet the leadership <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:gap-6">
            {leadership.map((p) => (
              <li key={p.name}>
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-forest">
                  <Image
                    src={p.photo}
                    alt={`${p.name}, ${p.title}`}
                    fill
                    sizes="(min-width: 1024px) 300px, 50vw"
                    className="object-cover"
                    style={{ objectPosition: p.objectPosition }}
                  />
                </div>
                <p className="mt-3 font-heading font-bold text-[15px] sm:text-lg leading-snug">{p.name}</p>
                <p className="text-gold text-sm font-medium">{p.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Verify CTA */}
      <section className="container-site py-12 sm:py-20">
        <div className="bg-white border border-line rounded-lg p-6 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4">
            <span className="w-12 h-12 rounded-md bg-forest/5 border border-forest/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={22} className="text-forest" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink">Need to confirm a membership?</h2>
              <p className="mt-1.5 text-muted">Verify a CFA Pakistan member using their CNIC.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/members/lookup" className="btn btn-primary">Verify a member</Link>
            <Link href="/contact" className="btn btn-outline">Contact CFA</Link>
          </div>
        </div>
      </section>
    </>
  );
}
