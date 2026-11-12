import type { FC } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import type { ReviewSummary, ReviewTab } from '../../types/review';
import { REVIEW_TABS } from '../../types/review';

interface ReviewTabsProps {
  activeTab: ReviewTab;
  summary?: ReviewSummary;
  onSelect: (tab: ReviewTab) => void;
  pendingLabel?: string;
  rejectedLabel?: string;
}

const tabLabels: Record<ReviewTab, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const ReviewTabs: FC<ReviewTabsProps> = ({
  activeTab,
  summary,
  onSelect,
  pendingLabel,
  rejectedLabel,
}) => (
  <Tabs
    value={activeTab}
    onValueChange={(value) => onSelect(value as ReviewTab)}
  >
    <TabsList className="h-auto flex-wrap">
      {REVIEW_TABS.map((tab) => {
        const count = tab === 'ALL'
          ? summary?.total
          : summary?.[tab.toLowerCase() as 'pending' | 'approved' | 'rejected'];
        const label = tab === 'PENDING' && pendingLabel
          ? pendingLabel
          : tab === 'REJECTED' && rejectedLabel
            ? rejectedLabel
            : tabLabels[tab];
        return (
          <TabsTrigger key={tab} value={tab}>
            {label}{count === undefined ? '' : ` (${count})`}
          </TabsTrigger>
        );
      })}
    </TabsList>
  </Tabs>
);
