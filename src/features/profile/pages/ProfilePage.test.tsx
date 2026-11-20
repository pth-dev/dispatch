import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { ProfilePage } from './ProfilePage'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'

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
})
