import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        return !(status && status >= 400 && status < 500) && failureCount < 1;
      },
    },
    mutations: { retry: 0 },
  },
});
