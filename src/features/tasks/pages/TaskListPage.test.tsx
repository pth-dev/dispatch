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
    localStorage.clear()
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

  it('switches between table and card view modes and toggles legacy columns', async () => {
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
        if (url.includes('/meta/sites')) {
          return jsonResponse({ sites: [], allSites: [] })
        }
        return jsonResponse(TASKS_PAYLOAD)
      }),
    )

    renderTaskList('/tasks')

    expect(await screen.findAllByText('Nâng cấp mạng nội bộ')).not.toHaveLength(0)

    const user = userEvent.setup()

    // Default table mode shows Columns button, hides legacy extra column "Người đăng"
    expect(screen.queryByRole('columnheader', { name: 'Người đăng' })).not.toBeInTheDocument()
    const columnsBtn = screen.getByRole('button', { name: /cột bảng/i })
    await user.click(columnsBtn)

    // Enable legacy column "Người đăng"
    const reporterCheckbox = await screen.findByRole('checkbox', { name: 'Người đăng' })
    await user.click(reporterCheckbox)
    expect(screen.getByRole('columnheader', { name: 'Người đăng' })).toBeInTheDocument()

    // Switch to Card mode: table disappears and Columns button hides
    await user.click(screen.getByRole('button', { name: /^thẻ$/i }))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cột bảng/i })).not.toBeInTheDocument()
    expect(screen.getByText('Nâng cấp mạng nội bộ')).toBeInTheDocument()

    // Switch back to Table mode: customized column remains visible
    await user.click(screen.getByRole('button', { name: /^bảng$/i }))
    expect(screen.getByRole('columnheader', { name: 'Người đăng' })).toBeInTheDocument()

    // Reorder column and reset to default
    await user.click(screen.getByRole('button', { name: /cột bảng/i }))
    await user.click(await screen.findByRole('button', { name: /di chuyển cột mã nv lên/i }))
    const headersAfterMove = screen.getAllByRole('columnheader').map((el) => el.textContent)
    expect(headersAfterMove[0]).toBe('Mã NV')

    await user.click(screen.getByRole('button', { name: /xoá hết/i }))
    expect(screen.queryByRole('columnheader', { name: 'Người đăng' })).not.toBeInTheDocument()
    const headersAfterReset = screen.getAllByRole('columnheader').map((el) => el.textContent)
    expect(headersAfterReset[0]).toBe('STT')
  })

  it('groups cards by task type into incomplete and completed sections without pagination', async () => {
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
        if (url.includes('/meta/sites')) {
          return jsonResponse({ sites: [], allSites: [] })
        }
        return jsonResponse([
          {
            id: 201,
            title: 'Cấu hình tường lửa',
            task_type: 'Hệ thống mạng',
            reporter: 'other',
            assigned_unit: '資訊部',
            assign_person: 'hieu',
            site: 'YS',
            due_date: '2026-12-20T17:00',
            progress: 40,
            paused: 0,
            confidential: 1,
            cross_dept: 1,
          },
          {
            id: 202,
            title: 'Bàn giao máy chủ cũ',
            task_type: 'Phần cứng',
            reporter: 'hieu',
            assigned_unit: '資訊部',
            assign_person: 'tom',
            due_date: '2026-12-01T17:00',
            finish_date: '2026-11-30 16:00:00',
            progress: 100,
            paused: 0,
            confidential: 0,
            cross_dept: 0,
          },
        ])
      }),
    )

    renderTaskList('/tasks')
    expect(await screen.findAllByText('Cấu hình tường lửa')).not.toHaveLength(0)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^thẻ$/i }))

    // Both sections expanded by default, grouped by task_type, pagination hidden
    expect(screen.getByRole('region', { name: 'Đang xử lý' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Đã hoàn thành' })).toBeInTheDocument()
    expect(screen.getByText('Hệ thống mạng')).toBeInTheDocument()
    expect(screen.getByText('Phần cứng')).toBeInTheDocument()
    expect(screen.getByText('YS')).toBeInTheDocument()
    expect(screen.getByText('Bảo mật')).toBeInTheDocument()
    expect(screen.getByText('Xem liên BP')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /trang sau/i })).not.toBeInTheDocument()
  })
})
