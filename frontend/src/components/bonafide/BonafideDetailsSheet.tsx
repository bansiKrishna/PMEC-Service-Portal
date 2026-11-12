import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, X } from 'lucide-react';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import type { BonafideViewer } from '../../hooks/queries/useBonafideReview';
import { formatDate } from '../../lib/utils';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

interface BonafideDetailsSheetProps {
  application: BonafideApplicationResponseDto | null;
  viewer: BonafideViewer;
  onClose: () => void;
  onApprove: (application: BonafideApplicationResponseDto) => void;
  onReject: (application: BonafideApplicationResponseDto) => void;
}

const Detail: FC<{ label: string; value?: string | number | null }> = ({
  label,
  value,
}) => (
  <div className="min-w-0">
    <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 break-words text-sm text-foreground">
      {value === null || value === undefined || value === '' ? '—' : value}
    </dd>
  </div>
);

export const BonafideDetailsSheet: FC<BonafideDetailsSheetProps> = ({
  application,
  viewer,
  onClose,
  onApprove,
  onReject,
}) => {
  const canAct = application !== null && (
    viewer === 'dsw'
      ? ['SUBMITTED', 'PENDING_DSW'].includes(application.status)
      : ['PENDING_PRINCIPAL', 'DSW_APPROVED'].includes(application.status)
  );
  const detailsPath = application
    ? `/${viewer}/applications/${application.id}`
    : '#';

  return (
    <Sheet open={application !== null} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {application && (
          <>
            <SheetHeader>
              <SheetTitle>Bonafide application #{application.id}</SheetTitle>
              <SheetDescription>
                Review the student details and application status.
              </SheetDescription>
            </SheetHeader>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Student</h3>
              <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <Detail label="Name" value={application.studentName} />
                <Detail label="Roll number" value={application.rollNumber} />
                <Detail label="Email" value={application.studentEmail} />
                <Detail label="Department" value={application.department} />
                <Detail label="Semester" value={application.semester} />
                <Detail label="Phone" value={application.phoneNumber} />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Application</h3>
              <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <Detail label="Application number" value={application.id} />
                <Detail label="Reason" value={application.reason} />
                <Detail label="Parent name" value={application.parentName} />
                <Detail label="Academic year" value={application.academicYear} />
                <Detail label="College admission date" value={application.collegeAdmissionDate} />
                <Detail label="Hostel" value={application.hostelName} />
                <Detail label="Hostel room" value={application.roomNumber} />
                <Detail label="Hostel admission date" value={application.hostelAdmissionDate} />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Status</h3>
              <div className="space-y-3 rounded-lg border p-4">
                <StatusBadge status={application.status} />
                {application.rejectionReason && (
                  <p className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">
                    {application.rejectionReason}
                  </p>
                )}
                <dl className="grid grid-cols-2 gap-4">
                  <Detail label="Applied" value={formatDate(application.createdAt)} />
                  <Detail label="Updated" value={formatDate(application.updatedAt)} />
                </dl>
              </div>
            </section>

            <SheetFooter className="border-t pt-4">
              {canAct && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => onReject(application)}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <Button
                    onClick={() => onApprove(application)}
                    className="gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                </>
              )}
              <Button asChild variant="outline" className="gap-1.5">
                <Link to={detailsPath}>
                  Open full page <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
