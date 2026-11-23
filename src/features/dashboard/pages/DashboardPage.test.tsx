import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { DashboardPage } from './DashboardPage'

const BASE_USER: SessionUser = {
  id: 1,
  username: 'alice',
  fullname: 'Alice Nguyen',
  dept: '資訊部',
  site: 'YS',
  role: 'admin',
  auth_source: 'local',
  menu_perms: null,
  is_computer_room: true,
}

const MOCK_TASKS = [
  {
    id: 101,
    title: 'Fix core switch',
    progress: 30,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    recur_type: 'once',
    assigned_unit: '資訊部',
    reporter_dept: '資訊部',
    req_dept: '製造部',
    req_depts: '製造部',
    assign_person: 'alice',
    site: 'YS',
    level: '急件',
    task_type: '網路類',
    createdAt: '2026-11-20 09:00:00',
    due_date: '2026-11-21T19:00',
    finish_date: '',
    first_response_mins: 25,
  },
  {
    id: 102,
    title: 'Monthly DB check',
    progress: 100,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    recur_type: 'once',
    assigned_unit: '品質部',
    reporter_dept: '品質部',
    req_dept: '品質部',
    req_depts: '品質部',
    assign_person: 'bob',
    site: 'YA',
    level: '一般件',
    task_type: '系統類',
    createdAt: '2026-11-18 08:00:00',
    due_date: '2026-11-25T19:00',
    finish_date: '2026-11-20 10:00:00',
    first_response_mins: 90,
  },
]

const MOCK_POST_STATS = {
  success: true,
  level: 'company',
  gran: 'day',
  labels: ['2026-11-21', '2026-11-22'],
  series: [{ label: 'BP. IT', data: [2, 3], total: 5 }],
  total_series: [2, 3],
  total: 5,
  ranking: [
    {
      rank: 1,
      username: 'alice',
      fullname: 'Alice Nguyen',
      dept_label: 'BP. IT',
      posts: 5,
      kpi_total: 4,
      completionRate: 75,
      ontimeRate: 75,
      kpi_score: 75,
    },
  ],
  kpi_period: { kind: 'month', label: '2026-11' },
}

function renderDashboard(user: SessionUser = BASE_USER) {
  useAppStore.getState().setSession(user)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAppStore.getState().clearSession()
  })

  it('renders 4-tier dashboard, opens period and 1H response modals, and switches bottleneck tabs', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/tasks')) return new Response(JSON.stringify(MOCK_TASKS), { status: 200 })
        if (url.includes('/lessons')) return new Response(JSON.stringify({ list: [] }), { status: 200 })
        if (url.includes('/todos')) return new Response(JSON.stringify({ task_data: [] }), { status: 200 })
        if (url.includes('/users/directory')) {
          return new Response(
            JSON.stringify([
              { username: 'alice', fullname: 'Alice Nguyen', dept: '資訊部', site: 'YS' },
              { username: 'bob', fullname: 'Bob Tran', dept: '品質部', site: 'YA' },
            ]),
            { status: 200 },
          )
        }
        if (url.includes('/stats/posts')) {
          return new Response(JSON.stringify(MOCK_POST_STATS), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 404 })
      }),
    )

    renderDashboard()

    expect((await screen.findAllByText('Fix core switch')).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('img', { name: /xu hướng đăng bài theo bộ phận/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /xu hướng mới tạo & hoàn thành/i })).toBeInTheDocument()
    expect(screen.getByText(/quá hạn & tuổi việc tồn/i)).toBeInTheDocument()

    // Switch bottleneck tab to Site
    await user.click(screen.getByRole('tab', { name: /nhà xưởng/i }))
    expect(screen.getByRole('button', { name: /YS/i })).toBeInTheDocument()

    // Open Period drill-down modal via Created button in Work flow card
    await user.click(screen.getByRole('button', { name: /mới tạo/i }))
    expect(await screen.findByText(/chi tiết nhiệm vụ trong kỳ/i)).toBeInTheDocument()
    const closeButtons = screen.getAllByRole('button', { name: /^đóng$/i })
    await user.click(closeButtons[closeButtons.length - 1]!)

    // Open 1H Response modal
    await user.click(screen.getByRole('button', { name: /phản hồi ≤ 1 giờ/i }))
    expect(await screen.findByText(/chi tiết phản hồi trong 1 giờ/i)).toBeInTheDocument()
  })

  it('shows no-permission notice for post trends when dash_total lacks read perm', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/tasks')) return new Response(JSON.stringify(MOCK_TASKS), { status: 200 })
        if (url.includes('/lessons')) return new Response(JSON.stringify({ list: [] }), { status: 200 })
        if (url.includes('/todos')) return new Response(JSON.stringify({ task_data: [] }), { status: 200 })
        if (url.includes('/users/directory')) return new Response(JSON.stringify([]), { status: 200 })
        return new Response(JSON.stringify({}), { status: 404 })
      }),
    )

    renderDashboard({
      ...BASE_USER,
      menu_perms: { dashboard: 'sr', dash_total: 's' },
    })

    await waitFor(() => {
      expect(screen.getByText(/chưa được cấp quyền đọc biểu đồ xu hướng/i)).toBeInTheDocument()
    })
  })
})
