import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Directory",
  description: "Browse active members of the Chamber of Food and Agriculture Pakistan and view their public directory profiles.",
  openGraph: {
    title: "Member Directory — CFA Pakistan",
    description: "All active members of the Chamber of Food and Agriculture Pakistan",
  },
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
