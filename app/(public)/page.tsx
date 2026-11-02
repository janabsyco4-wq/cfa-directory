import Link from "next/link";
import Image from "next/image";
import Form from "next/form";
import { ArrowRight, ArrowUpRight, BadgeCheck, Handshake, Landmark, LockKeyhole, MapPin, Search, ShieldCheck } from "lucide-react";
import MemberCard from "@/components/MemberCard";
import { CATEGORIES } from "@/lib/directory";
import { getDirectoryStats, getDistrictCounts, getFeaturedMembers } from "@/lib/members";
import { about, FOUNDED, leadership, officialPages, TAGLINE } from "@/lib/site";
import { frameStyle } from "@/lib/photoFrame";
import { getPublicContact } from "@/lib/organization";

export const revalidate = 300;

export const metadata = {
  title: { absolute: "CFA Pakistan — Member Directory of the Chamber of Food and Agriculture" },
  description:
    "Discover members, explore professional connections, and learn about the people and organizations contributing to Pakistan's food and agriculture sector.",
  alternates: { canonical: "/" },
};

async function loadHomeData() {
  try {
    const [featured, stats, districts] = await Promise.all([
      getFeaturedMembers(4),
      getDirectoryStats(),
      getDistrictCounts(8),
    ]);
    return { featured, stats, districts };
  } catch (err) {
    // At runtime, failing the regeneration keeps the last good page (with live figures) cached.
    // Only a build without database access renders the page without them.
    if (process.env.NEXT_PHASE !== "phase-production-build") throw err;
    return { featured: [], stats: null, districts: [] };
  }
}

function heroStats(stats: { members: number; districts: number }) {
  return [
    { value: `${stats.members.toLocaleString("en-US")}+`,   label: "Active Members" },
    { value: `${stats.districts.toLocaleString("en-US")}+`, label: "Districts" },
    { value: CATEGORIES.length,                             label: "Membership Tiers" },
    { value: FOUNDED,                                       label: "Year Founded" },
  ];
}

// Promises the portal itself keeps, as described on the official member portal.
const chamberPoints = [
  { icon: Handshake,   title: "Trade & collaboration", text: "Members carry a card that opens chamber meetings, programmes, and introductions." },
  { icon: ShieldCheck, title: "A clear status",        text: "Scanning a card shows Active, Expired, or Inactive from the live record." },
  { icon: LockKeyhole, title: "Private by design",     text: "Phone numbers and email addresses stay in the admin registry." },
];

const heroBadges = [
  { icon: Landmark,   label: "Govt. Aligned" },
  { icon: MapPin,     label: "Nationwide Network" },
  { icon: BadgeCheck, label: "Verified Members" },
];

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
  const { featured, stats, districts } = await loadHomeData();
  const contact = await getPublicContact();

  const avatars = featured.filter((m) => m.photo).slice(0, 5);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: contact.name,
    alternateName: "CFA Pakistan",
    url: contact.website.href,
    logo: "https://cfa-directory.vercel.app/logo.avif",
    description: about.platform,
    email: contact.emails[0],
    telephone: contact.phone.display,
    foundingDate: FOUNDED,
    nonprofitStatus: "Nonprofit",
    address: { "@type": "PostalAddress", addressCountry: "PK", ...(contact.address && { streetAddress: contact.address }) },
    sameAs: [contact.facebook],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }} />

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

        <div className="container-site py-12 sm:py-20 lg:py-24 grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-10 xl:gap-16 items-center">
          <div className="max-w-2xl">
            <p className="animate-rise text-gold text-xs font-bold tracking-[0.18em] uppercase">
              Official Member Portal
            </p>
            <h1
              className="animate-rise mt-4 text-[2rem] leading-[1.12] sm:text-5xl lg:text-[3.4rem] font-extrabold text-white"
              style={{ animationDelay: "60ms" }}
            >
              {TAGLINE}
            </h1>
            <p className="animate-rise mt-5 text-white/80 text-base sm:text-lg leading-relaxed" style={{ animationDelay: "120ms" }}>
              Pakistan’s Chamber of Food and Agriculture unites farmers, agribusinesses, exporters, and policymakers
              to build a prosperous agricultural future.
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
                Browse Member Directory <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/verify" className="btn btn-ghost-light">
                <ShieldCheck size={16} aria-hidden /> Verify Member
              </Link>
            </div>

            <ul className="animate-rise mt-7 flex flex-wrap gap-x-5 gap-y-2.5" style={{ animationDelay: "300ms" }} aria-label="Why CFA">
              {heroBadges.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <span className="w-7 h-7 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
                    <Icon size={14} className="text-gold" aria-hidden />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {stats && (
            <aside
              aria-label={`${contact.name} at a glance`}
              className="animate-rise w-full max-w-md lg:max-w-none rounded-xl border border-white/15 bg-white/10 backdrop-blur-md p-4 sm:p-6 text-white shadow-2xl"
              style={{ animationDelay: "200ms" }}
            >
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-md bg-white p-1 flex-shrink-0">
                  <Image src={contact.logo} alt="" width={48} height={48} className="w-full h-full object-contain" />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block font-heading font-bold text-[15px] sm:text-base">{contact.name}</span>
                  <span className="block mt-0.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-gold">CFAP</span>
                </span>
              </div>
              <dl className="mt-4 sm:mt-6 grid grid-cols-2 gap-px rounded-lg overflow-hidden bg-white/15">
                {heroStats(stats).map((s) => (
                  <div key={s.label} className="flex flex-col-reverse bg-forest-deep/60 px-3.5 py-3 sm:px-4 sm:py-4">
                    <dt className="mt-1 text-[11px] sm:text-xs text-white/65">{s.label}</dt>
                    <dd className="font-heading text-xl sm:text-2xl font-extrabold tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>
              {avatars.length > 0 && (
                <div className="mt-4 sm:mt-6 flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {avatars.map((m) => (
                      <span key={m._id} className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-forest-deep bg-white">
                        <Image src={m.photo!} alt="" fill sizes="36px" className="object-cover" style={frameStyle(m.photoFrame)} />
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold">{stats.members.toLocaleString("en-US")}+ Members</p>
                </div>
              )}
            </aside>
          )}
        </div>
      </section>

      {districts.length > 0 && (
        <section aria-labelledby="districts-heading" className="container-site pt-8 sm:pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 id="districts-heading" className="text-xl sm:text-2xl font-extrabold text-ink">Members Across Pakistan</h2>
              {stats && (
                <p className="mt-1 text-sm text-muted">
                  {stats.members.toLocaleString("en-US")} active members in {stats.districts.toLocaleString("en-US")} districts
                </p>
              )}
            </div>
            <Link href="/members" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-deep">
              All districts <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {districts.map(({ district, count }) => (
              <li key={district}>
                <Link
                  href={`/members?district=${encodeURIComponent(district)}`}
                  className="group flex min-h-16 items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 transition-colors hover:border-forest/40"
                >
                  <MapPin size={16} className="shrink-0 text-gold" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink group-hover:text-forest">{district}</span>
                    <span className="block text-xs text-muted tabular-nums">
                      {count.toLocaleString("en-US")} {count === 1 ? "member" : "members"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="chamber-heading" className="container-site pt-12 sm:pt-20">
        <div className="max-w-2xl">
          <p className="eyebrow">The chamber</p>
          <h2 id="chamber-heading" className="mt-3 text-2xl sm:text-3xl font-extrabold text-ink leading-tight">
            A professional home for food and agriculture membership
          </h2>
          <p className="mt-3 text-muted leading-relaxed">
            Private administration, printed cards, and a public verification page that shows only what a card is meant to prove.
          </p>
        </div>
        <ul className="mt-6 grid sm:grid-cols-3 gap-3 sm:gap-4">
          {chamberPoints.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-lg border border-line bg-white p-5">
              <span className="w-10 h-10 rounded-md bg-forest/5 border border-forest/15 flex items-center justify-center">
                <Icon size={18} className="text-forest" aria-hidden />
              </span>
              <h3 className="mt-4 font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="membership-categories-heading" className="container-site pt-8 sm:pt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 id="membership-categories-heading" className="text-xl sm:text-2xl font-extrabold text-ink">Our Membership Categories</h2>
          <Link href="/members" className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-deep">
            Browse the directory <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <Link
                href={`/members?category=${encodeURIComponent(category)}`}
                className="group flex min-h-16 items-center justify-between gap-2 rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-forest/40 hover:text-forest"
              >
                {category}
                <ArrowRight size={15} className="shrink-0 text-gold transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
              <p className="eyebrow">Member verification</p>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-extrabold text-ink">Confirm a card. Browse the roster.</h2>
              <p className="mt-1.5 text-muted">
                Open a verification link from a membership QR code, or look up an active member in the public directory.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link href="/verify" className="btn btn-primary">Verify Member</Link>
            <Link href="/members" className="btn btn-outline">Members Directory</Link>
          </div>
        </div>
      </section>
    </>
  );
}
