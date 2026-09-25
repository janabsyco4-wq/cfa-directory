import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Directory",
  description: "Browse active members of the Chamber of Food and Agriculture Pakistan. View profiles of farmers, agribusinesses, exporters, and agricultural leaders across Pakistan.",
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
