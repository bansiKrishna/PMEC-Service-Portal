import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Users, FileCode, UserCheck, Plus, ArrowRight, CheckCircle2, Server,
  Shield, Database, Zap
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { certificateApi } from '../../api/certificateApi';
import type { StaffResponse } from '../../types/admin';
import type { CertificateTemplateResponseDto } from '../../types/certificate';
import { Button } from '../../components/ui/button';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
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

export const AdminDashboard: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplateResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [staffData, templateData] = await Promise.all([
        adminApi.getAllStaff().catch(() => []),
        certificateApi.getAllTemplates().catch(() => []),
      ]);
      setStaffList(staffData);
      setTemplates(templateData);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;

  const activeStaffCount = staffList.filter((s) => s.enabled).length;
  const activeTemplate = templates.find((t) => t.active);

  const systemChecks = [
    { label: 'Backend API', status: true, icon: <Server className="w-3.5 h-3.5" /> },
    { label: 'Authentication', status: true, icon: <Shield className="w-3.5 h-3.5" /> },
    { label: 'Database', status: true, icon: <Database className="w-3.5 h-3.5" /> },
    { label: 'PDF Generator', status: !!activeTemplate, icon: <Zap className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-description">PMEC College Service Portal management console.</p>
        </div>
        <Button onClick={() => navigate('/admin/staff')} size="sm" className="gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Add Staff Member
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Staff"
          value={staffList.length}
          sub="Configured accounts"
          icon={<Users className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Active Staff"
          value={activeStaffCount}
          sub={`${staffList.length > 0 ? Math.round((activeStaffCount / staffList.length) * 100) : 0}% enabled`}
          icon={<UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
        />
        <StatCard
          label="Templates"
          value={templates.length}
          sub="Uploaded layouts"
          icon={<FileCode className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Active Template"
          value={activeTemplate ? 'v' + activeTemplate.version : 'None'}
          sub={activeTemplate ? activeTemplate.templateName : 'Upload a template'}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
        />
      </div>

      {/* Two-column content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staff Overview */}
        <div className="content-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-xs font-semibold text-foreground">Staff Overview</h2>
              <p className="text-[11px] text-muted-foreground">DSW, Principal & Librarian accounts</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/staff')} className="gap-1 text-xs h-7 px-2 text-muted-foreground hover:text-foreground">
              Manage <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {staffList.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                No staff accounts created yet.{' '}
                <button
                  onClick={() => navigate('/admin/staff')}
                  className="text-primary hover:underline font-medium"
                >
                  Add a staff member →
                </button>
              </div>
            ) : (
              staffList.slice(0, 5).map((staff) => (
                <div key={staff.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{staff.fullName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{staff.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <StatusBadge status={staff.role} />
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      staff.enabled
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-destructive/15 text-destructive border border-destructive/20'
                    }`}>
                      {staff.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Certificate Template */}
        <div className="content-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h2 className="text-xs font-semibold text-foreground">Certificate Templates</h2>
                <p className="text-[11px] text-muted-foreground">HTML layout for Bonafide PDFs</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/certificate-templates')} className="gap-1 text-xs h-7 px-2 text-muted-foreground hover:text-foreground">
                Manage <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="p-4">
              {activeTemplate ? (
                <div className="p-3 rounded-md border border-primary/20 bg-primary/5">
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">ACTIVE</span>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{activeTemplate.templateName}</p>
                    </div>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono">
                      v{activeTemplate.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{activeTemplate.fileName}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Uploaded {formatDate(activeTemplate.uploadedAt)}</p>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No active template.{' '}
                  <button
                    onClick={() => navigate('/admin/certificate-templates')}
                    className="text-primary hover:underline font-medium"
                  >
                    Upload one →
                  </button>
                </div>
              )}

              {templates.length > 1 && (
                <p className="text-[11px] text-muted-foreground mt-2 text-center">{templates.length - 1} inactive template(s)</p>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="border-t border-border px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Status</p>
            <div className="grid grid-cols-2 gap-2">
              {systemChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-1.5">
                  <span className={`shrink-0 ${check.status ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {check.icon}
                  </span>
                  <span className="text-xs text-muted-foreground">{check.label}</span>
                  <span className={`ml-auto text-[10px] font-semibold ${check.status ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {check.status ? 'OK' : 'Check'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
