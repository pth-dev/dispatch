import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: (failureCount, error) => {
        // Retry 5xx errors at most once (network retries for GET/HEAD are handled in http.ts)
        if (failureCount >= 1) return false
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const status = Number((error as { status: unknown }).status)
          return status >= 500
        }
        return false
      },
      refetchOnWindowFocus: false,
    },
  },
})
