export interface CertificateTemplateResponseDto {
  id: number;
  templateName: string;
  fileName: string;
  version: number;
  active: boolean;
  uploadedAt: string;
}

export interface GeneratedCertificateDto {
  id: number;
  applicationId: number;
  certificateNumber: string;
  issueDate: string;
  pdfPath?: string;
}
