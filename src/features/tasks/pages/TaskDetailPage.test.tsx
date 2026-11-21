import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
import { TaskDetailPage } from './TaskDetailPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const USER: SessionUser = {
  id: 1,
  username: 'hieu',
  fullname: 'Phan Trung Hiếu',
  dept: '資訊部',
  site: 'YS',
  role: 'admin',
  auth_source: 'local',
  menu_perms: null,
  is_computer_room: false,
}

const RECURRING_TASK = {
  id: 205,
  title: 'Sao lưu máy chủ hàng tuần',
  content: 'Kiểm tra log và dung lượng ổ đĩa',
  reporter: 'hieu',
  assigned_unit: '資訊部',
  assign_person: 'hieu',
  due_date: '2026-12-20T17:00',
  recur_type: 'weekly',
  recur_weekdays: '1,5',
  recur_time: '17:00',
  recur_end: '2027-01-31',
  progress: 100,
  paused: 0,
  confidential: 0,
  cross_dept: 0,
  createdAt: '2026-11-20 08:00:00',
}

describe('TaskDetailPage', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    setStoredSession({ username: 'hieu', token: 'tok-1' })
    useAppStore.setState({ user: USER, authStatus: 'authenticated' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    useAppStore.setState({ user: null, authStatus: 'unauthenticated' })
  })

  it('displays recurrence metadata and clamps progress from 100 to 99 when switching composer to paused', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/meta/depts')) {
        return jsonResponse({
          depts: [{ value: '資訊部', vn: 'Bộ phận IT' }],
          allDepts: [{ value: '資訊部', vn: 'Bộ phận IT' }],
        })
      }
      if (url.includes('/meta/sites')) {
        return jsonResponse({
          sites: [{ value: 'YS', vn: 'Vĩnh Thịnh' }],
          allSites: [{ value: 'YS', vn: 'Vĩnh Thịnh' }],
        })
      }
      if (url.includes('/users/directory')) {
        return jsonResponse([
          { username: 'hieu', fullname: 'Phan Trung Hiếu', dept: '資訊部', site: 'YS' },
        ])
      }
      if (url.endsWith('/tasks/205/reports') && init?.method === 'POST') {
        return jsonResponse({ success: true, task_id: 205 })
      }
      if (url.endsWith('/tasks/205/reports')) {
        return jsonResponse([])
      }
      return jsonResponse([RECURRING_TASK])
    })
    vi.stubGlobal('fetch', fetchMock)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tasks/205']}>
          <Routes>
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Sao lưu máy chủ hàng tuần')).toBeInTheDocument()
    expect(screen.getByText(/Hàng tuần • T2, T6/i)).toBeInTheDocument()
    expect(await screen.findByText('Bộ phận IT')).toBeInTheDocument()
    expect(screen.getAllByText('Phan Trung Hiếu (hieu)').length).toBeGreaterThanOrEqual(2)

    const user = userEvent.setup()
    const progressInput = screen.getByLabelText(/tiến độ/i) as HTMLInputElement
    expect(progressInput.value).toBe('100')

    await user.selectOptions(screen.getByLabelText(/trạng thái thực hiện/i), 'paused')
    expect(progressInput.value).toBe('99')

    await user.type(screen.getByLabelText(/nội dung báo cáo/i), 'Tạm dừng chờ bảo trì')
    await user.click(screen.getByRole('button', { name: /gửi báo cáo/i }))

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/205/reports'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('keeps static page header visible while loading and when rendering 5xx InlineError with retry', async () => {
    let shouldFail = true
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/meta/depts')) {
        return jsonResponse({ depts: [], allDepts: [] })
      }
      if (url.endsWith('/tasks/205/reports')) {
        return jsonResponse([])
      }
      if (shouldFail) {
        return jsonResponse({ message: 'Internal Server Error' }, 500)
      }
      return jsonResponse([RECURRING_TASK])
    })
    vi.stubGlobal('fetch', fetchMock)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tasks/205']}>
          <Routes>
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // While loading, static h1 header is shown
    expect(screen.getByRole('heading', { level: 1, name: 'Chi tiết nhiệm vụ' })).toBeInTheDocument()

    // When 500 error resolves, static h1 header remains visible along with InlineError
    const retryBtn = await screen.findByRole('button', { name: /thử lại/i })
    expect(screen.getByRole('heading', { level: 1, name: 'Chi tiết nhiệm vụ' })).toBeInTheDocument()

    // Clicking retry reloads and shows task title in header
    shouldFail = false
    const user = userEvent.setup()
    await user.click(retryBtn)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sao lưu máy chủ hàng tuần' }),
    ).toBeInTheDocument()
  })
})
