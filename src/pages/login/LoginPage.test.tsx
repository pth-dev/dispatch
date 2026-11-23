import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'
import { resolveSafeRedirect } from './use-login-auto-resume'
import { queryClient } from '@/app/providers/query-client'
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

  it('clears stale query cache on fresh login and redirects to first readable route', async () => {
    queryClient.setQueryData(['tasks', 'all'], [{ id: 1 }])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          success: true,
          token: 'sess-token-2',
          user: {
            id: 2,
            username: 'todo_only',
            fullname: 'Todo User',
            dept: 'IT',
            site: 'YS',
            role: 'user',
            auth_source: 'local',
            menu_perms: { list: '', todo: 'sr', messages: '', learnknow: '' },
          },
        }),
      ),
    )

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/todo" element={<div>Todo Landing</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(await screen.findByLabelText(/tài khoản/i), 'todo_only')
    await user.type(screen.getByLabelText(/mật khẩu/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }))

    expect(await screen.findByText('Todo Landing')).toBeInTheDocument()
    expect(queryClient.getQueryData(['tasks', 'all'])).toBeUndefined()
  })

  it('switches to registration mode, validates other site, submits POST /api/register, and returns to login', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/meta/depts')) {
        return jsonResponse({ depts: [{ value: '資訊部', vn: 'BP. IT' }] })
      }
      if (url.includes('/meta/sites')) {
        return jsonResponse({ sites: [{ value: 'YS', vn: 'Vĩnh Thịnh' }] })
      }
      if (url.includes('/register') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as Record<string, string>
        expect(body.username).toBe('newuser')
        expect(body.site).toBe('__OTHER__')
        expect(body.site_other).toBe('Plant9')
        return jsonResponse({ success: true })
      }
      return jsonResponse({}, 404)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await user.click(await screen.findByRole('button', { name: /đăng ký ngay/i }))
    await user.type(screen.getByLabelText(/^tài khoản$/i), 'newuser')
    await user.type(screen.getByLabelText(/^mật khẩu$/i), 'pass1234')
    await user.type(screen.getByLabelText(/họ và tên/i), 'Trần Văn B')
    await user.selectOptions(screen.getByLabelText(/khu vực/i), '__OTHER__')
    await user.type(screen.getByLabelText(/tên khu vực khác/i), 'Plant9')
    await user.click(screen.getByRole('button', { name: /gửi yêu cầu đăng ký/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/chờ quản trị viên phê duyệt/i)
    })
    expect(screen.getByRole('button', { name: /^đăng nhập$/i })).toBeInTheDocument()
  })
})

describe('resolveSafeRedirect', () => {
  it('blocks open redirects, backslashes, control chars, and login loops', () => {
    expect(resolveSafeRedirect('https://evil.test', '/tasks')).toBe('/tasks')
    expect(resolveSafeRedirect('//evil.test', '/tasks')).toBe('/tasks')
    expect(resolveSafeRedirect('/\\evil.test', '/tasks')).toBe('/tasks')
    expect(resolveSafeRedirect('/tasks\nheader', '/tasks')).toBe('/tasks')
    expect(resolveSafeRedirect('/login', '/tasks')).toBe('/tasks')
    expect(resolveSafeRedirect('/login/extra', '/tasks')).toBe('/tasks')
    expect(resolveSafeRedirect('/login#hash', '/tasks')).toBe('/tasks')
    expect(resolveSafeRedirect('/tasks/42?tab=info#top', '/tasks')).toBe('/tasks/42?tab=info#top')
  })
})
