import type { FC } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { ReviewSummaryCards } from '../../components/common/ReviewSummaryCards';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TableSkeleton } from '../../components/common/TableSkeleton';
import { Button } from '../../components/ui/button';
import {
  useBonafideList,
  useBonafideSummary,
} from '../../hooks/queries/useBonafideReview';
import { formatDate } from '../../lib/utils';

export const PrincipalDashboard: FC = () => {
  const navigate = useNavigate();
  const summary = useBonafideSummary('principal');
  const pending = useBonafideList('principal', 'PENDING');

  const openApplications = (tab: string) => {
    navigate(`/principal/applications?tab=${tab}`);
  };

  if (summary.isError && !summary.data) {
    return (
      <ErrorState
        title="Could not load Bonafide summary"
        onRetry={() => void summary.refetch()}
      />
    );
  }

  return (
    <section className="space-y-4">
      <header className="page-header">
        <div>
          <h1 className="page-title">Principal Approval Desk</h1>
          <p className="page-description">
            Review applications forwarded for final approval and certificate generation.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            void summary.refetch();
            void pending.refetch();
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${pending.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      <ReviewSummaryCards
        summary={summary.data}
        loading={summary.isPending}
        activeTab="PENDING"
        onSelect={(tab) => openApplications(tab)}
      />

      <div className="content-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Recent pending applications</h2>
            <p className="text-xs text-muted-foreground">
              Applications forwarded by DSW for final sanction.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={() => openApplications('PENDING')}
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {pending.isError && !pending.data ? (
          <ErrorState
            title="Could not load pending applications"
            onRetry={() => void pending.refetch()}
          />
        ) : pending.isPending && !pending.data ? (
          <div className="p-4"><TableSkeleton rows={5} columns={4} /></div>
        ) : pending.data?.length ? (
          <div className="divide-y divide-border">
            {pending.data.slice(0, 5).map((application) => (
              <button
                type="button"
                key={application.id}
                onClick={() => navigate(`/principal/applications/${application.id}`)}
                className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="block text-sm font-medium">
                    #{application.id} — {application.studentName || `Student #${application.studentId}`}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {application.department || 'Department unavailable'} · {application.reason}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatDate(application.createdAt)}
                  </span>
                </span>
                <StatusBadge status={application.status} />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pending applications"
            description="There are no Bonafide applications awaiting Principal review."
          />
        )}
      </div>
    </section>
  );
};
