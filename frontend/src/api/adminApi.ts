import { apiClient } from './axios';
import type { CreateStaffRequest, StaffResponse, SetStaffPasswordRequest, SetStaffRoleRequest } from '../types/admin';

export const adminApi = {
  createStaff: async (data: CreateStaffRequest): Promise<StaffResponse> => {
    const response = await apiClient.post<StaffResponse>('/api/admin/users/staff', data);
    return response.data;
  },

  getAllStaff: async (): Promise<StaffResponse[]> => {
    const response = await apiClient.get<StaffResponse[]>('/api/admin/users/staff');
    return response.data;
  },

  getStaffById: async (id: number): Promise<StaffResponse> => {
    const response = await apiClient.get<StaffResponse>(`/api/admin/users/staff/${id}`);
    return response.data;
  },

  disableStaff: async (id: number): Promise<void> => {
    await apiClient.patch(`/api/admin/users/staff/${id}/disable`);
  },

  enableStaff: async (id: number): Promise<void> => {
    await apiClient.patch(`/api/admin/users/staff/${id}/enable`);
  },

  changeStaffPassword: async (id: number, data: SetStaffPasswordRequest): Promise<void> => {
    await apiClient.put(`/api/admin/users/staff/${id}/password`, data);
  },

  changeStaffRole: async (id: number, data: SetStaffRoleRequest): Promise<StaffResponse> => {
    const response = await apiClient.put<StaffResponse>(`/api/admin/users/staff/${id}/role`, data);
    return response.data;
  },
};
