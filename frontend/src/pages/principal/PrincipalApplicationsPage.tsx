import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { principalApi } from '../../api/principalApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';

export const PrincipalApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<BonafideApplicationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialog States
  const [approveApp, setApproveApp] = useState<BonafideApplicationResponseDto | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const [rejectApp, setRejectApp] = useState<BonafideApplicationResponseDto | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const navigate = useNavigate();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await principalApi.getPendingApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching Principal applications:', error);
      toast.error('Failed to load Principal applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async () => {
    if (!approveApp) return;
    setIsApproving(true);
    try {
      await principalApi.approveApplication(approveApp.id);
      toast.success('Application Approved by Principal', {
        description: `Application #${approveApp.id} has been approved. The backend PDF generator is compiling the certificate.`,
      });
      setApproveApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Principal approval failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectApp || !rejectReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    setIsRejecting(true);
    try {
      await principalApi.rejectApplication(rejectApp.id, { reason: rejectReason });
      toast.success('Application Rejected', {
        description: `Application #${rejectApp.id} rejected by Principal.`,
      });
      setRejectApp(null);
      setRejectReason('');
      fetchApplications();
    } catch (error) {
      console.error('Principal rejection failed:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    return (
      app.id.toString().includes(searchQuery) ||
      (app.studentName && app.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.rollNumber && app.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      app.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Principal Executive Approvals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Grant final approval to trigger automated backend PDF certificate generation.
          </p>
        </div>

        <Button variant="outline" onClick={fetchApplications} className="gap-2 text-xs">
          <RefreshCw className="w-4 h-4" /> Refresh Queue
        </Button>
      </div>

      <Card className="glass-panel">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-semibold">Forwarded Applications Queue</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student, roll no, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingState rows={4} message="Fetching applications forwarded by DSW..." />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              title="No Applications Awaiting Principal Sanction"
              description="All forwarded Bonafide applications have been processed."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Principal Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      #{app.id}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                      {app.studentName || `Student #${app.studentId}`}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{app.rollNumber || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{app.department || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">{app.reason}</TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(app.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/principal/applications/${app.id}`)}
                        className="text-xs"
                      >
                        Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setApproveApp(app)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Generate
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRejectApp(app)}
                        className="text-xs gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!approveApp} onOpenChange={() => setApproveApp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <CheckCircle2 className="w-5 h-5" /> Grant Executive Approval?
            </DialogTitle>
            <DialogDescription>
              Confirming approval will trigger backend PDF certificate synthesis.
            </DialogDescription>
          </DialogHeader>

          {approveApp && (
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1 my-2">
              <p><strong>Application ID:</strong> #{approveApp.id}</p>
              <p><strong>Student:</strong> {approveApp.studentName} ({approveApp.rollNumber})</p>
              <p><strong>Reason:</strong> {approveApp.reason}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveApp(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              {isApproving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Approve & Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectApp} onOpenChange={() => setRejectApp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Reject Application?
            </DialogTitle>
            <DialogDescription>
              Specify the reason for Principal rejection.
            </DialogDescription>
          </DialogHeader>

          {rejectApp && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p><strong>Application ID:</strong> #{rejectApp.id}</p>
                <p><strong>Student:</strong> {rejectApp.studentName}</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="principalRejectReason">Rejection Reason *</Label>
                <textarea
                  id="principalRejectReason"
                  rows={3}
                  placeholder="Specify executive rejection reason..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectApp(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
