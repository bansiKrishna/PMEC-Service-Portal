import type { FC } from 'react';
import { Skeleton } from '../ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: FC<TableSkeletonProps> = ({
  rows = 6,
  columns = 6,
}) => (
  <div className="space-y-3" aria-label="Loading table">
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: columns }, (_, index) => (
        <Skeleton key={`head-${index}`} className="h-4" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, row) => (
      <div
        key={row}
        className="grid gap-3 border-t border-border py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, column) => (
          <Skeleton key={`${row}-${column}`} className="h-5" />
        ))}
      </div>
    ))}
  </div>
);
