import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileCode, Upload, CheckCircle2, Trash2, PenTool, RefreshCw, FileText } from 'lucide-react';
import { certificateApi } from '../../api/certificateApi';
import type { CertificateTemplateResponseDto } from '../../types/certificate';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { FileUpload } from '../../components/common/FileUpload';
import { LoadingState } from '../../components/common/LoadingState';
import { formatDate } from '../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';

export const CertificateTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<CertificateTemplateResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Upload Template Dialog State
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState<boolean>(false);

  // Upload Signature Dialog State
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState<boolean>(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState<boolean>(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await certificateApi.getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load certificate templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleUploadTemplate = async () => {
    if (!templateName || !templateFile) {
      toast.error('Please specify template name and select an HTML file');
      return;
    }
    setIsUploadingTemplate(true);
    try {
      const created = await certificateApi.uploadTemplate(templateFile, templateName);
      toast.success('Template Uploaded', {
        description: `Successfully uploaded ${created.templateName} (Version ${created.version}).`,
      });
      setIsTemplateDialogOpen(false);
      setTemplateName('');
      setTemplateFile(null);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to upload template:', error);
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleUploadSignature = async () => {
    if (!signatureFile) {
      toast.error('Please select an e-signature image file');
      return;
    }
    setIsUploadingSignature(true);
    try {
      await certificateApi.uploadSignature(signatureFile);
      toast.success('E-Signature Uploaded', {
        description: 'Official e-signature image updated for PDF certificate generation.',
      });
      setIsSignatureDialogOpen(false);
      setSignatureFile(null);
    } catch (error) {
      console.error('Failed to upload signature:', error);
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await certificateApi.activateTemplate(id);
      toast.success('Template Activated', {
        description: 'Selected template is now active for Bonafide certificate generation.',
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error activating template:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await certificateApi.deleteTemplate(id);
      toast.success('Template Deleted');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Certificate Templates & Signatures
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload HTML Bonafide certificate templates and official authority e-signature graphic files.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setIsSignatureDialogOpen(true)} className="gap-2">
            <PenTool className="w-4 h-4 text-indigo-500" /> Upload E-Signature
          </Button>
          <Button onClick={() => setIsTemplateDialogOpen(true)} className="gap-2 shadow-md shadow-blue-500/20">
            <Upload className="w-4 h-4" /> Upload Template
          </Button>
        </div>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Uploaded HTML Templates</span>
            <Badge variant="outline">{templates.length} Total</Badge>
          </CardTitle>
          <CardDescription>
            Only one template can be active at a time. The active template is populated with student data to generate Bonafide PDFs.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <LoadingState rows={3} message="Loading certificate templates..." />
          ) : templates.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <FileCode className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Certificate Templates Found
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your HTML template containing Thymeleaf placeholders (such as studentName, rollNumber, department).
              </p>
              <Button size="sm" onClick={() => setIsTemplateDialogOpen(true)}>
                Upload HTML Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`p-5 rounded-xl border transition-all ${
                    tpl.active
                      ? 'border-blue-500/60 bg-blue-50/40 dark:bg-blue-950/30 shadow-md shadow-blue-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                          {tpl.templateName}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          {tpl.fileName} (v{tpl.version})
                        </p>
                      </div>
                    </div>
                    {tpl.active ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Uploaded: {formatDate(tpl.uploadedAt)}</span>
                    <div className="flex items-center space-x-2">
                      {!tpl.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(tpl.id)}
                          className="h-8 text-xs gap-1"
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tpl.id)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-700"
                        title="Delete Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-600" /> Upload Certificate HTML Template
            </DialogTitle>
            <DialogDescription>
              Upload an HTML file formatted for Spring Boot Thymeleaf PDF rendering.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="templateName">Template Title</Label>
              <Input
                id="templateName"
                placeholder="PMEC Bonafide Template 2025"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            <FileUpload
              accept=".html,.htm"
              label="HTML Template File"
              description="Upload .html file with Thymeleaf expressions"
              onFileSelect={(file) => setTemplateFile(file)}
              isUploading={isUploadingTemplate}
              onReset={() => setTemplateFile(null)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadTemplate} disabled={isUploadingTemplate || !templateFile}>
              {isUploadingTemplate ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Submit & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" /> Upload Official E-Signature
            </DialogTitle>
            <DialogDescription>
              Upload high-resolution transparent PNG/JPG signature graphic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FileUpload
              accept="image/png,image/jpeg,image/webp"
              label="Signature Image File"
              description="PNG or JPG image with signature (max 5MB)"
              onFileSelect={(file) => setSignatureFile(file)}
              isUploading={isUploadingSignature}
              onReset={() => setSignatureFile(null)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadSignature} disabled={isUploadingSignature || !signatureFile}>
              {isUploadingSignature ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
              Save E-Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
