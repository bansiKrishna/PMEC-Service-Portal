import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Award, Download, FileCheck, Eye, RefreshCw } from 'lucide-react';
import { studentApi } from '../../api/studentApi';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

export const StudentCertificatesPage: React.FC = () => {
  const [readyApps, setReadyApps] = useState<BonafideApplicationResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // PDF Preview Modal State
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewAppId, setPreviewAppId] = useState<number | null>(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getMyApplications();
      const approved = data.filter(
        (a) => a.status === 'CERTIFICATE_GENERATED' || a.status === 'GENERATED'
      );
      setReadyApps(approved);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownload = async (appId: number) => {
    setDownloadingId(appId);
    try {
      const blob = await studentApi.downloadCertificate(appId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PMEC-Bonafide-Certificate-${appId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate Downloaded');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (appId: number) => {
    try {
      const blob = await studentApi.downloadCertificate(appId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
      setPreviewAppId(appId);
    } catch (error) {
      console.error('Failed to load preview:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Bonafide Certificates
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View and download your officially approved and generated PMEC Bonafide Certificates.
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" /> Issued Certificates
          </CardTitle>
          <CardDescription>
            These certificates have completed principal review and signature injection.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingState rows={2} message="Loading issued certificates..." />
          ) : readyApps.length === 0 ? (
            <EmptyState
              title="No Certificates Available Yet"
              description="Your applications are currently undergoing DSW and Principal approvals."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyApps.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          Bonafide Certificate #{app.id}
                        </h3>
                        <p className="text-xs text-slate-500">Academic Year: {app.academicYear}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                    Purpose: {app.reason}
                  </p>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Approved: {formatDate(app.updatedAt)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(app.id)}
                        className="gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(app.id)}
                        disabled={downloadingId === app.id}
                        className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500"
                      >
                        {downloadingId === app.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview Modal */}
      <Dialog open={!!previewPdfUrl} onOpenChange={() => setPreviewPdfUrl(null)}>
        <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" /> Bonafide Certificate Preview #{previewAppId}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full bg-slate-900 rounded-lg overflow-hidden my-2">
            {previewPdfUrl && (
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-0"
                title="Certificate PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
