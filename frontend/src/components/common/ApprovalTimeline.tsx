import React from 'react';
import { CheckCircle2, Clock, XCircle, Circle } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface Step {
  title: string;
  role: string;
  status: 'completed' | 'current' | 'rejected' | 'upcoming';
  timestamp?: string;
  remarks?: string;
}

interface ApprovalTimelineProps {
  status: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
  status,
  rejectionReason,
  createdAt,
  updatedAt,
}) => {
  const normStatus = status ? status.toUpperCase() : '';

  const isDswRejected = normStatus === 'DSW_REJECTED';
  const isPrincipalRejected = normStatus === 'PRINCIPAL_REJECTED';
  const isRejected = isDswRejected || isPrincipalRejected;

  const isDswPassed = ['DSW_APPROVED', 'PENDING_PRINCIPAL', 'PRINCIPAL_APPROVED', 'CERTIFICATE_GENERATED'].includes(normStatus);
  const isPrincipalPassed = ['PRINCIPAL_APPROVED', 'CERTIFICATE_GENERATED'].includes(normStatus);
  const isGenerated = normStatus === 'CERTIFICATE_GENERATED';

  const steps: Step[] = [
    {
      title: 'Application Submitted',
      role: 'Student',
      status: 'completed',
      timestamp: createdAt,
    },
    {
      title: 'DSW Review',
      role: 'Dean Student Welfare',
      status: isDswRejected
        ? 'rejected'
        : isDswPassed
        ? 'completed'
        : normStatus === 'PENDING_DSW' || normStatus === 'SUBMITTED'
        ? 'current'
        : 'upcoming',
      timestamp: isDswPassed || isDswRejected ? updatedAt : undefined,
      remarks: isDswRejected ? rejectionReason : undefined,
    },
    {
      title: 'Principal Review',
      role: 'College Principal',
      status: isPrincipalRejected
        ? 'rejected'
        : isPrincipalPassed
        ? 'completed'
        : normStatus === 'PENDING_PRINCIPAL' || normStatus === 'DSW_APPROVED'
        ? 'current'
        : 'upcoming',
      timestamp: isPrincipalPassed || isPrincipalRejected ? updatedAt : undefined,
      remarks: isPrincipalRejected ? rejectionReason : undefined,
    },
    {
      title: 'Certificate Issued',
      role: 'System',
      status: isGenerated ? 'completed' : 'upcoming',
      timestamp: isGenerated ? updatedAt : undefined,
    },
  ];

  return (
    <div className="py-4">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Approval Workflow Progress
      </h4>
      <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
        {steps.map((step, idx) => {
          let icon = <Circle className="w-4 h-4 text-slate-400" />;
          let circleBg = 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700';

          if (step.status === 'completed') {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
            circleBg = 'bg-emerald-50 border-emerald-500 dark:bg-emerald-950 dark:border-emerald-500';
          } else if (step.status === 'current') {
            icon = <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />;
            circleBg = 'bg-blue-50 border-blue-500 dark:bg-blue-950 dark:border-blue-500';
          } else if (step.status === 'rejected') {
            icon = <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
            circleBg = 'bg-rose-50 border-rose-500 dark:bg-rose-950 dark:border-rose-500';
          }

          return (
            <div key={idx} className="relative group">
              <span
                className={`absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${circleBg}`}
              >
                {icon}
              </span>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                    {step.title}
                  </span>
                  {step.timestamp && (
                    <span className="text-xs text-slate-400">
                      {formatDate(step.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authority: {step.role}
                </p>
                {step.remarks && (
                  <div className="mt-2 text-xs p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                    <strong>Reason for Rejection:</strong> {step.remarks}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isRejected && (
        <div className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3">
          Notice: Your application was rejected. Please review the remarks above and contact the college authority or re-apply if allowed.
        </div>
      )}
    </div>
  );
};
