import { apiClient } from './axios';
import type {
  BonafideApplicationResponseDto,
  RejectBonafideRequestDto,
} from '../types/bonafide';
import type { ReviewTab, ReviewSummary } from '../types/review';

export const dswApi = {
  getReviewHistory: async (): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>(
      '/api/bonafide/dsw/history'
    );
    return response.data;
  },

  getPendingApplications: async (): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>(
      '/api/dsw/bonafide/applications',
      { params: { status: 'PENDING' } },
    );
    return response.data;
  },

  getApplications: async (status: ReviewTab): Promise<BonafideApplicationResponseDto[]> => {
    const response = await apiClient.get<BonafideApplicationResponseDto[]>(
      '/api/dsw/bonafide/applications',
      { params: { status } },
    );
    return response.data;
  },

  getSummary: async (): Promise<ReviewSummary> => {
    const response = await apiClient.get<ReviewSummary>(
      '/api/dsw/bonafide/applications/summary',
    );
    return response.data;
  },

  getApplicationById: async (
    id: number
  ): Promise<BonafideApplicationResponseDto> => {
    const response = await apiClient.get<BonafideApplicationResponseDto>(
      `/api/dsw/bonafide/applications/${id}`
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
    await apiClient.post(
      `/api/dsw/bonafide/applications/${id}/reject`,
      data
    );
  },
};