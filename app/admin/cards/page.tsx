import type { Metadata } from "next";
import CardsClient from "./CardsClient";

export const metadata: Metadata = { title: "Membership Cards" };

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const { member } = await searchParams;
  return <CardsClient initialMemberId={typeof member === "string" ? member : undefined} />;
}
