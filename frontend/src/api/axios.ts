import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not configured. Set it in your .env file or deployment environment.'
  );
}

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


/* Response Interceptor: Global Error Handling */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network errors have no HTTP response.
    if (!error.response) {
      toast.error('Network Error', {
        description: import.meta.env.DEV
          ? 'Unable to connect to the PMEC server. Check that the backend is running at http://localhost:8080.'
          : 'Unable to connect to the PMEC server. Check your internet connection or backend availability.',
      });

      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const errorMessage =
      data?.error || data?.message || data?.detail;

    const url = error.config?.url || '';

    // Do not treat failed login attempts as expired sessions.
    const isAuthRequest =
      /\/api\/auth\/(login|register|forgot-password|reset-password|verify-email)/i
        .test(url);

    if (status === 403 && import.meta.env.DEV) {
      console.warn('API request was forbidden', {
        method: error.config?.method,
        url,
      });
    }

    switch (status) {
      case 401: {
        const token = useAuthStore.getState().token;

        // A login or registration failure should not trigger
        // the global session-expiration redirect.
        if (!isAuthRequest && token) {
          toast.error('Session Expired', {
            description:
              'The server rejected your session. Please log in again.',
          });

          useAuthStore.getState().logout();

          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        } else if (!isAuthRequest) {
          toast.error('Authentication Required', {
            description:
              errorMessage || 'Please log in to access this resource.',
          });
        }

        break;
      }

      case 403:
        toast.error('Access Denied', {
          description:
            errorMessage ||
            'Your account is not authorized to perform this action.',
        });
        break;

      case 404:
        toast.error('Not Found', {
          description:
            errorMessage || 'The requested resource was not found.',
        });
        break;

      case 409:
        toast.error('Conflict Error', {
          description:
            errorMessage || 'A record with these details already exists.',
        });
        break;

      case 400:
      case 422: {
        if (
          typeof data === 'object' &&
          data !== null &&
          !data.error &&
          !data.message
        ) {
          const firstFieldKey = Object.keys(data)[0];
          const firstErrList = data[firstFieldKey];
          const errDetail = Array.isArray(firstErrList)
            ? firstErrList[0]
            : String(firstErrList);

          toast.error('Validation Error', {
            description: `${firstFieldKey}: ${errDetail}`,
          });
        } else {
          toast.error('Request Error', {
            description:
              errorMessage || 'Invalid request details provided.',
          });
        }
        break;
      }

      case 500:
      default:
        toast.error('Server Error', {
          description:
            errorMessage ||
            'Something went wrong on the server. Please try again later.',
        });
        break;
    }

    return Promise.reject(error);
  }
);
