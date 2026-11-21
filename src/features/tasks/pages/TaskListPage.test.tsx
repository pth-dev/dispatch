import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
import { TaskListPage } from './TaskListPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const ADMIN_USER: SessionUser = {
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

const TASKS_PAYLOAD = [
  {
    id: 101,
    title: 'Nâng cấp mạng nội bộ',
    reporter: 'hieu',
    assigned_unit: '資訊部',
    assign_person: 'hieu',
    due_date: '2026-12-10T17:00',
    progress: 30,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
  },
  {
    id: 102,
    title: 'Kiểm kê thiết bị kho',
    reporter: 'other',
    assigned_unit: '製造部',
    assign_person: 'tom',
    due_date: '2026-12-15T17:00',
    progress: 0,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
  },
]

function renderTaskList(initialEntry = '/tasks') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/tasks" element={<TaskListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TaskListPage', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    setStoredSession({ username: 'hieu', token: 'tok-1' })
    useAppStore.setState({ user: ADMIN_USER, authStatus: 'authenticated' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    useAppStore.setState({ user: null, authStatus: 'unauthenticated' })
  })

  it('loads tasks, defaults admin scope to all, and filters when switching to mine scope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = String(input)
        if (url.includes('/meta/depts')) {
          return jsonResponse({
            depts: [{ value: '資訊部', vn: 'Bộ phận IT' }],
            allDepts: [{ value: '資訊部', vn: 'Bộ phận IT' }],
          })
        }
        return jsonResponse(TASKS_PAYLOAD)
      }),
    )

    renderTaskList('/tasks')

    expect(await screen.findAllByText('Nâng cấp mạng nội bộ')).not.toHaveLength(0)
    expect(screen.getAllByText('Kiểm kê thiết bị kho')).not.toHaveLength(0)

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: /giao cho tôi/i }))

    await waitFor(() => {
      expect(screen.queryByText('Kiểm kê thiết bị kho')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('Nâng cấp mạng nội bộ')).not.toHaveLength(0)
  })

  it('renders InlineError with retry when GET /api/tasks returns 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        if (String(input).includes('/meta/depts')) {
          return jsonResponse({ depts: [], allDepts: [] })
        }
        return jsonResponse({ message: 'Internal error' }, 500)
      }),
    )

    renderTaskList('/tasks')

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument()
  })
})
