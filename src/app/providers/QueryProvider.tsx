import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: (failureCount, error) => {
        // Retry network or 5xx errors at most once
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

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
