import type { Metadata } from "next";
import OrganizationClient from "./OrganizationClient";

export const metadata: Metadata = { title: "Organization Setup" };

export default function OrganizationPage() {
  return <OrganizationClient />;
}
