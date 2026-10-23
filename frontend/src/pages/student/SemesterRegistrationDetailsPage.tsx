import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ClipboardList, FileText, GraduationCap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import type { SemesterRegistration } from '../../types/semesterRegistration';
import { semesterRegistrationApi } from '../../api/semesterRegistrationApi';
import { RegistrationStatusBadge } from '../semester-registration/RegistrationStatusBadge';
import { RegistrationPageHeader } from '../semester-registration/RegistrationPageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ErrorState } from '../../components/common/ErrorState';

const formatMoney = (value: number | null): string =>
  value == null
    ? 'Not entered'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(value);

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleString('en-IN') : 'Not submitted';

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string; error?: string; message?: string }
      | undefined;
    return (
      data?.detail ||
      data?.error ||
      data?.message ||
      error.message ||
      'Unable to load this registration.'
    );
  }
  return error instanceof Error ? error.message : 'Unable to load this registration.';
};

const feeGroups = [
  {
    title: 'College fees',
    fields: [
      ['Total due', 'collegeFeeDue'],
      ['Amount paid', 'collegeFeePaid'],
      ['Advance amount', 'collegeAdvance'],
    ] as const,
  },
  {
    title: 'Hostel fees',
    fields: [
      ['Total due', 'hostelFeeDue'],
      ['Amount paid', 'hostelFeePaid'],
      ['Advance amount', 'hostelAdvance'],
    ] as const,
  },
  {
    title: 'Mess fees',
    fields: [
      ['Total due', 'messFeeDue'],
      ['Amount paid', 'messFeePaid'],
      ['Advance amount', 'messAdvance'],
    ] as const,
  },
];

export const SemesterRegistrationDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<SemesterRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedRegistrationId, setLoadedRegistrationId] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const registrationId = Number(id);
  const validId = Number.isInteger(registrationId) && registrationId > 0;

  useEffect(() => {
    if (!validId) return;
    let isActive = true;

    semesterRegistrationApi.getRegistration(registrationId)
      .then((result) => {
        if (isActive) {
          setRegistration(result);
          setError(null);
          setLoadedRegistrationId(registrationId);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(getErrorMessage(requestError));
          setLoadedRegistrationId(registrationId);
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [registrationId, retryCount, validId]);

  if (!validId) {
    return (
      <ErrorState
        title="Registration details unavailable"
        message="A valid registration ID is required."
      />
    );
  }

  if (loading || loadedRegistrationId !== registrationId) {
    return (
      <div className="w-full min-w-0 space-y-4" aria-busy="true">
        <RegistrationPageHeader
          title="Registration details"
          description="Application details and current review status."
          icon={ClipboardList}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse border border-border bg-muted/30" />
          ))}
        </div>
        <div className="h-48 animate-pulse border border-border bg-muted/30" />
      </div>
    );
  }

  if (error || !registration) {
    return (
      <ErrorState
        title="Registration details unavailable"
        message={error ?? 'The registration could not be found.'}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setRetryCount((current) => current + 1);
        }}
      />
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-label="Back to semester registrations"
            onClick={() => navigate('/student/semester-registration')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
              <h1 className="text-base font-semibold tracking-tight">
                {registration.applicationNumber}
              </h1>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Semester registration · application details and current review status.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RegistrationStatusBadge status={registration.status} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-none border-border shadow-none">
          <CardHeader className="border-b border-border px-3 py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap aria-hidden="true" className="size-4 text-primary" />
              Student and academic details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-5 gap-y-3 p-3 text-xs sm:grid-cols-2">
            <Detail label="Student" value={registration.studentName ?? '—'} />
            <Detail label="Registration number" value={registration.rollNumber ?? '—'} />
            <Detail label="Email" value={registration.studentEmail} />
            <Detail
              label="Branch"
              value={`${registration.branchName} (${registration.branchCode})`}
            />
            <Detail label="Academic year" value={registration.academicYear} />
            <Detail
              label="Semester and section"
              value={`${registration.semester} · ${registration.section}`}
            />
            <Detail
              label="Hostel"
              value={
                registration.hostelName
                  ? `${registration.hostelName}${registration.hostelRoom ? `, room ${registration.hostelRoom}` : ''}`
                  : 'Not applicable'
              }
            />
            <Detail label="Application number" value={registration.applicationNumber} />
          </CardContent>
        </Card>

        <Card className="rounded-none border-border shadow-none">
          <CardHeader className="border-b border-border px-3 py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarDays aria-hidden="true" className="size-4 text-primary" />
              Application timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-3 text-xs sm:grid-cols-2">
            <Detail label="Submitted" value={formatDate(registration.submittedAt)} />
            <Detail label="Last updated" value={formatDate(registration.updatedAt)} />
            <Detail label="Created" value={formatDate(registration.createdAt)} />
            <Detail label="Current status" value={<RegistrationStatusBadge status={registration.status} />} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-none border-border shadow-none">
        <CardHeader className="border-b border-border px-3 py-3">
          <CardTitle className="text-sm">Selected subjects</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {registration.selectedSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects are recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Code</th>
                    <th className="py-2 pr-4 font-medium">Subject</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 text-right font-medium">Credits</th>
                    <th className="py-2 text-right font-medium">Selection</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {registration.selectedSubjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="py-3 pr-4 font-medium">{subject.code}</td>
                      <td className="py-3 pr-4">{subject.name}</td>
                      <td className="py-3 pr-4">{subject.subjectType}</td>
                      <td className="py-3 pr-4 text-right">{subject.credits ?? '—'}</td>
                      <td className="py-3 text-right">
                        {subject.compulsory ? 'Compulsory' : 'Elective'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-right font-medium">Total selected credits</td>
                    <td className="pt-3 text-right font-semibold">
                      {registration.selectedSubjects.every((subject) => subject.credits != null)
                        ? registration.selectedSubjects.reduce(
                            (total, subject) => total + (subject.credits ?? 0),
                            0,
                          )
                        : '—'}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-none border-border shadow-none">
        <CardHeader className="border-b border-border px-3 py-3">
          <CardTitle className="text-sm">Fee summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 md:grid-cols-3">
          {feeGroups.map((group) => (
            <section key={group.title} className="rounded-none border border-border p-3">
              <h2 className="mb-2 text-xs font-semibold">{group.title}</h2>
              <dl className="space-y-2 text-xs">
                {group.fields.map(([label, field]) => (
                  <div key={field} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium">
                      {formatMoney(registration[field])}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-none border-border shadow-none">
        <CardHeader className="border-b border-border px-3 py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText aria-hidden="true" className="size-4 text-primary" />
            Uploaded document metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {registration.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents have been uploaded.</p>
          ) : (
            <ul className="divide-y">
              {registration.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{document.originalFileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {document.documentType} · {document.contentType} ·{' '}
                      {(document.fileSizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <time className="text-[10px] text-muted-foreground">
                    {formatDate(document.uploadedAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Review comments and receipt downloads are not available through the current registration API.
      </p>
    </div>
  );
};

interface DetailProps {
  label: string;
  value: React.ReactNode;
}

const Detail: React.FC<DetailProps> = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words font-medium">{value}</dd>
  </div>
);
