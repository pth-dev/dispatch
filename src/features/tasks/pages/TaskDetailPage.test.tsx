import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
import { taskKeys } from '../api/keys'
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
  progress: 50,
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
    expect(progressInput.value).toBe('50')

    await user.clear(progressInput)
    await user.type(progressInput, '100')
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

  it('hides report composer and edit button when task progress is 100%', async () => {
    const completedTask = { ...RECURRING_TASK, progress: 100 }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/meta/depts')) return jsonResponse({ depts: [], allDepts: [] })
        if (url.includes('/meta/sites')) return jsonResponse({ sites: [], allSites: [] })
        if (url.includes('/users/directory')) return jsonResponse([])
        if (url.endsWith('/tasks/205/reports')) return jsonResponse([])
        return jsonResponse([completedTask])
      }),
    )

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
    expect(screen.queryByRole('button', { name: /gửi báo cáo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /chỉnh sửa/i })).not.toBeInTheDocument()
  })

  it('hides report composer for non-assignee while keeping edit button for creator', async () => {
    const otherAssigneeTask = { ...RECURRING_TASK, assign_person: 'other_user', progress: 40 }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/meta/depts')) return jsonResponse({ depts: [], allDepts: [] })
        if (url.includes('/meta/sites')) return jsonResponse({ sites: [], allSites: [] })
        if (url.includes('/users/directory')) return jsonResponse([])
        if (url.endsWith('/tasks/205/reports')) return jsonResponse([])
        return jsonResponse([otherAssigneeTask])
      }),
    )

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
    expect(screen.queryByRole('button', { name: /gửi báo cáo/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /chỉnh sửa/i })).toBeInTheDocument()
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

  it('waits for background refetch instead of throwing 404 when navigating to a newly created task', async () => {
    const newlyCreatedTask = { ...RECURRING_TASK, id: 999, title: 'Nhiệm vụ vừa tạo' }
    let resolveRefetch: ((res: Response) => void) | undefined

    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/meta/depts')) return Promise.resolve(jsonResponse({ depts: [], allDepts: [] }))
      if (url.includes('/meta/sites')) return Promise.resolve(jsonResponse({ sites: [], allSites: [] }))
      if (url.includes('/users/directory')) return Promise.resolve(jsonResponse([]))
      if (url.endsWith('/tasks/999/reports')) return Promise.resolve(jsonResponse([]))
      return new Promise<Response>((resolve) => {
        resolveRefetch = resolve
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    // Seed stale cache with old task list (missing #999) and mark stale so it refetches on mount
    queryClient.setQueryData(taskKeys.list(), [RECURRING_TASK])
    await queryClient.invalidateQueries({ queryKey: taskKeys.list(), refetchType: 'none' })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tasks/999']}>
          <Routes>
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    // Should render loading state instead of throwing 404 while refetch is in flight
    expect(screen.getByRole('status')).toBeInTheDocument()

    resolveRefetch?.(jsonResponse([RECURRING_TASK, newlyCreatedTask]))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Nhiệm vụ vừa tạo' }),
    ).toBeInTheDocument()
  })

  it('focuses invalid field via Zod, supports progress presets, and prevents decreasing progress', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/meta/depts')) return jsonResponse({ depts: [], allDepts: [] })
      if (url.includes('/meta/sites')) return jsonResponse({ sites: [], allSites: [] })
      if (url.includes('/users/directory')) return jsonResponse([])
      if (url.endsWith('/tasks/205/reports')) return jsonResponse([])
      return jsonResponse([RECURRING_TASK]) // progress = 50
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
    const user = userEvent.setup()

    // 1. Preset buttons: 25% disabled (< 50%), 75% clickable
    expect(screen.getByRole('button', { name: '25%' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '50%' })).toBeEnabled()
    const btn75 = screen.getByRole('button', { name: '75%' })
    await user.click(btn75)

    const progressInput = screen.getByLabelText(/tiến độ/i) as HTMLInputElement
    expect(progressInput.value).toBe('75')

    // 2. Empty content -> Zod blocks submit and focuses textarea
    const contentTextarea = screen.getByLabelText(/nội dung báo cáo/i)
    await user.click(screen.getByRole('button', { name: /gửi báo cáo/i }))
    expect(await screen.findByText('Vui lòng nhập nội dung báo cáo')).toBeInTheDocument()
    expect(contentTextarea).toHaveFocus()
    expect(contentTextarea).toHaveAttribute('aria-invalid', 'true')

    // 3. Lower progress (30 < 50) -> Zod blocks submit and focuses progress input
    await user.type(contentTextarea, 'Thử giảm tiến độ')
    await user.clear(progressInput)
    await user.type(progressInput, '30')
    await user.click(screen.getByRole('button', { name: /gửi báo cáo/i }))
    expect(
      await screen.findByText('Tiến độ không được thấp hơn tiến độ hiện tại (50%)'),
    ).toBeInTheDocument()
    expect(progressInput).toHaveFocus()
    expect(progressInput).toHaveAttribute('aria-invalid', 'true')
  })
})
