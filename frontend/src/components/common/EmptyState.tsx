import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are currently no items available to display.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mb-3">
        {icon || <Inbox className="w-4 h-4" />}
      </div>
      <h3 className="text-xs font-semibold text-foreground mb-1">
        {title}
      </h3>
      <p className="text-[11px] text-muted-foreground max-w-xs mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
