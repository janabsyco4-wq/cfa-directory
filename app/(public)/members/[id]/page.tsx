import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import MemberPhoto from "@/components/MemberPhoto";
import { getPublicProfile } from "@/lib/members";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;

const loadProfile = cache(async (id: string) => {
  try {
    return { profile: await getPublicProfile(id), failed: false };
  } catch {
    return { profile: null, failed: true };
  }
});

export async function generateMetadata({ params }: PageProps<"/members/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await loadProfile(id);
  if (!profile) return { title: "Member not found", robots: { index: false, follow: true } };
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const role = [profile.designation, profile.district].filter(Boolean).join(", ");
  const description = `${name}${role ? ` (${role})` : ""} — ${profile.membershipCategory} member of the Chamber of Food and Agriculture Pakistan.`;
  // Member photo as the share preview; the site-wide image is the fallback when there is none.
  const images = profile.photo ? [{ url: encodeURI(profile.photo), alt: name }] : undefined;
  return {
    title: name,
    description,
    alternates: { canonical: `/members/${id}` },
    openGraph: { type: "profile", title: `${name} — CFA Pakistan member`, description, url: `/members/${id}`, ...(images && { images }) },
    twitter: { card: images ? "summary" : "summary_large_image", title: `${name} — CFA Pakistan member`, description, ...(images && { images }) },
  };
}

export default async function MemberProfilePage({ params }: PageProps<"/members/[id]">) {
  const { id } = await params;
  const { profile, failed } = await loadProfile(id);
  if (failed) throw new Error("Member profile is temporarily unavailable.");
  if (!profile) notFound();

  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const since = profile.joinedDate
    ? new Date(profile.joinedDate).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Karachi" })
    : null;

  const details = [
    { label: "Membership No.", value: profile.membershipNo },
    { label: "Category",       value: profile.membershipCategory },
    { label: "Designation",    value: profile.designation },
    { label: "District",       value: profile.district },
    { label: "Organization",   value: profile.businessName },
    { label: "Department",     value: profile.department },
    { label: "Business type",  value: profile.businessType },
    { label: "Member since",   value: since },
  ].filter((d) => d.value);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: `${SITE_URL}/members/${id}`,
    ...(profile.photo && { image: profile.photo.startsWith("http") ? profile.photo : `${SITE_URL}${encodeURI(profile.photo)}` }),
    ...(profile.designation && { jobTitle: profile.designation }),
    ...(profile.businessName && { worksFor: { "@type": "Organization", name: profile.businessName } }),
    ...(profile.district && { address: { "@type": "PostalAddress", addressLocality: profile.district, addressCountry: "PK" } }),
    memberOf: {
      "@type": "ProgramMembership",
      membershipNumber: profile.membershipNo,
      programName: `${profile.membershipCategory} membership`,
      hostingOrganization: { "@type": "Organization", name: "Chamber of Food and Agriculture Pakistan", url: SITE_URL },
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Member Directory", item: `${SITE_URL}/members` },
      { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/members/${id}` },
    ],
  };

  return (
    <div className="container-site py-4 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([personSchema, breadcrumbSchema]).replace(/</g, "\\u003c") }}
      />
      <Link href="/members" className="inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-forest hover:text-forest-deep">
        <ArrowLeft size={16} aria-hidden /> Back to Member Directory
      </Link>

      <article className="animate-rise mt-2 sm:mt-6 bg-white border border-line rounded-xl overflow-hidden grid md:grid-cols-[minmax(0,360px)_1fr]">
        {/* Photo sits in a centred portrait frame instead of stretching to the column's height */}
        <div className="flex items-center justify-center bg-canvas px-6 py-8 sm:py-10 border-b border-line md:border-b-0 md:border-r">
          <div className="w-full max-w-[240px] sm:max-w-[260px] md:max-w-[280px] rounded-xl bg-white p-2 ring-1 ring-line shadow-[0_18px_40px_-24px_rgba(16,59,43,0.55)]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-canvas">
              <MemberPhoto src={profile.photo} frame={profile.photoFrame} alt={name} priority sizes="(min-width: 768px) 280px, 260px" />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
          <p className="inline-flex items-center gap-1.5 rounded bg-forest/5 border border-forest/15 px-2.5 py-1 text-xs font-semibold text-forest">
            <BadgeCheck size={14} aria-hidden /> Active member
          </p>
          <h1 className="mt-3 sm:mt-4 text-[1.75rem] leading-tight sm:text-4xl font-extrabold text-ink break-words text-balance">{name}</h1>
          {(profile.designation || profile.businessName) && (
            <p className="mt-2 text-muted break-words">
              {[profile.designation, profile.businessName].filter(Boolean).join(", ")}
            </p>
          )}

          <dl className="mt-6 sm:mt-8 border-t border-line divide-y divide-line sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5 sm:pt-6">
            {details.map((d) => (
              <div key={d.label} className="flex items-baseline justify-between gap-4 py-3 sm:block sm:py-0">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted flex-shrink-0">{d.label}</dt>
                <dd className="sm:mt-1 text-[15px] font-medium text-ink text-right sm:text-left break-words min-w-0">{d.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 sm:mt-8 rounded-md bg-canvas border border-line p-4 text-sm text-muted flex gap-3">
            <ShieldCheck size={18} className="text-gold flex-shrink-0 mt-0.5" aria-hidden />
            <p>
              Personal contact details are kept private. To confirm a membership, use{" "}
              <Link href="/verify" className="font-semibold text-forest underline underline-offset-2">
                Verify a member
              </Link>.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
