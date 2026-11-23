import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { DepartmentDashboardPage } from './DepartmentDashboardPage'

const USER: SessionUser = {
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
    id: 201,
    title: 'Server patch',
    progress: 40,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    recur_type: 'once',
    assigned_unit: '資訊部',
    reporter_dept: '資訊部',
    req_dept: '資訊部',
    req_depts: '資訊部',
    assign_person: 'alice',
    site: 'YS',
    level: '急件',
    task_type: '系統類',
    createdAt: '2026-11-20 09:00:00',
    due_date: '2026-11-21T19:00',
    finish_date: '',
  },
  {
    id: 202,
    title: 'Other dept task',
    progress: 10,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    recur_type: 'once',
    assigned_unit: '業務部',
    reporter_dept: '業務部',
    req_dept: '業務部',
    req_depts: '業務部',
    assign_person: 'charlie',
    site: 'CT',
    level: '一般件',
    task_type: '其他類',
    createdAt: '2026-11-20 09:00:00',
    due_date: '2026-11-28T19:00',
    finish_date: '',
  },
]

const MOCK_DEPT_POSTS = {
  success: true,
  level: 'dept',
  gran: 'day',
  dept: '資訊部',
  dept_label: 'BP. IT',
  dept_set: ['資訊部'],
  dept_options: [
    { value: '資訊部', label: 'BP. IT', path: 'Company › IT' },
    { value: '品質部', label: 'BP. QA', path: 'Company › QA' },
  ],
  labels: ['2026-11-21', '2026-11-22'],
  series: [
    { label: 'Alice Nguyen', username: 'alice', data: [1, 3], total: 4 },
    { label: 'Bob Tran', username: 'bob', data: [2, 1], total: 3 },
  ],
  total_series: [3, 4],
  total: 7,
  ranking: [
    {
      rank: 1,
      username: 'alice',
      fullname: 'Alice Nguyen',
      dept_label: 'BP. IT',
      posts: 4,
      kpi_total: 2,
      completionRate: 100,
      ontimeRate: 100,
      kpi_score: 100,
    },
  ],
  kpi_period: { kind: 'month', label: '2026-11' },
}

describe('DepartmentDashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    useAppStore.getState().setSession(USER)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAppStore.getState().clearSession()
  })

  it('filters tasks by dept_set and renders member posting heatmap with search', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/tasks')) return new Response(JSON.stringify(MOCK_TASKS), { status: 200 })
        if (url.includes('/lessons')) return new Response(JSON.stringify({ list: [] }), { status: 200 })
        if (url.includes('/todos')) return new Response(JSON.stringify({ task_data: [] }), { status: 200 })
        if (url.includes('/stats/posts')) {
          return new Response(JSON.stringify(MOCK_DEPT_POSTS), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 404 })
      }),
    )

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/dashboard/department']}>
          <DepartmentDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText(/1 \/ 2 nhiệm vụ liên quan/i)).toBeInTheDocument()
    expect(screen.getByText(/ma trận trạng thái theo nhân viên/i)).toBeInTheDocument()
    expect(screen.getByText(/ma trận bài đăng theo nhân viên \(2\)/i)).toBeInTheDocument()

    const heatmapSearch = screen.getByPlaceholderText(/tìm tên hoặc tài khoản nhân viên/i)
    await user.type(heatmapSearch, 'bob')

    await waitFor(() => {
      expect(screen.getByText(/ma trận bài đăng theo nhân viên \(1\)/i)).toBeInTheDocument()
    })
  })
})
