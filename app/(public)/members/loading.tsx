import { Users } from "lucide-react";

export default function MembersLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-40 bg-green-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Filter skeleton */}
        <div className="bg-white border border-gray-100 rounded-2xl mb-6 sm:mb-8 p-4">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* Grid skeleton with 20 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Avatar skeleton */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
              
              {/* Content skeleton */}
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
                <div className="h-6 bg-gray-100 rounded-full w-20 animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 mt-8 text-gray-400">
          <Users size={16} className="animate-pulse" />
          <span className="text-sm font-medium">Loading members...</span>
        </div>
      </div>
    </div>
  );
}
