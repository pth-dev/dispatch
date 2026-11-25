import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { useAppStore } from '@/app/store'
import { AccountPage } from './AccountPage'

const MOCK_SCOPE = {
  success: true,
  note: 'BP. IT + 1 OU cấp dưới',
  superlike: false,
  rule_level: 2,
  user: {
    username: 'staff1',
    fullname: 'Nguyễn Văn A',
    role: 'user',
    auth_source: 'ad',
    dept: '資訊部',
    dept_label: '电脑室 / BP. IT',
    dept_source: 'ad_ou',
    own_ou_path: 'Company › IT › Infra',
    ad_dn: 'CN=staff1,OU=Infra,OU=IT,DC=corp,DC=local',
    rule_dept: 'IT',
    rule_path: 'Company › IT',
  },
  extra_depts: [{ value: '品質部', label: '品质部 / BP. Chất lượng', source: 'local' }],
  sub_depts: [{ value: 'Infra', label: 'Infra', source: 'ad_ou', path: 'Company › IT › Infra' }],
  view_depts: [],
  visible: [
    { value: '資訊部', label: '电脑室 / BP. IT', source: 'local' },
    { value: 'Infra', label: 'Infra', source: 'ad_ou', path: 'Company › IT › Infra' },
  ],
}

const MOCK_ORG = {
  success: true,
  rule_level: 2,
  items: [
    { value: '資訊部', label: '电脑室 / BP. IT', source: 'local', path: '', members: 12 },
    {
      value: 'Infra',
      label: 'Infra',
      source: 'ad_ou',
      path: 'Company › IT › Infra',
      ou_dn: 'OU=Infra,OU=IT',
      members: 5,
    },
    { value: '製造部', label: '制造部 / BP. Sản xuất', source: 'local', path: '', members: 40 },
  ],
}

const MOCK_ADMIN_USERS = [
  {
    id: 11,
    username: 'newbie',
    fullname: 'Trần Văn B',
    dept: '資訊部',
    extra_depts: [],
    view_depts: [],
    site: 'YS',
    role: 'user',
    status: 'Pending',
    auth_source: 'local',
    menu_perms: null,
  },
]

function renderAccountPage(initialUrl = '/account') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <AccountPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAppStore.setState({
      user: {
        username: 'staff1',
        fullname: 'Nguyễn Văn A',
        dept: '資訊部',
        site: 'YS',
        role: 'user',
        auth_source: 'ad',
        menu_perms: null,
        is_computer_room: false,
      },
      authStatus: 'authenticated',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders account scope cards and filters the OU organization tree for regular users', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/account/scope')) {
          return new Response(JSON.stringify(MOCK_SCOPE), { status: 200 })
        }
        if (url.includes('/account/org')) {
          return new Response(JSON.stringify(MOCK_ORG), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 404 })
      }),
    )

    renderAccountPage()

    expect(await screen.findByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Quản lý tài khoản' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Company › IT › Infra').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('12 người')).toBeInTheDocument()
    expect(screen.getByText('40 người')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox')
    await user.type(searchInput, '制造部')

    await waitFor(() => {
      expect(screen.getByText('40 người')).toBeInTheDocument()
      expect(screen.queryByText('12 người')).not.toBeInTheDocument()
    })
  })

  it('allows admins to switch to users tab, approve a pending account, and save 16 menu perms', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      user: {
        username: 'boss',
        fullname: 'Super Boss',
        dept: '資訊部',
        site: 'YS',
        role: 'superadmin',
        auth_source: 'local',
        menu_perms: null,
        is_computer_room: false,
      },
      authStatus: 'authenticated',
    })

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/account/scope')) {
        return new Response(JSON.stringify(MOCK_SCOPE), { status: 200 })
      }
      if (url.includes('/account/org')) {
        return new Response(JSON.stringify(MOCK_ORG), { status: 200 })
      }
      if (url.includes('/admin/users/menu-perms') && init?.method === 'PUT') {
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      if (url.includes('/admin/users/11') && init?.method === 'PUT') {
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      if (url.includes('/admin/users')) {
        return new Response(JSON.stringify(MOCK_ADMIN_USERS), { status: 200 })
      }
      return new Response(JSON.stringify({}), { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderAccountPage('/account?tab=users')

    expect(await screen.findByText('Trần Văn B')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Duyệt tài khoản' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/11'),
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    await user.click(screen.getByRole('button', { name: 'Phân quyền chức năng (16 mục)' }))
    expect(await screen.findByText('Phân quyền chức năng theo tài khoản')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Đặt lại toàn quyền' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/menu-perms'),
        expect.objectContaining({ method: 'PUT' }),
      )
    })
  })

  it('supports Multi-OU view assignment and Active Directory sync in Phase 4B tabs', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      user: {
        username: 'boss',
        fullname: 'Super Boss',
        dept: '資訊部',
        site: 'YS',
        role: 'superadmin',
        auth_source: 'local',
        menu_perms: null,
        is_computer_room: false,
      },
      authStatus: 'authenticated',
    })

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/account/scope')) {
        return new Response(JSON.stringify(MOCK_SCOPE), { status: 200 })
      }
      if (url.includes('/account/org')) {
        return new Response(JSON.stringify(MOCK_ORG), { status: 200 })
      }
      if (url.includes('/admin/users/11/view-depts') && init?.method === 'PUT') {
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      if (url.includes('/admin/users')) {
        return new Response(JSON.stringify(MOCK_ADMIN_USERS), { status: 200 })
      }
      if (url.includes('/admin/ad/status')) {
        return new Response(
          JSON.stringify({
            available: true,
            installed: true,
            syncing: false,
            config: { domain: 'corp.local', syncMinutes: 30 },
            localAdAccounts: { total: 42, disabled: 2 },
          }),
          { status: 200 },
        )
      }
      if (url.includes('/admin/ad/users')) {
        return new Response(
          JSON.stringify({
            success: true,
            users: [{ sam: 'ad_user1', fullname: 'AD User One', department: 'IT', imported: false }],
          }),
          { status: 200 },
        )
      }
      if (url.includes('/admin/ad/sync/logs')) {
        return new Response(JSON.stringify({ success: true, logs: [] }), { status: 200 })
      }
      if (url.includes('/admin/ad/sync') && init?.method === 'POST') {
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      return new Response(JSON.stringify({}), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderAccountPage('/account?tab=ou-view')

    expect(await screen.findByText('Phạm vi OU được xem của nhân viên')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Chỉnh sửa' }))
    expect(await screen.findByText('Thiết lập OU được xem')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/11/view-depts'),
        expect.objectContaining({ method: 'PUT' }),
      )
    })

    await user.click(screen.getByRole('tab', { name: 'Active Directory (AD)' }))
    expect(await screen.findByText('ad_user1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đồng bộ ngay' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/admin/ad/sync'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('hides AD import and superadmin sync controls for dept admin with read-only ad permission', async () => {
    useAppStore.setState({
      user: {
        username: 'dept_lead',
        fullname: 'Dept Lead',
        dept: '資訊部',
        site: 'YS',
        role: 'admin',
        auth_source: 'local',
        menu_perms: { ad: 'sr', account: 'sr' },
        is_computer_room: false,
      },
      authStatus: 'authenticated',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/account/scope')) {
          return new Response(JSON.stringify(MOCK_SCOPE), { status: 200 })
        }
        if (url.includes('/account/org')) {
          return new Response(JSON.stringify(MOCK_ORG), { status: 200 })
        }
        if (url.includes('/admin/ad/status')) {
          return new Response(
            JSON.stringify({ available: true, config: { domain: 'corp.local', syncMinutes: 30 } }),
            { status: 200 },
          )
        }
        if (url.includes('/admin/ad/users')) {
          return new Response(
            JSON.stringify({
              success: true,
              users: [{ sam: 'ad_readonly', fullname: 'AD Readonly', department: 'IT' }],
            }),
            { status: 200 },
          )
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }),
    )

    renderAccountPage('/account?tab=ad')

    expect(await screen.findByText('ad_readonly')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nhập từ AD/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đồng bộ ngay' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chẩn đoán AD' })).not.toBeInTheDocument()
  })

  it('shows InlineError on 500 failure and recovers when clicking retry', async () => {
    const user = userEvent.setup()
    let failFirst = true
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (failFirst) {
          return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
        }
        if (url.includes('/account/scope')) {
          return new Response(JSON.stringify(MOCK_SCOPE), { status: 200 })
        }
        return new Response(JSON.stringify(MOCK_ORG), { status: 200 })
      }),
    )

    renderAccountPage()

    const retryBtn = await screen.findByRole('button', { name: /thử lại/i })
    failFirst = false
    await user.click(retryBtn)

    expect(await screen.findByText('Nguyễn Văn A')).toBeInTheDocument()
  })
})
