import { apiClient } from './axios';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ChangePasswordRequest } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/api/auth/register', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/auth/change-password', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<{ email: string; authorities: string[] }> => {
    const response = await apiClient.get<{ email: string; authorities: string[] }>('/api/auth/me');
    return response.data;
  },
};
