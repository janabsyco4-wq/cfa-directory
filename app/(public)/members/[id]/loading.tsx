export default function ProfileLoading() {
  return (
    <div className="container-site py-8 sm:py-12" aria-busy="true" aria-label="Loading member profile">
      <div className="h-4 w-48 skeleton rounded" />
      <div className="mt-6 bg-white border border-line rounded-lg overflow-hidden grid md:grid-cols-[360px_1fr]">
        <div className="aspect-[4/5] md:aspect-auto md:min-h-[440px] skeleton" />
        <div className="p-8 space-y-4">
          <div className="h-6 w-28 skeleton rounded" />
          <div className="h-9 w-2/3 skeleton rounded" />
          <div className="grid sm:grid-cols-2 gap-5 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 skeleton rounded" />
                <div className="h-4 w-36 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
