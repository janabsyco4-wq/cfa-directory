import type { Metadata } from "next";
import EditMemberClient from "./EditMemberClient";

export const metadata: Metadata = { title: "Edit Member" };

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditMemberClient memberId={id} />;
}
