export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <section className="relative bg-gradient-to-br from-green-700 to-emerald-600 overflow-hidden">
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            <div className="text-center lg:text-left space-y-4">
              <div className="h-6 w-48 bg-white/20 rounded animate-pulse mx-auto lg:mx-0" />
              <div className="h-12 w-full max-w-md bg-white/20 rounded animate-pulse mx-auto lg:mx-0" />
              <div className="h-12 w-3/4 bg-white/20 rounded animate-pulse mx-auto lg:mx-0" />
              <div className="h-20 w-full max-w-lg bg-white/10 rounded animate-pulse mx-auto lg:mx-0" />
              <div className="flex gap-3 justify-center lg:justify-start">
                <div className="h-12 w-40 bg-white/90 rounded-xl animate-pulse" />
                <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse" />
              </div>
            </div>
            {/* Card skeleton */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-16" />
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 rounded-xl h-12 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar skeleton */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`px-4 sm:px-6 py-6 sm:py-8 text-center ${
                  i < 4 ? "border-r border-gray-100" : ""
                }`}
              >
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-12 w-40 bg-green-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
