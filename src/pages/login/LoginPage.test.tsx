import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'
import { useAppStore } from '@/app/store'
import { clearAllAuthStorage, getRememberToken, getStoredSession } from '@/services'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('LoginPage', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    useAppStore.setState({ user: null, authStatus: 'unauthenticated' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('shows validation errors when submitting empty credentials', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const submitBtn = await screen.findByRole('button', { name: /đăng nhập/i })
    await user.click(submitBtn)

    expect(await screen.findByText(/vui lòng nhập tài khoản/i)).toBeInTheDocument()
    expect(screen.getByText(/vui lòng nhập mật khẩu/i)).toBeInTheDocument()
  })

  it('logs in with remember-me, persists tokens, and redirects to /tasks', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        success: true,
        token: 'sess-token-1',
        remember_token: 'rem-token-64',
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
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tasks" element={<div>Tasks Landing</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText(/tài khoản/i), 'hieu')
    await user.type(screen.getByLabelText(/mật khẩu/i), 'secret123')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }))

    expect(await screen.findByText('Tasks Landing')).toBeInTheDocument()
    expect(getStoredSession()).toEqual({ username: 'hieu', token: 'sess-token-1' })
    expect(getRememberToken()?.token).toBe('rem-token-64')
    expect(useAppStore.getState().user?.username).toBe('hieu')
  })

  it('shows localized business error from backend on 400 rejection', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ success: false, message: '帳號或密碼錯誤 / Sai tài khoản hoặc mật khẩu' }, 400),
      ),
    )

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText(/tài khoản/i), 'bad')
    await user.type(screen.getByLabelText(/mật khẩu/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Sai tài khoản hoặc mật khẩu')
    })
  })
})
