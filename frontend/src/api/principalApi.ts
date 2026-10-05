import { apiClient } from './axios';
import type {
  BonafideApplicationResponseDto,
  RejectBonafideRequestDto,
} from '../types/bonafide';

export const principalApi = {
  getPendingApplications: async (): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>(
      '/api/bonafide/principal/pending'
    );

    return response.data;
  },

  getApplicationById: async (
    id: number
  ): Promise<BonafideApplicationResponseDto> => {
    const response = await apiClient.get<BonafideApplicationResponseDto>(
      `/api/bonafide/principal/${id}`
    );

    return response.data;
  },

  approveApplication: async (
    id: number
  ): Promise<void> => {
    await apiClient.put(
      `/api/bonafide/principal/${id}/approve`
    );
  },

  rejectApplication: async (
    id: number,
    data: RejectBonafideRequestDto
  ): Promise<void> => {
    await apiClient.put(
      `/api/bonafide/principal/${id}/reject`,
      data
    );
  },
};