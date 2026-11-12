export type ReviewTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReviewSummary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export const REVIEW_TABS: ReviewTab[] = [
  'ALL',
  'PENDING',
  'APPROVED',
  'REJECTED',
];
