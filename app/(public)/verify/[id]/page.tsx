import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import VerificationResult from "@/components/VerificationResult";
import { getPublicContact } from "@/lib/organization";
import { getVerificationById } from "@/lib/verification";

// QR codes on membership cards open this page; keep status (e.g. expiry) reasonably fresh.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Membership Verification",
  robots: { index: false, follow: false },
};

export default async function VerifyMemberPage({ params }: PageProps<"/verify/[id]">) {
  const { id } = await params;
  const [member, contact] = await Promise.all([getVerificationById(id), getPublicContact()]);
  if (!member) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <p className="text-gold text-xs font-bold tracking-[0.18em] uppercase">Membership verification</p>
      <h1 className="mt-2 mb-5 sm:mb-6 text-2xl sm:text-3xl font-extrabold text-ink">Official membership record</h1>
      <VerificationResult member={member} orgName={contact.name} />
      <Link href="/verify" className="mt-6 inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-forest hover:text-forest-deep">
        <ArrowLeft size={16} aria-hidden /> Verify another member
      </Link>
    </div>
  );
}
