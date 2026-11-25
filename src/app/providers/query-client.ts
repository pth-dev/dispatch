import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/services/http'

const QUERY_RETRY_DELAY_MS = 800

/**
 * Single centralized retry policy for all TanStack Query reads:
 * - Retries transient infrastructure failures (5xx, network, timeout) once.
 * - Never retries 4xx client/business errors or aborted requests.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (error instanceof DOMException && error.name === 'AbortError') return false
  if (isApiError(error)) {
    return error.status >= 500 || error.status === 0
  }
  return false
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: shouldRetryQuery,
      retryDelay: QUERY_RETRY_DELAY_MS,
      refetchOnWindowFocus: false,
    },
  },
})
