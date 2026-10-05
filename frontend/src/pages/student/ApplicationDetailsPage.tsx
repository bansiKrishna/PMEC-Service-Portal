import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Download, FileText, Award, RefreshCw } from 'lucide-react';
import { studentApi } from '../../api/studentApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ApprovalTimeline } from '../../components/common/ApprovalTimeline';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { formatDate, formatSimpleDate } from '../../lib/utils';

export const ApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<BonafideApplicationResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await studentApi.getApplicationById(Number(id));
      setApp(data);
    } catch (err: unknown) {
      console.error('Error fetching application details:', err);
      setErrorMsg('Unable to retrieve application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!app) return;
    setIsDownloading(true);
    try {
      const blob = await studentApi.downloadCertificate(app.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PMEC-Bonafide-Certificate-${app.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate Downloaded', {
        description: `Downloaded Bonafide Certificate PDF for Application #${app.id}.`,
      });
    } catch (err) {
      console.error('Failed to download certificate:', err);
      toast.error('Download Failed', {
        description: 'Unable to download certificate PDF from backend.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <LoadingState message="Loading application details..." />;
  if (errorMsg || !app) return <ErrorState title="Application Not Found" onRetry={fetchDetails} />;

  const isReady = app.status === 'CERTIFICATE_GENERATED' || app.status === 'GENERATED';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Application #{app.id}
              </h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-xs text-slate-500">Submitted on {formatDate(app.createdAt)}</p>
          </div>
        </div>

        {isReady && (
          <Button onClick={handleDownloadPdf} disabled={isDownloading} className="gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20">
            {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Official Certificate
          </Button>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Application Particulars
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Academic Year</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{app.academicYear}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">College Admission Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatSimpleDate(app.collegeAdmissionDate)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Parent / Guardian</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{app.parentName}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block">Contact Phone</span>
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
                <span className="text-xs font-semibold text-slate-400 block">Stated Reason</span>
                <p className="mt-1 p-3 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 text-xs">
                  {app.reason}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Workflow Timeline */}
        <div className="space-y-6">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-500" /> Status Timeline
              </CardTitle>
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
    </div>
  );
};
