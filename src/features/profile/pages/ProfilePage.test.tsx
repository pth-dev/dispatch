import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function buildUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 1,
    username: 'hieu',
    fullname: 'Phan Trung Hiếu',
    dept: '資訊部',
    site: 'YS',
    role: 'admin',
    auth_source: 'local',
    menu_perms: null,
    is_computer_room: false,
    ...overrides,
  }
}

describe('ProfilePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    clearAllAuthStorage()
    useAppStore.setState({ user: null, authStatus: 'unauthenticated' })
  })

  it('shows local password change form for local accounts', () => {
    useAppStore.setState({ user: buildUser({ auth_source: 'local' }), authStatus: 'authenticated' })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Phan Trung Hiếu')).toBeInTheDocument()
    expect(screen.getByLabelText(/mật khẩu hiện tại/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /đăng xuất khỏi mọi thiết bị/i })).toBeInTheDocument()
  })

  it('shows AD notice instead of password form for Active Directory accounts', () => {
    useAppStore.setState({ user: buildUser({ auth_source: 'ad' }), authStatus: 'authenticated' })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    expect(screen.queryByLabelText(/mật khẩu hiện tại/i)).not.toBeInTheDocument()
    expect(screen.getByText(/hệ thống miền của công ty/i)).toBeInTheDocument()
  })

  it('validates password mismatch and logs out all devices on confirmation', async () => {
    setStoredSession({ username: 'hieu', token: 'tok-1' })
    useAppStore.setState({ user: buildUser({ auth_source: 'local' }), authStatus: 'authenticated' })

    const fetchMock = vi.fn(async () => jsonResponse({ success: true }))
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<div data-testid="login-screen">Login</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'oldpass')
    await user.type(screen.getByLabelText(/^mật khẩu mới$/i), 'newpass1')
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'different1')
    await user.click(screen.getByRole('button', { name: /cập nhật mật khẩu/i }))

    expect(await screen.findByText(/không khớp/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /đăng xuất khỏi mọi thiết bị/i }))
    const dialog = await screen.findByRole('alertdialog')
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find((b) =>
      /xác nhận/i.test(b.textContent ?? ''),
    )
    expect(confirmBtn).toBeTruthy()
    await user.click(confirmBtn!)

    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeInTheDocument()
    })
    expect(useAppStore.getState().authStatus).toBe('unauthenticated')
  })
})
