"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ count = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-xl border bg-card shadow-warm">
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
