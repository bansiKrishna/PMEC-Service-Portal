import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('Network Error', {
        description: 'Unable to connect to the PMEC server. Please verify your connection or ensure backend is running at http://localhost:8080.',
      });
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const errorMessage = data?.error || data?.message || data?.detail;

    switch (status) {
      case 401:
        toast.error('Session Expired', {
          description: 'Your session has expired or is invalid. Please log in again.',
        });
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;

      case 403:
        toast.error('Access Denied', {
          description: errorMessage || 'You do not have permission to perform this action.',
        });
        break;

      case 404:
        toast.error('Not Found', {
          description: errorMessage || 'The requested resource was not found on the server.',
        });
        break;

      case 409:
        toast.error('Conflict Error', {
          description: errorMessage || 'A record with these details already exists.',
        });
        break;

      case 422:
      case 400:
        if (typeof data === 'object' && data !== null && !data.error && !data.message) {
          // Field validation errors object (e.g. { email: ["Invalid email"] })
          const firstFieldKey = Object.keys(data)[0];
          const firstErrList = data[firstFieldKey];
          const errDetail = Array.isArray(firstErrList) ? firstErrList[0] : String(firstErrList);
          toast.error('Validation Error', {
            description: `${firstFieldKey}: ${errDetail}`,
          });
        } else {
          toast.error('Request Error', {
            description: errorMessage || 'Invalid request details provided.',
          });
        }
        break;

      case 500:
      default:
        toast.error('Server Error', {
          description: errorMessage || 'Something went wrong on the server. Please try again later.',
        });
        break;
    }

    return Promise.reject(error);
  }
);
