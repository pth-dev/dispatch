import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
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

function renderAccountPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders account scope cards and filters the OU organization tree', async () => {
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
