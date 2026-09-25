import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Lookup & Verification",
  description: "Verify CFA Pakistan membership status using CNIC. Instant member profile lookup and verification for Chamber of Food and Agriculture members.",
  openGraph: {
    title: "Member Lookup — CFA Pakistan",
    description: "Verify your membership status and retrieve your full member profile",
  },
};

export default function LookupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
