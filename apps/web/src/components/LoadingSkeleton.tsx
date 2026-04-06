import React from 'react';

export function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div className="animate-pulse" style={{ aspectRatio: '3/4', backgroundColor: '#F4F4F0' }} />
      <div className="p-3 space-y-2">
        <div className="h-4 rounded" style={{ backgroundColor: '#F4F4F0', width: '80%' }} />
        <div className="h-3 rounded" style={{ backgroundColor: '#F4F4F0', width: '60%' }} />
        <div className="h-5 rounded" style={{ backgroundColor: '#F4F4F0', width: '40%' }} />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse" style={{ borderBottom: '1px solid #E0E0D8' }}>
      <div className="h-12 w-12 rounded-lg flex-shrink-0" style={{ backgroundColor: '#F4F4F0' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded" style={{ backgroundColor: '#F4F4F0', width: '70%' }} />
        <div className="h-3 rounded" style={{ backgroundColor: '#F4F4F0', width: '50%' }} />
      </div>
    </div>
  );
}
