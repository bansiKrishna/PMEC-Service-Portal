import React from 'react';
import { Clock, CheckCircle2, XCircle, FileCheck, Send, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalized = status ? status.toUpperCase() : '';

  const baseClass = 'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border';

  switch (normalized) {
    case 'DRAFT':
      return (
        <span className={`${baseClass} bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 ${className}`}>
          <Clock className="w-3 h-3" /> Draft
        </span>
      );

    case 'SUBMITTED':
    case 'PENDING_DSW':
      return (
        <span className={`${baseClass} badge-pending ${className}`}>
          <Send className="w-3 h-3" /> Pending DSW
        </span>
      );

    case 'DSW_APPROVED':
    case 'PENDING_PRINCIPAL':
      return (
        <span className={`${baseClass} badge-info ${className}`}>
          <Clock className="w-3 h-3" /> Pending Principal
        </span>
      );

    case 'DSW_REJECTED':
      return (
        <span className={`${baseClass} badge-rejected ${className}`}>
          <XCircle className="w-3 h-3" /> DSW Rejected
        </span>
      );

    case 'PRINCIPAL_APPROVED':
      return (
        <span className={`${baseClass} badge-approved ${className}`}>
          <CheckCircle2 className="w-3 h-3" /> Principal Approved
        </span>
      );

    case 'PRINCIPAL_REJECTED':
      return (
        <span className={`${baseClass} badge-rejected ${className}`}>
          <XCircle className="w-3 h-3" /> Principal Rejected
        </span>
      );

    case 'CERTIFICATE_GENERATED':
    case 'GENERATED':
      return (
        <span className={`${baseClass} badge-approved ${className}`}>
          <FileCheck className="w-3 h-3" /> Certificate Ready
        </span>
      );

    case 'DSW':
      return (
        <span className={`${baseClass} badge-info ${className}`}>
          DSW
        </span>
      );

    case 'PRINCIPAL':
      return (
        <span className={`${baseClass} badge-approved ${className}`}>
          Principal
        </span>
      );

    case 'LIBRARIAN':
      return (
        <span className={`${baseClass} bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900 ${className}`}>
          Librarian
        </span>
      );

    case 'ENABLED':
    case 'ACTIVE':
      return (
        <span className={`${baseClass} badge-approved ${className}`}>
          <CheckCircle2 className="w-3 h-3" /> Active
        </span>
      );

    case 'DISABLED':
    case 'INACTIVE':
      return (
        <span className={`${baseClass} badge-rejected ${className}`}>
          <XCircle className="w-3 h-3" /> Disabled
        </span>
      );

    default:
      return (
        <span className={`${baseClass} bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 ${className}`}>
          <AlertCircle className="w-3 h-3" /> {status}
        </span>
      );
  }
};
