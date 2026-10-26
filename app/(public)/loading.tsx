export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <section className="bg-forest-deep">
        <div className="container-site py-16 sm:py-20 space-y-5">
          <div className="h-3 w-40 rounded bg-white/15" />
          <div className="h-10 w-full max-w-2xl rounded bg-white/15" />
          <div className="h-4 w-full max-w-xl rounded bg-white/10" />
          <div className="flex gap-3 pt-2">
            <div className="h-11 w-48 rounded-md bg-white/20" />
            <div className="h-11 w-44 rounded-md bg-white/10" />
          </div>
        </div>
      </section>
      <section className="container-site py-14 grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/3] skeleton rounded-lg" />
        <div className="space-y-4">
          <div className="h-3 w-28 skeleton rounded" />
          <div className="h-8 w-3/4 skeleton rounded" />
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-2/3 skeleton rounded" />
        </div>
      </section>
    </div>
  );
}
