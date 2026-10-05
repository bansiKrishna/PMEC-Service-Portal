import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { dswApi } from '../../api/dswApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon }) => (
  <div className="stat-card p-3.5 flex flex-col justify-between">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
    <div>
      <div className="text-xl font-bold tracking-tight text-foreground font-mono">{value}</div>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

export const DswDashboard: React.FC = () => {
  const [applications, setApplications] = useState<BonafideApplicationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await dswApi.getPendingApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching DSW applications:', error);
      toast.error('Failed to load pending reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  if (loading) return <LoadingState message="Loading DSW desk..." />;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">DSW Dashboard</h1>
          <p className="page-description">
            Bonafide applications requiring your first-level review.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPending} className="gap-1.5 shrink-0">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Pending Review"
          value={applications.length}
          sub="Action required"
          icon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
        />
        <StatCard
          label="Your Authority"
          value="First Review"
          sub="DSW → Principal"
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
        />
        <StatCard
          label="Rejection Policy"
          value="Remarks Required"
          sub="Mandatory reason on reject"
          icon={<XCircle className="w-3.5 h-3.5 text-destructive" />}
        />
      </div>

      {/* Pending Applications */}
      <div className="content-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="text-xs font-semibold text-foreground">Pending Applications</h2>
            <p className="text-[11px] text-muted-foreground">Applications awaiting DSW review</p>
          </div>
          {applications.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => navigate('/dsw/applications')} className="gap-1 text-xs h-7 px-2 text-muted-foreground hover:text-foreground">
              View All ({applications.length}) <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>

        {applications.length === 0 ? (
          <EmptyState
            title="No Pending Applications"
            description="There are no Bonafide applications currently awaiting DSW review."
            icon={<FileText className="w-5 h-5" />}
          />
        ) : (
          <div className="divide-y divide-border">
            {applications.slice(0, 8).map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/dsw/applications/${app.id}`)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 hover:bg-muted/40 cursor-pointer transition-colors gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">
                      #{app.id} — {app.studentName || `Student ID ${app.studentId}`}
                    </span>
                    {app.rollNumber && (
                      <span className="text-[11px] text-muted-foreground font-mono">({app.rollNumber})</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {app.department ? `${app.department} · ` : ''}{app.reason}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">Submitted {formatDate(app.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={app.status} />
                  <Button size="sm" className="h-7 text-xs gap-1">
                    Review <ArrowRight className="w-3 h-3" />
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
