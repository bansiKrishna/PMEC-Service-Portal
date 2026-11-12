import { apiClient } from './axios';
import type {
  BonafideApplicationResponseDto,
  RejectBonafideRequestDto,
} from '../types/bonafide';
import type { ReviewTab, ReviewSummary } from '../types/review';

export const principalApi = {
  getPendingApplications: async (): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>(
      '/api/principal/bonafide/applications',
      { params: { status: 'PENDING' } },
    );
    return response.data;
  },

  getApplications: async (status: ReviewTab): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>(
      '/api/principal/bonafide/applications',
      { params: { status } },
    );
    return response.data;
  },

  getSummary: async (): Promise<ReviewSummary> => {
    const response = await apiClient.get<ReviewSummary>(
      '/api/principal/bonafide/applications/summary',
    );
    return response.data;
  },

  getApplicationById: async (
    id: number
  ): Promise<BonafideApplicationResponseDto> => {
    const response = await apiClient.get<BonafideApplicationResponseDto>(
      `/api/principal/bonafide/applications/${id}`
    );

    return response.data;
  },

  approveApplication: async (
    id: number
  ): Promise<void> => {
    await apiClient.post(
      `/api/principal/bonafide/applications/${id}/approve`
    );
  },

  rejectApplication: async (
    id: number,
    data: RejectBonafideRequestDto
  ): Promise<void> => {
    await apiClient.post(
      `/api/principal/bonafide/applications/${id}/reject`,
      data
    );
  },
};