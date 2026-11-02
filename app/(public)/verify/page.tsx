import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { getPublicContact } from "@/lib/organization";
import VerifyClient from "./VerifyClient";

export const metadata: Metadata = {
  title: "Verify Membership",
  description: "Verify a Chamber of Food & Agriculture Pakistan membership by membership card number or CNIC.",
  alternates: { canonical: "/verify" },
};

export default async function VerifyPage() {
  const { name } = await getPublicContact();
  return (
    <>
      <PageHeader
        eyebrow="Member verification"
        title="Verify Membership"
        intro="Confirm a CFA Pakistan membership by membership card number or CNIC. Private contact details are never shown."
      />
      <VerifyClient orgName={name} />
    </>
  );
}
