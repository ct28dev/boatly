import React from 'react';
import { cn } from '@/utils/cn';

export function TourCardSkeleton() {
  return (
    <div
      className="rounded-2xl bg-white overflow-hidden shadow-card"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] shimmer" />
      <div className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-4 w-3/4 rounded-md shimmer" />
          <div className="h-4 w-12 rounded-md shimmer flex-shrink-0" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full shimmer" />
          <div className="h-3 w-1/2 rounded-md shimmer" />
        </div>
        <div className="flex items-end justify-between pt-1">
          <div className="h-5 w-20 rounded-md shimmer" />
          <div className="h-3 w-16 rounded-md shimmer" />
        </div>
      </div>
    </div>
  );
}
