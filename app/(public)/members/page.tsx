import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { queryMembers } from "@/lib/members";
import { PAGE_SIZE, type DirectoryPage } from "@/lib/directory";
import MembersClient from "./MembersClient";
import MembersFromUrl from "./MembersFromUrl";

export const revalidate = 120;

async function getInitialData(): Promise<DirectoryPage | null> {
  try {
    return await queryMembers({ page: 1, limit: PAGE_SIZE });
  } catch {
    return null;
  }
}

export default async function MembersPage() {
  const initialData = await getInitialData();

  return (
    <>
      <section className="bg-white border-b border-line">
        <div className="container-site py-7 sm:py-14">
          <p className="eyebrow animate-rise">Member Directory</p>
          <div className="mt-2.5 sm:mt-3 flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5">
            <div className="animate-rise max-w-2xl" style={{ animationDelay: "60ms" }}>
              <h1 className="text-[1.75rem] leading-tight sm:text-4xl font-extrabold text-ink text-balance">Explore Our Members</h1>
              <p className="mt-2 sm:mt-3 text-muted text-[15px] sm:text-base leading-relaxed">
                Discover professionals and organizations across Pakistan’s food and agriculture community.
              </p>
            </div>
            <div className="animate-rise flex items-center justify-between sm:justify-start gap-3" style={{ animationDelay: "120ms" }}>
              <Link href="/members/lookup" className="btn btn-outline whitespace-nowrap !min-h-10 !py-2 !px-3.5 sm:!min-h-11 sm:!py-2.5 sm:!px-5">
                <ShieldCheck size={16} aria-hidden /> Verify a member
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<MembersClient initialData={initialData} />}>
        <MembersFromUrl initialData={initialData} />
      </Suspense>
    </>
  );
}
