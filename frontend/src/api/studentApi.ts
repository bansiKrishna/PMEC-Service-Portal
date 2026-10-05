import { apiClient } from './axios';
import type { BonafideApplicationRequestDto, BonafideApplicationResponseDto, BonafideStatusResponseDto } from '../types/bonafide';

export const studentApi = {
  applyBonafide: async (data: BonafideApplicationRequestDto): Promise<BonafideApplicationResponseDto> => {
    const response = await apiClient.post<BonafideApplicationResponseDto>('/api/bonafide', data);
    return response.data;
  },

  getMyApplications: async (): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>('/api/bonafide/my');
    return response.data;
  },

  getApplicationById: async (id: number): Promise<BonafideApplicationResponseDto> => {
    const response = await apiClient.get<BonafideApplicationResponseDto>(`/api/bonafide/${id}`);
    return response.data;
  },

  getApplicationStatus: async (id: number): Promise<BonafideStatusResponseDto> => {
    const response = await apiClient.get<BonafideStatusResponseDto>(`/api/bonafide/${id}/status`);
    return response.data;
  },

  submitApplication: async (id: number): Promise<void> => {
    await apiClient.post(`/api/bonafide/${id}/submit`);
  },

  downloadCertificate: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/api/bonafide/${id}/certificate`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
