
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Send,
} from "lucide-react";

import type { SemesterRegistrationStatus } from "../../types/semesterRegistration";

interface RegistrationStatusBadgeProps {
  status: SemesterRegistrationStatus;
}

const statusStyles: Record<
  SemesterRegistrationStatus,
  {
    label: string;
    className: string;
    icon: typeof Clock3;
  }
> = {
  DRAFT: {
    label: "Draft",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    icon: FilePenLine,
  },

  SUBMITTED: {
    label: "Submitted",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    icon: Send,
  },

  UNDER_REVIEW: {
    label: "Under review",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    icon: Clock3,
  },

  REVISION_REQUIRED: {
    label: "Revision required",
    className:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
    icon: AlertCircle,
  },

  APPROVED: {
    label: "Approved",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: CheckCircle2,
  },

  DEPARTMENT_DRAFTED: {
    label: "Department drafted",
    className:
      "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
    icon: FilePenLine,
  },
};

export const RegistrationStatusBadge: React.FC<
  RegistrationStatusBadgeProps
> = ({ status }) => {
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap border px-1.5 py-0.5 text-[10px] font-medium leading-4 ${config.className}`}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className="h-3 w-3 shrink-0"
      />

      <span>{config.label}</span>
    </span>
  );
};
