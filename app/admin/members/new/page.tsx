import type { Metadata } from "next";
import MemberForm from "@/components/admin/MemberForm";

export const metadata: Metadata = { title: "Add Member" };

export default function NewMemberPage() {
  return <MemberForm mode="new" />;
}
