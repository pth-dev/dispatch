import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import {
  clearAllAuthStorage,
  notifySessionExpired,
  setStoredSession,
} from '@/services'
import { useSessionLifecycle } from './use-session-lifecycle'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function ShellHarness() {
  useSessionLifecycle()
  const location = useLocation()
  return (
    <div>
      <span data-testid="current-url">{`${location.pathname}${location.search}`}</span>
      <Link to="/tasks?page=2&scope=all">Go Page 2</Link>
      <Link to="/tasks/42">Go Detail</Link>
    </div>
  )
}

function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ''
  return <div data-testid="login-from">{from}</div>
}

describe('useSessionLifecycle', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    useAppStore.setState({ user: null, authStatus: 'unauthenticated' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('verifies session once on shell mount and preserves latest URL on expiry redirect', async () => {
    setStoredSession({ username: 'hieu', token: 'tok-1' })

    const fetchMock = vi.fn(async () =>
      jsonResponse({
        success: true,
        user: {
          id: 1,
          username: 'hieu',
          fullname: 'Phan Trung Hiếu',
          dept: '資訊部',
          site: 'YS',
          role: 'admin',
          auth_source: 'local',
          menu_perms: null,
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="*" element={<ShellHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(useAppStore.getState().authStatus).toBe('authenticated')
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('link', { name: 'Go Page 2' }))
    expect(screen.getByTestId('current-url')).toHaveTextContent('/tasks?page=2&scope=all')

    await user.click(screen.getByRole('link', { name: 'Go Detail' }))
    expect(screen.getByTestId('current-url')).toHaveTextContent('/tasks/42')

    // Navigating between routes/query params must NOT re-trigger /api/session/verify
    expect(fetchMock).toHaveBeenCalledTimes(1)

    act(() => {
      notifySessionExpired()
    })

    expect(await screen.findByTestId('login-from')).toHaveTextContent('/tasks/42')
    expect(useAppStore.getState().authStatus).toBe('unauthenticated')
  })
})
