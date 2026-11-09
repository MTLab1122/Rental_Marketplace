import React from 'react';

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-m3-lg border border-navy-100 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[16/10] bg-navy-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-navy-200 rounded w-1/3" />
        <div className="h-4 bg-navy-200 rounded w-3/4" />
        <div className="h-3 bg-navy-100 rounded w-1/2" />
        <div className="pt-2 border-t border-navy-50 flex gap-2">
          <div className="h-4 bg-navy-100 rounded w-16" />
          <div className="h-4 bg-navy-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <PropertyCardSkeleton key={idx} />
      ))}
    </div>
  );
}
