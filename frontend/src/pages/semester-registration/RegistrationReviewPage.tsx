
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { toast } from 'sonner';
import {
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import { semesterRegistrationApi } from '@/api/semesterRegistrationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ReviewSummaryCards } from '@/components/common/ReviewSummaryCards';
import { ReviewTabs } from '@/components/common/ReviewTabs';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { RegistrationStatusBadge } from './RegistrationStatusBadge';
import { useAuth } from '@/hooks/useAuth';
import {
  useRegistrationDetail,
  useRegistrationReviewHistory,
  useSemesterReviewList,
  useSemesterReviewSummary,
  semesterReviewKeys,
} from '@/hooks/queries/useSemesterReview';
import { queryClient } from '@/lib/queryClient';

import type {
  RegistrationDocument,
  RegistrationReview,
  RegistrationReviewListItem,
  SemesterRegistration,
} from '@/types/semesterRegistration';
import type { ReviewTab } from '@/types/review';

type ReviewDecision = 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

interface RegistrationReviewPageProps {
  initialTab?: ReviewTab;
}

const PAGE_SIZE = 10;
const EMPTY_REVIEW_LIST: RegistrationReviewListItem[] = [];

export const RegistrationReviewPage: FC<
  RegistrationReviewPageProps
> = ({ initialTab = 'PENDING' }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab')?.toUpperCase();
  const activeTab: ReviewTab =
    requestedTab === 'ALL' ||
    requestedTab === 'PENDING' ||
    requestedTab === 'APPROVED' ||
    requestedTab === 'REJECTED'
      ? requestedTab
      : initialTab;
  const reviewList = useSemesterReviewList(activeTab);
  const summaryQuery = useSemesterReviewSummary();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailQuery = useRegistrationDetail(selectedId);
  const reviewHistoryQuery = useRegistrationReviewHistory(selectedId);
  const selected: SemesterRegistration | null = detailQuery.data ?? null;
  const applications: RegistrationReviewListItem[] =
    reviewList.data ?? EMPTY_REVIEW_LIST;
  const reviewHistory: RegistrationReview[] = reviewHistoryQuery.data ?? [];
  const [documents, setDocuments] = useState<Record<number, string>>({});
  const documentUrls = useRef<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const reviewMutation = useMutation({
    mutationFn: (variables: {
      id: number;
      decision: ReviewDecision;
      comments?: string;
    }) => semesterRegistrationApi.submitReview(
      variables.id,
      variables.decision,
      variables.comments,
    ),
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.decision === 'APPROVED'
          ? 'Review recorded successfully'
          : variables.decision === 'REJECTED'
            ? 'Application rejected with comments'
            : 'Revision requested successfully',
      );
      setSelectedId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: semesterReviewKeys.root }),
        queryClient.invalidateQueries({
          queryKey: semesterReviewKeys.registration(variables.id),
        }),
      ]);
    },
  });
  const isReviewing = reviewMutation.isPending;

  const refreshApplications = async () => {
    await Promise.all([reviewList.refetch(), summaryQuery.refetch()]);
  };

  // Release locally created document URLs when the page unmounts.
  useEffect(
    () => () => {
      Object.values(documentUrls.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    },
    [],
  );

  // Search by application number, student, roll number, branch or year.
  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return applications;

    return applications.filter((application) =>
      [
        application.applicationNumber,
        application.studentName,
        application.rollNumber,
        application.branchCode,
        application.branchName,
        application.academicYear,
        application.studentEmail,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [applications, search]);

  const pageCount = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const pageApplications = filteredApplications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const setTab = (tab: ReviewTab) => {
    setPage(1);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', tab);
      return next;
    });
  };

  // Load a document from secure storage.
  const openDocument = async (document: RegistrationDocument) => {
    if (!selected || documents[document.id]) return;

    try {
      const blob =
        await semesterRegistrationApi.getDocumentContent(
          selected.id,
          document.id,
        );

      const url = URL.createObjectURL(blob);

      documentUrls.current[document.id] = url;

      setDocuments((current) => ({
        ...current,
        [document.id]: url,
      }));
    } catch {
      toast.error('Document unavailable', {
        description:
          'The file could not be loaded from secure storage.',
      });
    }
  };

  // Open an application and fetch its review history.
  const openApplication = async (
    application: RegistrationReviewListItem,
  ) => {
    setSelectedId(application.id);
  };

  // Approve, reject or request revision for an application.
  const submitReview = async (
    decision: ReviewDecision,
    form: HTMLFormElement,
  ) => {
    if (!selected || isReviewing) return;

    const comments = new FormData(form)
      .get('comments')
      ?.toString()
      .trim();

    if (decision !== 'APPROVED' && !comments) {
      toast.error(
        'Add a comment or reason before returning this application.',
      );
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: selected.id,
        decision,
        comments: comments || undefined,
      });
    } catch {
      // The API interceptor displays the request error; keep the modal open.
    }
  };

  const title = user?.role === 'DSW'
    ? 'DSW'
    : user?.role === 'PRINCIPAL'
      ? 'Principal'
      : 'Library';
  const canReview = (user?.role === 'LIBRARIAN' || user?.role === 'DSW')
    && (selected?.status === 'SUBMITTED' || selected?.status === 'UNDER_REVIEW');

  return (
    <section className="space-y-4 text-sm">
      {/* Page heading and actions */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {title} Semester Registration
          </h1>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Review student details, fee information and submitted documents.
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Refresh applications"
          title="Refresh applications"
          onClick={() => void refreshApplications()}
          disabled={reviewList.isFetching || summaryQuery.isFetching}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              reviewList.isFetching ? 'animate-spin' : ''
            }`}
          />
        </Button>
      </header>

      <ReviewSummaryCards
        summary={summaryQuery.data}
        loading={summaryQuery.isPending}
        activeTab={activeTab}
        onSelect={setTab}
        pendingLabel="Pending"
        rejectedLabel={user?.role === 'PRINCIPAL'
          ? 'Rejected'
          : 'Rejected / Revision requested'}
      />
      {summaryQuery.isError && !summaryQuery.data && (
        <ErrorState
          title="Could not load review counts"
          onRetry={() => void summaryQuery.refetch()}
        />
      )}
      <ReviewTabs
        activeTab={activeTab}
        summary={summaryQuery.data}
        onSelect={setTab}
        pendingLabel="Pending"
        rejectedLabel={user?.role === 'PRINCIPAL'
          ? 'Rejected'
          : 'Rejected / Revision requested'}
      />

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="h-9 pl-8 text-xs"
          placeholder="Search student, roll number, branch..."
        />
      </div>

      {/* Application list */}
      {reviewList.isError && !reviewList.data ? (
        <ErrorState
          title="Could not load applications"
          message="Unable to load semester registration applications."
          onRetry={() => void refreshApplications()}
        />
      ) : reviewList.isPending && !reviewList.data ? (
        <TableSkeleton rows={6} columns={7} />
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          title={
            search.trim()
              ? 'No matching registrations'
              : activeTab === 'PENDING'
                ? 'No pending applications'
                : activeTab === 'APPROVED'
                  ? 'No approved applications'
                  : activeTab === 'REJECTED'
                    ? 'No rejected applications'
                    : 'No semester registrations'
          }
          description={
            search.trim()
              ? 'No applications match your search.'
              : activeTab === 'REJECTED' && user?.role !== 'PRINCIPAL'
                ? 'No applications have been rejected or returned for revision.'
                : 'Applications for this status will appear here.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full min-w-[680px] text-xs">
            <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">
                  Application
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Student
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Branch
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Semester / Year
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Submitted
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Your decision
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {pageApplications.map((application) => (
                <tr
                  key={application.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open application ${application.applicationNumber}`}
                  onClick={() => void openApplication(application)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      void openApplication(application);
                    }
                  }}
                  className="cursor-pointer border-t transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <td className="px-3 py-2.5 font-medium">
                    {application.applicationNumber}
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="font-medium">
                      {application.studentName || 'Name unavailable'}
                    </div>

                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {application.rollNumber ||
                        application.studentEmail}
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="font-medium">
                      {application.branchCode || '—'}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {application.branchName || ''}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    {application.semester} / {application.academicYear}
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {application.submittedAt
                      ? new Date(
                          application.submittedAt,
                        ).toLocaleDateString()
                      : '—'}
                  </td>

                  <td className="px-3 py-2.5">
                    {user?.role === 'PRINCIPAL' ? (
                      <RegistrationStatusBadge status={application.status} />
                    ) : (
                      <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${
                        application.reviewDecision === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : application.reviewDecision === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                            : application.reviewDecision === 'REVISION_REQUESTED'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {application.reviewDecision === 'REVISION_REQUESTED'
                          ? 'Revision requested'
                          : application.reviewDecision
                            ? application.reviewDecision.charAt(0) + application.reviewDecision.slice(1).toLowerCase()
                            : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <RegistrationStatusBadge status={application.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              Showing {filteredApplications.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredApplications.length)} of {filteredApplications.length}
            </span>
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

      {/* Application details modal */}
      {selectedId !== null
        && (detailQuery.isPending || reviewHistoryQuery.isPending) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 backdrop-blur-[2px] sm:p-4">
          <section
            className="mx-auto my-2 max-w-3xl space-y-4 rounded-xl border bg-background p-4 shadow-xl sm:my-5 sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Loading registration details"
          >
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-36 w-full" />
          </section>
        </div>
      )}
      {selectedId !== null && detailQuery.isError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section className="w-full max-w-lg rounded-xl border bg-background p-4">
            <ErrorState
              title="Could not load registration details"
              onRetry={() => void detailQuery.refetch()}
            />
            <Button variant="outline" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          </section>
        </div>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 backdrop-blur-[2px] sm:p-4"
          role="presentation"
          onClick={() => {
            if (!isReviewing) setSelectedId(null);
          }}
        >
          <section
            className="mx-auto my-2 max-w-3xl space-y-4 rounded-xl border bg-background p-4 shadow-xl sm:my-5 sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-review-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal heading */}
            <header className="flex items-start justify-between gap-3 border-b pb-3">
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Semester Registration Application
                </p>

                <h2
                  id="registration-review-title"
                  className="break-words text-base font-semibold"
                >
                  {selected.applicationNumber}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.studentName || 'Student name unavailable'}
                  {selected.rollNumber
                    ? ` · ${selected.rollNumber}`
                    : ''}
                </p>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Close application"
                onClick={() => setSelectedId(null)}
                disabled={isReviewing}
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            {/* Student information */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">
                Student Information
              </h3>

              <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <Detail
                  label="Student Email"
                  value={selected.studentEmail}
                />

                <Detail
                  label="Branch"
                  value={`${selected.branchCode || '—'} · ${
                    selected.branchName || '—'
                  }`}
                />

                <Detail
                  label="Semester / Academic Year"
                  value={`${selected.semester} / ${selected.academicYear}`}
                />

                <Detail
                  label="Section"
                  value={selected.section}
                />

                <Detail
                  label="Hostel"
                  value={
                    selected.hostelName
                      ? `${selected.hostelName}${
                          selected.hostelRoom
                            ? ` · Room ${selected.hostelRoom}`
                            : ''
                        }`
                      : 'Not applicable'
                  }
                />

                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">
                    Current Status
                  </p>
                  <RegistrationStatusBadge
                    status={selected.status}
                  />
                </div>
              </div>
            </div>

            {/* Selected subjects */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">
                Selected Subjects
              </h3>

              {selected.selectedSubjects.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-left text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">
                          Subject Code
                        </th>
                        <th className="px-3 py-2 font-medium">
                          Subject Name
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selected.selectedSubjects.map((subject) => (
                        <tr
                          key={subject.id}
                          className="border-t"
                        >
                          <td className="px-3 py-2 font-medium">
                            {subject.code}
                          </td>
                          <td className="px-3 py-2">
                            {subject.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-lg border p-3 text-xs text-muted-foreground">
                  No subjects listed.
                </p>
              )}
            </div>

            {/* Fee information */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">
                Fee Details
              </h3>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <FeeCard
                  title="College Fee"
                  due={selected.collegeFeeDue}
                  paid={selected.collegeFeePaid}
                  advance={selected.collegeAdvance}
                />

                <FeeCard
                  title="Hostel Fee"
                  due={selected.hostelFeeDue}
                  paid={selected.hostelFeePaid}
                  advance={selected.hostelAdvance}
                />

                <FeeCard
                  title="Mess Fee"
                  due={selected.messFeeDue}
                  paid={selected.messFeePaid}
                  advance={selected.messAdvance}
                />
              </div>
            </div>

            {/* Submitted documents */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">
                Submitted Documents
              </h3>

              {selected.documents.length ? (
                <div className="space-y-1.5">
                  {selected.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-2 rounded-lg border p-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                        <div className="min-w-0">
                          <p className="text-xs font-medium">
                            {document.documentType}
                          </p>

                          <p className="break-all text-[10px] text-muted-foreground">
                            {document.originalFileName}
                          </p>
                        </div>
                      </div>

                      {documents[document.id] ? (
                        <a
                          className="inline-flex shrink-0 items-center gap-1 self-start text-xs font-medium text-primary hover:underline sm:self-center"
                          href={documents[document.id]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open file
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 px-2.5 text-[11px]"
                          onClick={() =>
                            void openDocument(document)
                          }
                        >
                          Load document
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border p-3 text-xs text-muted-foreground">
                  No documents submitted.
                </p>
              )}
            </div>

            {/* Review history */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold">
                Review History
              </h3>

              {reviewHistoryQuery.isError ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-xs text-destructive">
                  <span>Review history could not be loaded.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void reviewHistoryQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : reviewHistory.length ? (
                <ol className="space-y-2">
                  {reviewHistory.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-medium">
                          {review.reviewerRole}
                          {review.reviewerName
                            ? ` · ${review.reviewerName}`
                            : ''}
                        </p>

                        <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium">
                          {review.decision}
                        </span>
                      </div>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {review.reviewedAt
                          ? new Date(
                              review.reviewedAt,
                            ).toLocaleString()
                          : 'Awaiting review'}
                      </p>

                      {review.comments && (
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">
                          {review.comments}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-lg border p-3 text-xs text-muted-foreground">
                  No review history recorded.
                </p>
              )}
            </div>

            {/* Review actions */}
            {canReview && (
              <form
                className="space-y-3 border-t pt-4"
                onSubmit={(event) => event.preventDefault()}
              >
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    htmlFor="review-comments"
                  >
                    Comments / Return Reason
                  </label>

                  <textarea
                    id="review-comments"
                    name="comments"
                    maxLength={2000}
                    rows={3}
                    disabled={isReviewing}
                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Required when requesting a revision or rejecting..."
                  />

                  <p className="text-[10px] text-muted-foreground">
                    A reason is required for rejection or revision requests.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={isReviewing}
                    onClick={(event) => {
                      const form = event.currentTarget.form;
                      if (form) {
                        void submitReview('APPROVED', form);
                      }
                    }}
                  >
                    {isReviewing ? 'Saving...' : 'Approve'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={isReviewing}
                    onClick={(event) => {
                      const form = event.currentTarget.form;
                      if (form) {
                        void submitReview(
                          'REVISION_REQUESTED',
                          form,
                        );
                      }
                    }}
                  >
                    Request Revision
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={isReviewing}
                    onClick={(event) => {
                      const form = event.currentTarget.form;
                      if (form) {
                        void submitReview('REJECTED', form);
                      }
                    }}
                  >
                    Reject
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-8 px-3 text-xs"
                    disabled={isReviewing}
                    onClick={() => setSelectedId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
};

// Compact reusable detail field.
function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] text-muted-foreground">
        {label}
      </p>
      <p className="break-words text-xs font-medium">
        {value === null || value === undefined || value === ''
          ? '—'
          : value}
      </p>
    </div>
  );
}

// Compact fee summary card.
function FeeCard({
  title,
  due,
  paid,
  advance,
}: {
  title: string;
  due: number | string | null | undefined;
  paid: number | string | null | undefined;
  advance: number | string | null | undefined;
}) {
  const formatAmount = (
    value: number | string | null | undefined,
  ) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return value;
  };

  return (
    <div className="rounded-lg border p-3">
      <p className="mb-2 text-xs font-semibold">{title}</p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            Due
          </span>
          <span className="text-xs font-medium">
            {formatAmount(due)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            Paid
          </span>
          <span className="text-xs font-medium">
            {formatAmount(paid)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            Advance
          </span>
          <span className="text-xs font-medium">
            {formatAmount(advance)}
          </span>
        </div>
      </div>
    </div>
  );
}