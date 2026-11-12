import { useMemo, useState, type FC, type KeyboardEvent } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { BonafideDetailsSheet } from './BonafideDetailsSheet';
import { BonafideDecisionDialogs } from './BonafideDecisionDialogs';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { ReviewSummaryCards } from '../common/ReviewSummaryCards';
import { ReviewTabs } from '../common/ReviewTabs';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/TableSkeleton';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useApproveBonafide, useBonafideList, useBonafideSummary, useRejectBonafide, type BonafideViewer } from '../../hooks/queries/useBonafideReview';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { REVIEW_TABS, type ReviewTab } from '../../types/review';
import { formatDate } from '../../lib/utils';

interface BonafideApplicationsViewProps {
  viewer: BonafideViewer;
  title: string;
  description: string;
}

const PAGE_SIZE = 10;
const EMPTY_APPLICATIONS: BonafideApplicationResponseDto[] = [];

export const BonafideApplicationsView: FC<BonafideApplicationsViewProps> = ({
  viewer,
  title,
  description,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab')?.toUpperCase();
  const activeTab: ReviewTab = REVIEW_TABS.includes(rawTab as ReviewTab)
    ? rawTab as ReviewTab
    : 'PENDING';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] =
    useState<BonafideApplicationResponseDto | null>(null);
  const [approveTarget, setApproveTarget] =
    useState<BonafideApplicationResponseDto | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<BonafideApplicationResponseDto | null>(null);
  const list = useBonafideList(viewer, activeTab);
  const summary = useBonafideSummary(viewer);
  const approve = useApproveBonafide(viewer);
  const reject = useRejectBonafide(viewer);
  const applications = list.data ?? EMPTY_APPLICATIONS;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((application) => [
      application.id,
      application.studentName,
      application.rollNumber,
      application.reason,
      application.department,
    ].some((value) => String(value ?? '').toLowerCase().includes(query)));
  }, [applications, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstItem = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, filtered.length);

  const selectTab = (tab: ReviewTab) => {
    setPage(1);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', tab);
      return next;
    });
  };

  const openRow = (application: BonafideApplicationResponseDto) => {
    setSelected(application);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    application: BonafideApplicationResponseDto,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openRow(application);
    }
  };

  const handleApprove = async (id: number, remarks?: string) => {
    await approve.mutateAsync({ id, remarks });
    setApproveTarget(null);
    setSelected(null);
  };

  const handleReject = async (id: number, reason: string) => {
    await reject.mutateAsync({ id, reason });
    setRejectTarget(null);
    setSelected(null);
  };

  const tabEmptyText: Record<ReviewTab, string> = {
    ALL: 'There are no Bonafide applications to display.',
    PENDING: 'There are no applications awaiting your review.',
    APPROVED: 'No applications have been approved in this stage.',
    REJECTED: 'No applications have been rejected in this stage.',
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            void list.refetch();
            void summary.refetch();
          }}
          disabled={list.isFetching || summary.isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${list.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      <ReviewSummaryCards
        summary={summary.data}
        loading={summary.isPending}
        activeTab={activeTab}
        onSelect={selectTab}
      />
      {summary.isError && !summary.data && (
        <ErrorState
          title="Could not load application counts"
          onRetry={() => void summary.refetch()}
        />
      )}
      <ReviewTabs
        activeTab={activeTab}
        summary={summary.data}
        onSelect={selectTab}
      />

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="h-9 pl-8 text-sm"
          placeholder="Search application, student, roll no, reason..."
          aria-label="Search Bonafide applications"
        />
      </div>

      {list.isError && !list.data ? (
        <ErrorState
          title="Could not load applications"
          onRetry={() => void list.refetch()}
        />
      ) : list.isPending && !list.data ? (
        <TableSkeleton rows={6} columns={6} />
      ) : pageRows.length === 0 ? (
        <EmptyState
          title={search.trim() ? 'No matching applications' : 'No applications'}
          description={search.trim() ? 'Try another search term.' : tabEmptyText[activeTab]}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Department / Sem</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Applied on</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((application) => (
                <TableRow
                  key={application.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open Bonafide application ${application.id}`}
                  onClick={() => openRow(application)}
                  onKeyDown={(event) => handleKeyDown(event, application)}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <TableCell className="font-mono font-medium">
                    #{application.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {application.studentName || `Student #${application.studentId ?? '—'}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {application.rollNumber || 'Roll number unavailable'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {application.department || '—'}
                    {application.semester ? ` / ${application.semester}` : ''}
                  </TableCell>
                  <TableCell className="max-w-[18rem] truncate" title={application.reason}>
                    {application.reason}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(application.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
            <span>Showing {firstItem}–{lastItem} of {filtered.length}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <BonafideDetailsSheet
        application={selected}
        viewer={viewer}
        onClose={() => setSelected(null)}
        onApprove={setApproveTarget}
        onReject={setRejectTarget}
      />
      <BonafideDecisionDialogs
        viewer={viewer}
        approveApplication={approveTarget}
        rejectApplication={rejectTarget}
        approving={approve.isPending}
        rejecting={reject.isPending}
        onCloseApprove={() => setApproveTarget(null)}
        onCloseReject={() => setRejectTarget(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </section>
  );
};
