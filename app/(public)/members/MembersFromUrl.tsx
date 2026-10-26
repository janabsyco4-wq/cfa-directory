"use client";

import { useSearchParams } from "next/navigation";
import MembersClient, { parseParams } from "./MembersClient";
import type { DirectoryPage } from "@/lib/directory";

export default function MembersFromUrl({ initialData }: { initialData: DirectoryPage | null }) {
  const sp = useSearchParams();
  return <MembersClient initialData={initialData} initialParams={parseParams((k) => sp.get(k))} />;
}
