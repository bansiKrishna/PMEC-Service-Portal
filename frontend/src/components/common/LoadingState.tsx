import React from 'react';
import { Skeleton } from '../ui/skeleton';

interface LoadingStateProps {
  rows?: number;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 4,
  message = 'Loading...',
}) => {
  return (
    <div className="w-full space-y-3 py-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400">{message}</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center py-1">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
