import MemberCardSkeleton from "@/components/MemberCardSkeleton";

export default function MembersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading member directory">
      <section className="bg-white border-b border-line">
        <div className="container-site py-8 sm:py-14 space-y-4">
          <div className="h-3 w-32 skeleton rounded" />
          <div className="h-8 sm:h-9 w-64 sm:w-72 max-w-full skeleton rounded" />
          <div className="h-4 w-full max-w-xl skeleton rounded" />
        </div>
      </section>
      <div className="container-site py-4 md:py-10">
        <div className="flex gap-2 md:hidden">
          <div className="h-12 flex-1 skeleton rounded-lg" />
          <div className="h-12 w-24 skeleton rounded-lg" />
        </div>
        <div className="hidden md:grid bg-white border border-line rounded-lg p-5 gap-4 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-11 skeleton rounded-md" />)}
        </div>
        <div className="mt-6 md:mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => <MemberCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
