import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FilePlus2, Search, ArrowRight } from 'lucide-react';
import { studentApi } from '../../api/studentApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';

export const StudentApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<BonafideApplicationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getMyApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load application history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSubmitApplication = async (id: number) => {
    setSubmittingId(id);
    try {
      await studentApi.submitApplication(id);
      toast.success(`Application #${id} submitted for DSW review`);
      await fetchApplications();
    } catch (error) {
      console.error(`Failed to submit application #${id}:`, error);
      toast.error(`Could not submit application #${id}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.id.toString().includes(searchQuery) ||
      app.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.academicYear.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My Applications History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track all your submitted Bonafide certificate requests.
          </p>
        </div>

        <Button onClick={() => navigate('/student/bonafide')} className="gap-2 shadow-md shadow-blue-500/20">
          <FilePlus2 className="w-4 h-4" /> New Application
        </Button>
      </div>

      <Card className="glass-panel">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-semibold">Submitted Applications</CardTitle>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by ID or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING_DSW">Pending DSW</SelectItem>
                  <SelectItem value="PENDING_PRINCIPAL">Pending Principal</SelectItem>
                  <SelectItem value="DSW_REJECTED">DSW Rejected</SelectItem>
                  <SelectItem value="PRINCIPAL_REJECTED">Principal Rejected</SelectItem>
                  <SelectItem value="CERTIFICATE_GENERATED">Certificate Ready</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingState rows={4} message="Fetching application records..." />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              title="No Applications Found"
              description="No applications match your search and filter criteria."
              actionLabel="Apply for Bonafide"
              onAction={() => navigate('/student/bonafide')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App ID</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Reason / Purpose</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      #{app.id}
                    </TableCell>
                    <TableCell className="text-xs">{app.academicYear}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">{app.reason}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(app.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {['DRAFT', 'DSW_REJECTED', 'PRINCIPAL_REJECTED'].includes(app.status) && (
                        <Button
                          size="sm"
                          disabled={submittingId === app.id}
                          onClick={() => handleSubmitApplication(app.id)}
                          className="mr-2"
                        >
                          {submittingId === app.id ? 'Submitting...' : 'Submit for DSW review'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/student/applications/${app.id}`)}
                        className="gap-1 text-xs"
                      >
                        View Details <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
