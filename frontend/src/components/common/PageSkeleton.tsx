import type { FC } from 'react';
import { Skeleton } from '../ui/skeleton';

export const PageSkeleton: FC = () => (
  <div className="space-y-5" aria-label="Loading page">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-96 max-w-full" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
    <Skeleton className="h-72" />
  </div>
);
