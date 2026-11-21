import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
import { DAILY_REPAIR_PRECAUTIONS, DAILY_REPAIR_TITLE } from '../api/build-task-form-data'
import { TaskCreatePage } from './TaskCreatePage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const CREATOR: SessionUser = {
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

const RECURRING_SOURCE = {
  id: 301,
  title: 'Kiểm tra hệ thống định kỳ',
  task_type: '網路類 / Mạng lưới',
  req_dept: '資訊部',
  req_depts: '資訊部',
  req_contact: 'hieu',
  site: 'YS',
  assigned_unit: '資訊部',
  assign_person: 'hieu',
  due_date: '',
  recur_type: 'weekly',
  recur_weekdays: '1,3',
  recur_time: '17:00',
  recur_end: '2026-12-31',
  reporter: 'hieu',
  progress: 0,
  paused: 0,
  confidential: 0,
  cross_dept: 0,
}

const HISTORY_TASK = {
  id: 412,
  title: 'Bảo trì switch tầng 2',
  task_type: '網路類 / Mạng lưới',
  req_dept: '資訊部',
  req_depts: '資訊部',
  req_contact: 'hieu',
  site: 'YS',
  assigned_unit: '資訊部',
  assign_person: 'hieu',
  due_date: '2026-11-10T19:00',
  recur_type: 'once',
  reporter: 'hieu',
  progress: 100,
  paused: 0,
  confidential: 0,
  cross_dept: 0,
}

function stubTaskCreateFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      const url = String(input)
      if (url.includes('/meta/depts')) {
        return jsonResponse({ depts: [{ value: '資訊部', vn: 'Bộ phận IT' }], allDepts: [] })
      }
      if (url.includes('/meta/sites')) {
        return jsonResponse({ sites: [{ value: 'YS', vn: 'Vĩnh Thịnh' }], allSites: [] })
      }
      if (url.includes('/users/directory')) {
        return jsonResponse([{ username: 'hieu', fullname: 'Hiếu', dept: '資訊部', site: 'YS' }])
      }
      if (url.includes('/pocket/task-types')) {
        return jsonResponse({ items: [] })
      }
      if (url.includes('/tasks/dup-check')) {
        return jsonResponse({ success: true, duplicate: false })
      }
      if (url.includes('/tasks/history/mine')) {
        return jsonResponse({ items: [HISTORY_TASK, RECURRING_SOURCE] })
      }
      return jsonResponse([RECURRING_SOURCE])
    }),
  )
}

function renderTaskCreate(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/tasks/new" element={<TaskCreatePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TaskCreatePage', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    setStoredSession({ username: 'hieu', token: 'tok-1' })
    useAppStore.setState({ user: CREATOR, authStatus: 'authenticated' })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    useAppStore.setState({ user: null, authStatus: 'unauthenticated' })
  })

  it('blocks cloning a recurring task until recur_end is changed from the original task', async () => {
    stubTaskCreateFetch()
    renderTaskCreate('/tasks/new?clone=301')

    expect(await screen.findByDisplayValue('Kiểm tra hệ thống định kỳ')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /giao việc/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/ngày kết thúc lặp mới/i)
  })

  it('supports quick create mode and preserves typed title when expanding to full form', async () => {
    stubTaskCreateFetch()
    renderTaskCreate('/tasks/new?mode=quick')

    const titleInput = await screen.findByLabelText(/tên nhiệm vụ/i)
    expect(screen.queryByText(/đơn vị yêu cầu/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sửa chữa hằng ngày/i })).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(titleInput, 'Xử lý sự cố máy in')
    await user.click(screen.getByRole('button', { name: /mở đầy đủ các trường/i }))

    expect(screen.getByDisplayValue('Xử lý sự cố máy in')).toBeInTheDocument()
    expect(screen.getByText(/đơn vị yêu cầu/i)).toBeInTheDocument()
  })

  it('opens historical task picker and prefills form when selecting a past task', async () => {
    stubTaskCreateFetch()
    renderTaskCreate('/tasks/new')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /giao lại từ lịch sử/i }))

    const historyItem = await screen.findByRole('button', { name: /bảo trì switch tầng 2/i })
    await user.click(historyItem)

    expect(await screen.findByDisplayValue('Bảo trì switch tầng 2')).toBeInTheDocument()
  })

  it('shows daily repair mode for computer-room users and applies preset defaults', async () => {
    useAppStore.setState({
      user: { ...CREATOR, is_computer_room: true },
      authStatus: 'authenticated',
    })
    stubTaskCreateFetch()
    renderTaskCreate('/tasks/new')

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sửa chữa hằng ngày/i }))

    expect(await screen.findByDisplayValue(DAILY_REPAIR_TITLE)).toBeInTheDocument()
    expect(screen.getByDisplayValue(DAILY_REPAIR_PRECAUTIONS)).toBeInTheDocument()
  })
})
