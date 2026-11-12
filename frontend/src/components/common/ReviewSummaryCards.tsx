import type { FC } from 'react';
import {
  CheckCircle2,
  Clock3,
  Files,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ReviewSummary, ReviewTab } from '../../types/review';
import { Skeleton } from '../ui/skeleton';

interface ReviewSummaryCardsProps {
  summary?: ReviewSummary;
  loading: boolean;
  activeTab: ReviewTab;
  onSelect: (tab: ReviewTab) => void;
  pendingLabel?: string;
  rejectedLabel?: string;
}

const cardData: {
  tab: ReviewTab;
  label: string;
  color: string;
  icon: LucideIcon;
  countKey: keyof ReviewSummary;
}[] = [
  { tab: 'ALL', label: 'Total', color: 'text-slate-500', icon: Files, countKey: 'total' },
  { tab: 'PENDING', label: 'Pending', color: 'text-amber-600', icon: Clock3, countKey: 'pending' },
  { tab: 'APPROVED', label: 'Approved', color: 'text-emerald-600', icon: CheckCircle2, countKey: 'approved' },
  { tab: 'REJECTED', label: 'Rejected', color: 'text-red-600', icon: XCircle, countKey: 'rejected' },
];

export const ReviewSummaryCards: FC<ReviewSummaryCardsProps> = ({
  summary,
  loading,
  activeTab,
  onSelect,
  pendingLabel = 'Pending',
  rejectedLabel = 'Rejected',
}) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {cardData.map(({ tab, label, color, icon: Icon, countKey }) => {
      if (loading && !summary) {
        return <Skeleton key={tab} className="h-24" />;
      }
      const selected = activeTab === tab;
      return (
        <button
          key={tab}
          type="button"
          aria-pressed={selected}
          onClick={() => onSelect(tab)}
          className={`min-w-0 border bg-card p-3 text-left transition-colors hover:bg-muted/30 ${
            selected ? 'border-primary ring-1 ring-primary/30' : 'border-border'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tab === 'PENDING'
                  ? pendingLabel
                  : tab === 'REJECTED'
                    ? rejectedLabel
                    : label}
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                {summary?.[countKey] ?? 0}
              </p>
            </div>
            <Icon aria-hidden="true" className={`h-4 w-4 ${color}`} />
          </div>
        </button>
      );
    })}
  </div>
);
