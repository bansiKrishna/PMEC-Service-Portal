import { apiClient } from './axios';
import type { CertificateTemplateResponseDto } from '../types/certificate';

export const certificateApi = {
  uploadTemplate: async (file: File, templateName: string): Promise<CertificateTemplateResponseDto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('templateName', templateName);

    const response = await apiClient.post<CertificateTemplateResponseDto>(
      '/api/admin/certificate-templates/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  getAllTemplates: async (): Promise<CertificateTemplateResponseDto[]> => {
    const response = await apiClient.get<CertificateTemplateResponseDto[]>('/api/admin/certificate-templates');
    return response.data;
  },

  activateTemplate: async (id: number): Promise<CertificateTemplateResponseDto> => {
    const response = await apiClient.put<CertificateTemplateResponseDto>(
      `/api/admin/certificate-templates/${id}/activate`
    );
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/certificate-templates/${id}`);
  },

  uploadSignature: async (file: File): Promise<CertificateTemplateResponseDto> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<CertificateTemplateResponseDto>(
      '/api/admin/certificate-templates/signature',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },
};
