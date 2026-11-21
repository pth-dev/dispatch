import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
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
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input) => {
        const url = String(input)
        if (url.includes('/meta/depts')) {
          return jsonResponse({ depts: [{ value: '資訊部', vn: 'Bộ phận IT' }], allDepts: [] })
        }
        if (url.includes('/meta/sites')) {
          return jsonResponse({ sites: [{ value: 'YS', vn: 'YS' }], allSites: [] })
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
        return jsonResponse([RECURRING_SOURCE])
      }),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tasks/new?clone=301']}>
          <Routes>
            <Route path="/tasks/new" element={<TaskCreatePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByDisplayValue('Kiểm tra hệ thống định kỳ')).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /giao việc/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/ngày kết thúc lặp mới/i)
  })
})
