import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Clock, Award, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { principalApi } from '../../api/principalApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';

export const PrincipalDashboard: React.FC = () => {
  const [applications, setApplications] = useState<BonafideApplicationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await principalApi.getPendingApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching Principal applications:', error);
      toast.error('Failed to load Principal approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  if (loading) return <LoadingState message="Loading Principal Executive Desk..." />;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Principal Approval Desk</h1>
          <p className="page-description">
            Final executive sanction and automated PDF certificate generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPending} className="gap-1.5 shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/principal/applications')}
            className="gap-1.5 shrink-0"
          >
            <FileText className="w-3.5 h-3.5" /> Review ({applications.length})
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="stat-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Forwarded by DSW</span>
            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground font-mono">{applications.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pending Principal Action</p>
          </div>
        </div>

        <div className="stat-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">PDF Synthesis</span>
            <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-foreground">Automated PDF Engine</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Generates on Approval</p>
          </div>
        </div>

        <div className="stat-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sanction Authority</span>
            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-foreground">Final Executive Sanction</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">ROLE_PRINCIPAL authority</p>
          </div>
        </div>
      </div>

      {/* Applications list */}
      <div className="content-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="text-xs font-semibold text-foreground">Awaiting Principal Approval</h2>
            <p className="text-[11px] text-muted-foreground">Applications approved by DSW and forwarded for final sanction</p>
          </div>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            title="No Applications Pending Principal Sanction"
            description="There are currently no DSW-approved applications awaiting Principal action."
          />
        ) : (
          <div className="divide-y divide-border">
            {applications.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/principal/applications/${app.id}`)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 hover:bg-muted/40 cursor-pointer transition-colors gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">
                      App #{app.id} • {app.studentName || `Student ID ${app.studentId}`}
                    </span>
                    {app.rollNumber && (
                      <span className="text-[11px] text-muted-foreground font-mono">({app.rollNumber})</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dept: {app.department || 'N/A'} • Reason: {app.reason}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    Submitted: {formatDate(app.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={app.status} />
                  <Button size="sm" className="h-7 text-xs gap-1">
                    Sanction <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
