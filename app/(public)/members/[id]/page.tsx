import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import MemberPhoto from "@/components/MemberPhoto";
import { getPublicProfile } from "@/lib/members";

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
  return {
    title: name,
    description: `${name} — ${profile.membershipCategory} member of the Chamber of Food and Agriculture Pakistan.`,
    alternates: { canonical: `/members/${id}` },
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
    { label: "District",       value: profile.district },
    { label: "Organization",   value: profile.businessName },
    { label: "Business type",  value: profile.businessType },
    { label: "Member since",   value: since },
  ].filter((d) => d.value);

  return (
    <div className="container-site py-4 sm:py-12">
      <Link href="/members" className="inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-forest hover:text-forest-deep">
        <ArrowLeft size={16} aria-hidden /> Back to Member Directory
      </Link>

      <article className="animate-rise mt-2 sm:mt-6 bg-white border border-line rounded-xl overflow-hidden grid md:grid-cols-[minmax(0,360px)_1fr]">
        <div className="relative aspect-[4/5] max-h-[420px] md:max-h-none md:aspect-auto md:min-h-[440px] bg-canvas overflow-hidden">
          <MemberPhoto src={profile.photo} frame={profile.photoFrame} alt={name} priority sizes="(min-width: 768px) 360px, 100vw" />
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
          <p className="inline-flex items-center gap-1.5 rounded bg-forest/5 border border-forest/15 px-2.5 py-1 text-xs font-semibold text-forest">
            <BadgeCheck size={14} aria-hidden /> Active member
          </p>
          <h1 className="mt-3 sm:mt-4 text-[1.75rem] leading-tight sm:text-4xl font-extrabold text-ink break-words text-balance">{name}</h1>
          {profile.businessName && <p className="mt-2 text-muted break-words">{profile.businessName}</p>}

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
              <Link href="/members/lookup" className="font-semibold text-forest underline underline-offset-2">
                Verify a member
              </Link>.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
