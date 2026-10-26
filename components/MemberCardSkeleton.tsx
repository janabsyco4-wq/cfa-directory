export default function MemberCardSkeleton() {
  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden" aria-hidden>
      <div className="aspect-[4/5] sm:aspect-[4/3] skeleton" />
      <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3">
        <div className="h-4 w-4/5 sm:w-2/3 skeleton rounded" />
        <div className="h-3 w-1/2 sm:w-1/3 skeleton rounded" />
        <div className="h-3 w-2/3 sm:w-1/2 skeleton rounded" />
        <div className="h-3 w-1/3 skeleton rounded !mt-4" />
      </div>
    </div>
  );
}
