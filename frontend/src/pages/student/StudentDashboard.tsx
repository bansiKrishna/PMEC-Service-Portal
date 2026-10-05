import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FilePlus2, FileText, Award, Clock, ArrowRight } from 'lucide-react';
import { studentApi } from '../../api/studentApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

interface StatCardProps {
  label: string;
  value: number;
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

export const StudentDashboard: React.FC = () => {
  const [applications, setApplications] = useState<BonafideApplicationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getMyApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyApplications(); }, []);

  if (loading) return <LoadingState message="Loading your dashboard..." />;

  const pendingCount = applications.filter((a) =>
    ['SUBMITTED', 'PENDING_DSW', 'DSW_APPROVED', 'PENDING_PRINCIPAL'].includes(a.status)
  ).length;

  const approvedCount = applications.filter((a) =>
    ['PRINCIPAL_APPROVED', 'CERTIFICATE_GENERATED', 'GENERATED'].includes(a.status)
  ).length;

  const certReadyCount = applications.filter((a) =>
    a.status === 'CERTIFICATE_GENERATED' || a.status === 'GENERATED'
  ).length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}</h1>
          <p className="page-description">Your academic service requests at a glance.</p>
        </div>
        <Button onClick={() => navigate('/student/bonafide')} size="sm" className="gap-1.5 shrink-0">
          <FilePlus2 className="w-3.5 h-3.5" /> Apply for Bonafide
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Applications"
          value={applications.length}
          sub="All time submissions"
          icon={<FileText className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          sub="Awaiting approval"
          icon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
        />
        <StatCard
          label="Approved"
          value={approvedCount}
          sub="Principal approved"
          icon={<Award className="w-3.5 h-3.5 text-emerald-500" />}
        />
        <StatCard
          label="Certificates Ready"
          value={certReadyCount}
          sub="Available to download"
          icon={<FilePlus2 className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Recent Applications Table */}
      <div className="content-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="text-xs font-semibold text-foreground">Recent Applications</h2>
            <p className="text-[11px] text-muted-foreground">Latest Bonafide certificate requests</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/applications')} className="gap-1 text-xs h-7 px-2 text-muted-foreground hover:text-foreground">
            View All <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            title="No Applications Yet"
            description="Submit your first Bonafide certificate request to get started."
            actionLabel="Apply for Bonafide"
            onAction={() => navigate('/student/bonafide')}
          />
        ) : (
          <div className="divide-y divide-border">
            {applications.slice(0, 5).map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/student/applications/${app.id}`)}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 hover:bg-muted/40 cursor-pointer transition-colors gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      Application #{app.id}
                    </span>
                    <span className="text-[11px] text-muted-foreground">• {app.academicYear}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.reason}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{formatDate(app.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={app.status} />
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick CTA if certificates ready */}
      {certReadyCount > 0 && (
        <div className="p-3.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-400">
              🎉 {certReadyCount} certificate{certReadyCount > 1 ? 's' : ''} ready for download
            </p>
            <p className="text-[11px] text-emerald-400/80 mt-0.5">
              Your Bonafide certificates have been approved and generated.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/student/certificates')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
          >
            Download Now
          </Button>
        </div>
      )}
    </div>
  );
};
