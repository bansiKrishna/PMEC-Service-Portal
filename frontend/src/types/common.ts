export interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  [key: string]: unknown;
}

export type Theme = 'light' | 'dark' | 'system';
