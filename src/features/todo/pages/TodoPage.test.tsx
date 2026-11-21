import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
import { TodoPage } from './TodoPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const USER: SessionUser = {
  id: 1,
  username: '20160',
  fullname: 'Phan Trung Hiếu',
  dept: '資訊部',
  site: 'YS',
  role: 'user',
  auth_source: 'local',
  menu_perms: null,
  is_computer_room: false,
}

const SAMPLE_TASKS = [
  {
    id: 301,
    title: 'Kiểm tra switch tầng 2',
    title_vn: 'Kiểm tra switch tầng 2',
    content: '',
    progress: 30,
    reporter: '15965',
    assign_person: '20160',
    due_date: '2026-11-25T17:00',
    site: 'YS',
    level: '一般件',
    precautions: 'Kiểm tra log trước khi reboot',
    last_report: 'Đã kiểm tra cổng uplink',
  },
  {
    id: 302,
    title: 'Nâng cấp firmware firewall',
    title_vn: '',
    content: '',
    progress: 60,
    reporter: '15965',
    assign_person: '20160',
    due_date: '2026-11-22T12:00',
    site: 'LK',
    level: '急件',
  },
  {
    id: 303,
    title: 'Nhiệm vụ đã hoàn thành',
    content: '',
    progress: 100,
    reporter: '15965',
    assign_person: '20160',
  },
]

function renderTodoPage(initialEntry = '/todo?date=2026-11-21') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/tasks/:id" element={<div>Task Detail Route</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TodoPage', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    setStoredSession({ username: '20160', token: 'tok' })
    useAppStore.setState({ user: USER, authStatus: 'authenticated' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearAllAuthStorage()
    useAppStore.getState().clearSession()
  })

  it('loads saved todos, allows adding a task, setting time, and saving to POST /api/todos', async () => {
    const user = userEvent.setup()
    let postedBody: unknown = null

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const method = (init?.method ?? 'GET').toUpperCase()

      if (url.includes('/api/tasks')) {
        return jsonResponse(SAMPLE_TASKS)
      }
      if (url.includes('/api/lessons')) {
        return jsonResponse({ list: [] })
      }
      if (url.includes('/api/todos') && method === 'GET') {
        return jsonResponse({
          task_data: [{ id: 301, start_time: '09:00' }],
        })
      }
      if (url.includes('/api/todos') && method === 'POST') {
        postedBody = JSON.parse(String(init?.body ?? '{}'))
        return jsonResponse({ success: true })
      }
      return jsonResponse({})
    })

    renderTodoPage()

    // Task 301 is in selected list + timeline, Task 302 is in available list + timeline, Task 303 (100%) is excluded
    expect(await screen.findAllByRole('link', { name: 'Kiểm tra switch tầng 2' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Nâng cấp firmware firewall' })).toHaveLength(2)
    expect(screen.queryByText('Nhiệm vụ đã hoàn thành')).not.toBeInTheDocument()

    // Add task 302 from available to selected
    const addButtons = screen.getAllByRole('button', { name: /Thêm/i })
    await user.click(addButtons[0]!)

    expect(screen.getByText('Chưa lưu')).toBeInTheDocument()

    // Saving without start_time on 302 opens confirmation dialog
    await user.click(screen.getByRole('button', { name: /Lưu lịch trình/i }))
    expect(await screen.findByText(/Còn mục chưa đặt giờ bắt đầu/i)).toBeInTheDocument()

    // Confirm save anyway
    await user.click(screen.getByRole('button', { name: /Vẫn lưu/i }))

    await waitFor(() => {
      expect(postedBody).toEqual({
        date: '2026-11-21',
        task_data: [
          { id: 301, start_time: '09:00' },
          { id: 302, start_time: '' },
        ],
      })
    })
  })

  it('keeps TodoHeaderBar visible on 500 error and recovers when clicking retry', async () => {
    const user = userEvent.setup()
    let failTodos = true

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/api/tasks')) {
        return jsonResponse(SAMPLE_TASKS)
      }
      if (url.includes('/api/lessons')) {
        return jsonResponse({ list: [] })
      }
      if (url.includes('/api/todos')) {
        if (failTodos) {
          return jsonResponse({ message: 'Internal Server Error' }, 500)
        }
        return jsonResponse({ task_data: [{ id: 301, start_time: '09:00' }] })
      }
      return jsonResponse({})
    })

    renderTodoPage()

    const retryBtn = await screen.findByRole('button', { name: /thử lại/i })
    expect(
      screen.getByRole('heading', { level: 1, name: /việc cần làm hôm nay/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/ngày làm việc/i)).toBeInTheDocument()

    failTodos = false
    await user.click(retryBtn)

    expect(await screen.findAllByRole('link', { name: 'Kiểm tra switch tầng 2' })).toHaveLength(2)
  })
})
