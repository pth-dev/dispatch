import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type * as React from 'react'
import {
  AUTO_REFRESH_DEFER_MS,
  AUTO_REFRESH_INTERVAL_MS,
  useAutoRefresh,
} from './use-auto-refresh'

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('invalidates active queries every 3 minutes when idle and visible', () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')

    renderHook(() => useAutoRefresh(true), { wrapper: createWrapper(client) })

    vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL_MS)
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('defers refresh by 20s when user is focused in a textarea', () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')

    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()

    renderHook(() => useAutoRefresh(true), { wrapper: createWrapper(client) })

    vi.advanceTimersByTime(AUTO_REFRESH_INTERVAL_MS)
    expect(spy).not.toHaveBeenCalled()

    textarea.blur()
    vi.advanceTimersByTime(AUTO_REFRESH_DEFER_MS)
    expect(spy).toHaveBeenCalledTimes(3)

    textarea.remove()
  })
})
