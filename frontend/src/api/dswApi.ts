import { apiClient } from './axios';
import type {
  BonafideApplicationResponseDto,
  RejectBonafideRequestDto,
} from '../types/bonafide';

export const dswApi = {
  getPendingApplications: async (): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>(
      '/api/bonafide/dsw/pending'
    );

    return response.data;
  },

  getApplicationById: async (
    id: number
  ): Promise<BonafideApplicationResponseDto> => {
    const response = await apiClient.get<BonafideApplicationResponseDto>(
      `/api/bonafide/dsw/${id}`
    );

    return response.data;
  },

  approveApplication: async (
    id: number,
    remarks?: string
  ): Promise<void> => {
    await apiClient.post(`/api/dsw/bonafide/applications/${id}/approve`, null, {
      params: remarks ? { remarks } : undefined,
    });
  },

  rejectApplication: async (
    id: number,
    data: RejectBonafideRequestDto
  ): Promise<void> => {
    await apiClient.put(
      `/api/bonafide/dsw/${id}/reject`,
      data
    );
  },
};