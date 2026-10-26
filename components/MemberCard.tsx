import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import MemberPhoto from "@/components/MemberPhoto";
import type { PublicMember } from "@/lib/directory";

export default function MemberCard({ member, priority }: { member: PublicMember; priority?: boolean }) {
  const name = `${member.firstName} ${member.lastName}`.trim();
  const number = member.membershipNo.replace(/^M\s*No\.?\s*/i, "");

  return (
    <article className="group relative w-full flex flex-col bg-card border border-line rounded-xl overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:border-forest/40 hover:shadow-[0_10px_30px_-18px_rgba(16,59,43,0.45)] motion-safe:active:scale-[0.98] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold">
      <div className="relative aspect-[4/5] sm:aspect-[4/3] bg-canvas overflow-hidden">
        <MemberPhoto
          src={member.photo}
          frame={member.photoFrame}
          alt={name}
          priority={priority}
          sizes="(min-width: 1024px) 400px, 50vw"
        />
        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded bg-white/95 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-forest shadow-sm">
          {member.membershipCategory}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-5">
        <h3 className="font-heading font-bold text-ink text-sm sm:text-[17px] leading-snug line-clamp-2 break-words">{name}</h3>
        {member.businessName && (
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1 truncate">{member.businessName}</p>
        )}

        <dl className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 text-xs sm:text-[13px] text-muted">
          {member.district && (
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <dt className="sr-only">District</dt>
              <MapPin size={13} className="text-gold flex-shrink-0" aria-hidden />
              <dd className="truncate">{member.district}</dd>
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <dt className="text-muted/80">
              <span className="sm:hidden">No.</span>
              <span className="hidden sm:inline">Membership No.</span>
            </dt>
            <dd className="font-medium text-ink truncate">{number}</dd>
          </div>
        </dl>

        <div className="mt-auto pt-3 sm:pt-4">
          <Link
            href={`/members/${member._id}`}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-forest after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            aria-label={`View profile of ${name}`}
          >
            View Profile
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
