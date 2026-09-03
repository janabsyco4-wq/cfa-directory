import Image from "next/image";
import CategoryBadge from "./CategoryBadge";
import { MembershipCategory } from "@/models/Member";
import { MapPin } from "lucide-react";

interface MemberCardProps {
  membershipNo: string;
  firstName: string;
  lastName: string;
  membershipCategory: MembershipCategory;
  photo?: string;
  businessName?: string;
  district?: string;
}

const avatarGradient: Record<MembershipCategory, string> = {
  Corporate:        "from-emerald-500 to-green-600",
  Executive:        "from-blue-500   to-blue-700",
  Associate:        "from-violet-500 to-purple-700",
  Overseas:         "from-sky-500    to-cyan-700",
  Women:            "from-rose-500   to-pink-600",
  Student:          "from-amber-400  to-orange-500",
  "Honorary Member":"from-gray-500   to-gray-700",
};

export default function MemberCard({
  membershipNo,
  firstName,
  lastName,
  membershipCategory,
  photo,
  businessName,
  district,
}: MemberCardProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const gradient = avatarGradient[membershipCategory] ?? "from-green-500 to-emerald-600";

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-green-100 hover:-translate-y-1 transition-all duration-200">

      {/* Full-width photo area */}
      <div className={`relative w-full aspect-[4/3] bg-gradient-to-br ${gradient}`}>
        {photo ? (
          <Image
            src={photo}
            alt={`${firstName} ${lastName}`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white font-bold text-4xl opacity-80">{initials}</span>
          </div>
        )}

        {/* Category badge overlay — top right */}
        <div className="absolute top-2.5 right-2.5">
          <CategoryBadge category={membershipCategory} size="sm" />
        </div>
      </div>

      {/* Details below */}
      <div className="p-4 space-y-1">
        <h3 className="text-gray-900 font-bold text-sm leading-snug">
          {firstName} {lastName}
        </h3>

        {businessName && businessName !== "N/A" && (
          <p className="text-gray-500 text-xs truncate">{businessName}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
          {district ? (
            <p className="text-gray-400 text-[10px] flex items-center gap-1">
              <MapPin size={9} />
              {district}
            </p>
          ) : <span />}
          <p className="text-gray-300 text-[10px] font-mono tracking-wide">{membershipNo}</p>
        </div>
      </div>
    </div>
  );
}
