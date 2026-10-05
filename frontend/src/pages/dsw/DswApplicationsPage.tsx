import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { dswApi } from '../../api/dswApi';
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

export const DswApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<BonafideApplicationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialog States
  const [approveApp, setApproveApp] = useState<BonafideApplicationResponseDto | null>(null);
  const [approveRemarks, setApproveRemarks] = useState<string>('');
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const [rejectApp, setRejectApp] = useState<BonafideApplicationResponseDto | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const navigate = useNavigate();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await dswApi.getPendingApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching DSW applications:', error);
      toast.error('Failed to load pending applications');
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
      await dswApi.approveApplication(approveApp.id, approveRemarks || undefined);
      toast.success('Application Approved', {
        description: `Application #${approveApp.id} has been approved by DSW and forwarded to Principal.`,
      });
      setApproveApp(null);
      setApproveRemarks('');
      fetchApplications();
    } catch (error) {
      console.error('Approval failed:', error);
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
      await dswApi.rejectApplication(rejectApp.id, { reason: rejectReason });
      toast.success('Application Rejected', {
        description: `Application #${rejectApp.id} has been rejected with remarks.`,
      });
      setRejectApp(null);
      setRejectReason('');
      fetchApplications();
    } catch (error) {
      console.error('Rejection failed:', error);
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
            DSW Bonafide Verification Desk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review and approve pending student applications to forward to the Principal.
          </p>
        </div>

        <Button variant="outline" onClick={fetchApplications} className="gap-2 text-xs">
          <RefreshCw className="w-4 h-4" /> Refresh Applications
        </Button>
      </div>

      <Card className="glass-panel">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-semibold">Pending Applications Queue</CardTitle>
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
            <LoadingState rows={4} message="Fetching pending applications..." />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              title="No Applications Awaiting DSW Action"
              description="All submitted Bonafide applications have been processed."
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
                  <TableHead className="text-right">Desk Actions</TableHead>
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
                        onClick={() => navigate(`/dsw/applications/${app.id}`)}
                        className="text-xs"
                      >
                        Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setApproveApp(app)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
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
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" /> Approve Bonafide Application?
            </DialogTitle>
            <DialogDescription>
              Review application details before forwarding to Principal.
            </DialogDescription>
          </DialogHeader>

          {approveApp && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <p><strong>Application ID:</strong> #{approveApp.id}</p>
                <p><strong>Student:</strong> {approveApp.studentName} ({approveApp.rollNumber})</p>
                <p><strong>Reason:</strong> {approveApp.reason}</p>
                <p><strong>Parent Name:</strong> {approveApp.parentName}</p>
                {approveApp.hostelName && <p><strong>Hostel:</strong> {approveApp.hostelName}, Room {approveApp.roomNumber}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="remarks">DSW Remarks (Optional)</Label>
                <Input
                  id="remarks"
                  placeholder="Recommended for Principal approval..."
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveApp(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {isApproving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectApp} onOpenChange={() => setRejectApp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Reject Bonafide Application?
            </DialogTitle>
            <DialogDescription>
              You must provide a clear rejection reason for the student.
            </DialogDescription>
          </DialogHeader>

          {rejectApp && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p><strong>Application ID:</strong> #{rejectApp.id}</p>
                <p><strong>Student:</strong> {rejectApp.studentName}</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="rejectReason">Rejection Reason *</Label>
                <textarea
                  id="rejectReason"
                  rows={3}
                  placeholder="Specify why this application is rejected..."
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
