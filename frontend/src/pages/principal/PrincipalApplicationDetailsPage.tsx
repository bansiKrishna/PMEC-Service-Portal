import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, XCircle, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { principalApi } from '../../api/principalApi';
import { studentApi } from '../../api/studentApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApprovalTimeline } from '../../components/common/ApprovalTimeline';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { formatDate, formatSimpleDate } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';

export const PrincipalApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<BonafideApplicationResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Dialog States
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const navigate = useNavigate();

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await studentApi.getApplicationById(Number(id));
      setApp(data);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!app) return;
    setIsApproving(true);
    try {
      await principalApi.approveApplication(app.id);
      toast.success('Approved by Principal', {
        description: `Application #${app.id} approved. PDF Certificate is synthesized.`,
      });
      setIsApproveOpen(false);
      fetchDetails();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!app || !rejectReason.trim()) {
      toast.error('Please specify rejection reason');
      return;
    }
    setIsRejecting(true);
    try {
      await principalApi.rejectApplication(app.id, { reason: rejectReason });
      toast.success('Application Rejected');
      setIsRejectOpen(false);
      fetchDetails();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsRejecting(false);
    }
  };

  if (loading) return <LoadingState message="Fetching application data..." />;
  if (!app) return <ErrorState title="Application Not Found" onRetry={fetchDetails} />;

  const isPendingPrincipal = app.status === 'PENDING_PRINCIPAL' || app.status === 'DSW_APPROVED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Principal Sanction: App #{app.id}
              </h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-xs text-slate-500">Submitted: {formatDate(app.createdAt)}</p>
          </div>
        </div>

        {isPendingPrincipal && (
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsApproveOpen(true)} className="gap-1 bg-indigo-600 hover:bg-indigo-500">
              <CheckCircle2 className="w-4 h-4" /> Approve & Generate PDF
            </Button>
            <Button variant="destructive" onClick={() => setIsRejectOpen(true)} className="gap-1">
              <XCircle className="w-4 h-4" /> Reject Request
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" /> Student Profile & Application Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Student Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {app.studentName || `Student #${app.studentId}`}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Roll Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {app.rollNumber || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Department & Semester</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {app.department || 'N/A'} (Semester {app.semester || 'N/A'})
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Academic Year</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{app.academicYear}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Parent / Guardian</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{app.parentName}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Phone Number</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{app.phoneNumber}</span>
                </div>
              </div>

              {app.hostelName && (
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Hostel Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{app.hostelName}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Room Number</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{app.roomNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Hostel Admission</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatSimpleDate(app.hostelAdmissionDate)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <span className="text-xs font-semibold text-slate-400 block">Application Reason</span>
                <p className="mt-1 p-3 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 text-xs">
                  {app.reason}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base font-bold">Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalTimeline
                status={app.status}
                rejectionReason={app.rejectionReason}
                createdAt={app.createdAt}
                updatedAt={app.updatedAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <CheckCircle2 className="w-5 h-5" /> Confirm Executive Sanction?
            </DialogTitle>
            <DialogDescription>
              Granting approval will synthesize the active HTML template and e-signature into a downloadable PDF certificate.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isApproving} className="bg-indigo-600 hover:bg-indigo-500">
              {isApproving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Approval & Synthesize PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Executive Rejection
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Label htmlFor="principalRejReason">Rejection Reason *</Label>
            <textarea
              id="principalRejReason"
              rows={3}
              placeholder="State executive rejection reason..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting || !rejectReason.trim()}>
              {isRejecting ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
