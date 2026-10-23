import { apiClient } from './axios';

export interface EmailServiceSettings {
  gmailAddress: string | null;
  configured: boolean;
}

export const emailSettingsApi = {
  getSettings: async (): Promise<EmailServiceSettings> => {
    const response = await apiClient.get<EmailServiceSettings>('/api/admin/email-settings');
    return response.data;
  },

  saveSettings: async (gmailAddress: string, appPassword: string): Promise<EmailServiceSettings> => {
    const response = await apiClient.put<EmailServiceSettings>('/api/admin/email-settings', {
      gmailAddress,
      appPassword,
    });
    return response.data;
  },

  sendTestEmail: async (recipientEmail: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/admin/email-settings/test', {
      recipientEmail: recipientEmail.trim() || null,
    });
    return response.data;
  },
};
