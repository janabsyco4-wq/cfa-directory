import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Users, ShieldCheck,
  Sprout, Award, TrendingUp, CheckCircle2, Star, Globe,
} from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Member from "@/models/Member";

const categories = [
  { name: "Corporate",       fee: "Rs. 30,000", icon: "🏢", gradient: "from-emerald-500 to-green-600"  },
  { name: "Executive",       fee: "Rs. 5,000",  icon: "💼", gradient: "from-blue-500   to-blue-700"    },
  { name: "Associate",       fee: "Rs. 2,000",  icon: "🤝", gradient: "from-violet-500 to-purple-700"  },
  { name: "Overseas",        fee: "USD 100",    icon: "✈️",  gradient: "from-sky-500    to-cyan-700"    },
  { name: "Women",           fee: "Rs. 3,000",  icon: "👩‍🌾", gradient: "from-rose-500   to-pink-600"   },
  { name: "Student",         fee: "Free",       icon: "🎓", gradient: "from-amber-400  to-orange-500"  },
  { name: "Honorary Member", fee: "Free",       icon: "🏅", gradient: "from-gray-500   to-gray-700"    },
];

const values = [
  { icon: Sprout,     title: "Sustainable Agriculture", desc: "Promoting eco-friendly farming and responsible land management across Pakistan." },
  { icon: Globe,      title: "Global Market Access",    desc: "Connecting local producers with international buyers and trade partners." },
  { icon: TrendingUp, title: "AgriTech Innovation",     desc: "Driving technology adoption to improve yield, efficiency, and crop quality." },
  { icon: Award,      title: "Policy Advocacy",         desc: "Acting as the voice of Pakistan's food and agriculture sector at every level." },
];

async function getLiveStats() {
  try {
    await connectDB();
    const [total, districts] = await Promise.all([
      Member.countDocuments({ status: "Active" }),
      Member.distinct("district", { status: "Active", district: { $nin: [null, ""] } }),
    ]);
    return { total, districts: districts.length };
  } catch {
    return { total: 0, districts: 0 };
  }
}

export const metadata = {
  title: "Home — Empowering Farmers, Feeding the Future",
  description: "CFA Pakistan unites farmers, agribusinesses, industry experts, and stakeholders to promote sustainable agriculture, food security, and market development across Pakistan.",
  openGraph: {
    title: "CFA Pakistan — Empowering Farmers, Feeding the Future",
    description: "Chamber of Food and Agriculture Pakistan unites farmers, agribusinesses, exporters, and policymakers to build a prosperous agricultural future.",
    images: ["/logo.avif"],
  },
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function HomePage() {
  const live = await getLiveStats();

  const stats = [
    { value: "3,000+", label: "Active Members",    sub: "and growing fast"      },
    { value: "36+",    label: "Districts",          sub: "nationwide coverage"   },
    { value: "7",      label: "Membership Tiers",   sub: "for every stakeholder" },
    { value: "2024",   label: "Year Founded",       sub: "a new chapter begins"  },
  ];

  // Structured data for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Chamber of Food and Agriculture Pakistan",
    alternateName: "CFA Pakistan",
    url: "https://cfa-directory.vercel.app",
    logo: "https://cfa-directory.vercel.app/logo.avif",
    description: "Pakistan's Chamber of Food and Agriculture unites farmers, agribusinesses, exporters, and policymakers to build a prosperous agricultural future.",
    email: "chamberoffoodandagriculturepk@gmail.com",
    telephone: "+92 342 2500004",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      addressCountry: "PK",
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative hero-gradient overflow-hidden flex items-center">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">

            {/* Left — copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-semibold tracking-wider uppercase mb-4 sm:mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse flex-shrink-0" />
                Official Member Portal
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] font-extrabold text-white leading-[1.1] tracking-tight mb-4 sm:mb-5">
                Empowering{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-200 to-emerald-100">Farmers,</span>{" "}
                Feeding the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">Future.</span>
              </h1>

              <p className="text-green-100 text-base sm:text-lg leading-relaxed mb-6 sm:mb-7 max-w-lg mx-auto lg:mx-0">
                Pakistan's Chamber of Food and Agriculture unites farmers, agribusinesses,
                exporters, and policymakers to build a prosperous agricultural future.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/members"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-green-700 font-bold text-sm hover:bg-green-50 transition-colors shadow-lg shadow-black/20"
                >
                  Browse Directory
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/members/lookup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/15 transition-colors"
                >
                  <ShieldCheck size={16} />
                  Verify a Member
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6">
                {["Govt. Aligned", "Nationwide Network", "Verified Members"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-green-200 text-xs font-medium">
                    <CheckCircle2 size={12} className="text-green-300 flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating card (lg+ only) */}
            <div className="hidden lg:flex justify-end">
              <div className="relative w-80">
                <div className="bg-white rounded-3xl p-6 shadow-2xl shadow-black/30">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-green-100 flex-shrink-0">
                      <Image 
                        src="/logo.avif" 
                        alt="CFA Pakistan Logo" 
                        width={48} 
                        height={48} 
                        className="object-contain"
                        priority
                        quality={90}
                      />
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-sm">CFA Pakistan</p>
                      <p className="text-green-600 text-xs font-semibold">Member Network</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {stats.map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                        <p className="text-gray-500 text-[11px] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                    <div className="flex -space-x-2">
                      {[11, 47, 15, 45, 12].map((n) => (
                        <div key={n} className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white flex-shrink-0">
                          <Image 
                            src={`https://i.pravatar.cc/28?img=${n}`} 
                            alt="Member avatar" 
                            width={28} 
                            height={28}
                            loading="lazy"
                            quality={75}
                          />
                        </div>
                      ))}
                    </div>
                    <span className="text-green-700 text-xs font-semibold">{live.total > 0 ? `${live.total}+` : "3,000+"} Members</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-amber-400 text-gray-900 rounded-2xl px-3 py-2 shadow-lg flex items-center gap-1.5">
                  <Star size={12} className="fill-gray-900 flex-shrink-0" />
                  <span className="text-xs font-bold">Trusted Network</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`px-4 sm:px-6 py-6 sm:py-8 text-center ${
                  i < stats.length - 1 ? "border-r border-gray-100" : ""
                } ${i >= 2 ? "border-t md:border-t-0 border-gray-100" : ""}`}
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-green-600 font-semibold text-xs sm:text-sm mt-0.5">{s.label}</p>
                <p className="text-gray-400 text-[11px] mt-0.5 hidden sm:block">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-green-600 text-xs font-bold tracking-[0.2em] uppercase mb-3">About CFA</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-5">
              Pakistan's Premier Food &
              <span className="text-green-600"> Agriculture Chamber</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4 text-sm sm:text-[15px]">
              CFA serves as a national resource center, think tank, and global platform for
              facilitating partnerships, driving policy advocacy, and fostering entrepreneurship
              in Pakistan's food and agriculture sectors.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-[15px] mb-7">
              We empower farmers, enhance the agricultural value chain, and contribute to
              Pakistan's economic ecosystem through trade, technology adoption, and sustainable
              agricultural development.
            </p>
            <Link
              href="/members"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors shadow-sm"
            >
              View Our Members <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {values.map((v, i) => (
              <div
                key={v.title}
                className={`rounded-2xl p-4 sm:p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  i % 2 === 0
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-white border-gray-100 text-gray-800"
                }`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${
                  i % 2 === 0 ? "bg-white/20" : "bg-green-50"
                }`}>
                  <v.icon size={16} className={i % 2 === 0 ? "text-white" : "text-green-600"} />
                </div>
                <h3 className={`font-bold text-xs sm:text-sm mb-1 sm:mb-1.5 ${i % 2 === 0 ? "text-white" : "text-gray-900"}`}>
                  {v.title}
                </h3>
                <p className={`text-[11px] sm:text-xs leading-relaxed ${i % 2 === 0 ? "text-green-100" : "text-gray-500"}`}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEMBERSHIP TIERS ─────────────────────────────────────────────── */}
      <section className="bg-gray-950 py-14 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">Membership</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 sm:mb-4">
              Join CFA Pakistan
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-[15px] px-4">
              Choose the tier that fits your role and become part of Pakistan's most
              impactful agriculture network.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat, i) => (
              <div
                key={cat.name}
                className={`relative rounded-2xl p-4 sm:p-5 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${
                  i === 0
                    ? "bg-gradient-to-br from-green-600 to-emerald-500 text-white ring-2 ring-green-400/50"
                    : "bg-gray-900 border border-gray-800 text-gray-200 hover:border-gray-600"
                }`}
              >
                {i === 0 && (
                  <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[9px] sm:text-[10px] font-bold bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full tracking-wider">
                    POPULAR
                  </span>
                )}
                <div className="text-xl sm:text-2xl mb-2 sm:mb-3">{cat.icon}</div>
                <h3 className={`font-bold text-xs sm:text-sm mb-1 ${i === 0 ? "text-white" : "text-gray-100"}`}>
                  {cat.name}
                </h3>
                <p className={`text-base sm:text-xl font-extrabold ${i === 0 ? "text-white" : "text-green-400"}`}>
                  {cat.fee}
                </p>
                <p className={`text-[10px] sm:text-[11px] mt-0.5 ${i === 0 ? "text-green-100" : "text-gray-500"}`}>
                  per annum
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIRECTORY CTA ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-green-700 to-emerald-600 p-7 sm:p-10 lg:p-16 text-white">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-semibold mb-5 sm:mb-6">
                <Users size={12} />
                Member Directory
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-3 sm:mb-4">
                Explore Our Members
              </h2>
              <p className="text-green-100 text-sm sm:text-[15px] leading-relaxed mb-6 sm:mb-8 max-w-lg">
                Browse Pakistan's food and agriculture leaders — farmers, processors,
                exporters, and innovators — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/members"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-green-700 font-bold text-sm hover:bg-green-50 transition-colors shadow-lg"
                >
                  View Directory <ArrowRight size={15} />
                </Link>
                <Link
                  href="/members/lookup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  <ShieldCheck size={15} />
                  Verify Membership
                </Link>
              </div>
            </div>

            {/* Right decorative grid — lg only */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              {[
                { label: "Corporate", count: "30K"  },
                { label: "Executive", count: "5K"   },
                { label: "Associate", count: "2K"   },
                { label: "Overseas",  count: "$100" },
                { label: "Women",     count: "3K"   },
                { label: "Student",   count: "Free" },
              ].map((c) => (
                <div key={c.label} className="glass rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{c.count}</p>
                  <p className="text-green-100 text-[11px] mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
