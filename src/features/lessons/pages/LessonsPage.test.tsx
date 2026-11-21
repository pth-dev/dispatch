import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
import { LessonsPage } from './LessonsPage'

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

const SAMPLE_LESSONS = [
  {
    id: 11,
    topic: 'Quy định thay đổi tường lửa',
    keywords: 'firewall,tường lửa',
    content: 'Phải tạo phiếu xin phép trước khi mở port.',
    images: [],
    dept: '資訊部',
    created_by: '20160',
    created_name: 'Phan Trung Hiếu',
    createdAt: '2026-11-20 08:30:00',
    updatedAt: '2026-11-20 08:30:00',
  },
  {
    id: 12,
    topic: 'Bảo trì máy in tem',
    keywords: 'máy in',
    content: 'Vệ sinh đầu in bằng cồn 90 độ.',
    images: [],
    dept: 'HR',
    created_by: '18001',
    created_name: 'Nguyễn Thị Lan',
    createdAt: '2026-11-19 10:00:00',
    updatedAt: '2026-11-19 10:00:00',
  },
]

const SAMPLE_TASKS = [
  {
    id: 501,
    title: 'Mở port Firewall cho server ERP',
    content: '',
    progress: 30,
    reporter: '15965',
    assign_person: '20160',
  },
]

function renderLessonsPage(initialEntry = '/lessons') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/tasks/:id" element={<div>Task Detail Route</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockStandardFetch(lessons = SAMPLE_LESSONS, tasks = SAMPLE_TASKS) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url.includes('/api/lessons')) {
      return jsonResponse({ list: lessons })
    }
    if (url.includes('/api/tasks')) {
      return jsonResponse(tasks)
    }
    return jsonResponse({})
  })
}

describe('LessonsPage', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    setStoredSession({ username: '20160', token: 'tok-1' })
    useAppStore.setState({ user: USER, authStatus: 'authenticated' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearAllAuthStorage()
  })

  it('loads lessons, shows matched tasks on selection, and filters by hit/mine', async () => {
    mockStandardFetch()
    const user = userEvent.setup()

    renderLessonsPage()

    expect(await screen.findByText('Quy định thay đổi tường lửa')).toBeInTheDocument()
    expect(screen.getByText('Bảo trì máy in tem')).toBeInTheDocument()

    // Select first lesson to inspect details and switch to matched tasks tab
    await user.click(screen.getByText('Quy định thay đổi tường lửa'))
    expect(
      await screen.findByRole('heading', { name: 'Quy định thay đổi tường lửa' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Bài điều phối trùng từ khóa/i }))
    expect(await screen.findByText('#501')).toBeInTheDocument()

    // Filter by "Có bài trùng" -> hides printer lesson
    await user.click(screen.getByRole('button', { name: 'Có bài trùng' }))
    expect(screen.queryByText('Bảo trì máy in tem')).not.toBeInTheDocument()
    expect(screen.getAllByText('Quy định thay đổi tường lửa').length).toBeGreaterThan(0)
  })

  it('creates a new lesson via FormData POST /api/lessons', async () => {
    let submittedFormData: FormData | null = null
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/api/lessons') && init?.method === 'POST') {
        submittedFormData = init.body as FormData
        return jsonResponse({ success: true, id: 99 })
      }
      if (url.includes('/api/lessons')) {
        return jsonResponse({ list: SAMPLE_LESSONS })
      }
      if (url.includes('/api/tasks')) {
        return jsonResponse(SAMPLE_TASKS)
      }
      return jsonResponse({})
    })

    const user = userEvent.setup()
    renderLessonsPage()

    await screen.findByText('Quy định thay đổi tường lửa')
    await user.click(screen.getByRole('button', { name: 'Thêm bài học' }))

    await user.type(screen.getByLabelText(/^Chủ đề/i), 'Quy tắc sao lưu DB')
    const kwInput = screen.getByLabelText(/^Từ khóa/i)
    await user.type(kwInput, 'backup{Enter}database{Enter}')
    await user.type(screen.getByLabelText(/^Nội dung/i), 'Kiểm tra bản sao lưu mỗi sáng.')

    await user.click(screen.getByRole('button', { name: 'Đăng bài học' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/lessons'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    expect(submittedFormData).toBeInstanceOf(FormData)
    expect(submittedFormData!.get('topic')).toBe('Quy tắc sao lưu DB')
    expect(submittedFormData!.get('keywords')).toBe('backup,database')
    expect(submittedFormData!.get('content')).toBe('Kiểm tra bản sao lưu mỗi sáng.')
  })

  it('hides create and edit actions when user only has read permission on learnknow', async () => {
    useAppStore.setState({
      user: { ...USER, menu_perms: { learnknow: 'sr' } },
      authStatus: 'authenticated',
    })
    mockStandardFetch()
    const user = userEvent.setup()

    renderLessonsPage()
    await screen.findByText('Quy định thay đổi tường lửa')

    expect(screen.queryByRole('button', { name: 'Thêm bài học' })).not.toBeInTheDocument()

    await user.click(screen.getByText('Quy định thay đổi tường lửa'))
    expect(screen.queryByRole('button', { name: 'Sửa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument()
  })

  it('deletes an owned lesson after confirmation dialog', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/api/lessons/11') && init?.method === 'DELETE') {
        return jsonResponse({ success: true })
      }
      if (url.includes('/api/lessons')) {
        return jsonResponse({ list: SAMPLE_LESSONS })
      }
      if (url.includes('/api/tasks')) {
        return jsonResponse(SAMPLE_TASKS)
      }
      return jsonResponse({})
    })

    const user = userEvent.setup()
    renderLessonsPage('/lessons?id=11')

    await screen.findByRole('heading', { name: 'Quy định thay đổi tường lửa' })
    await user.click(screen.getByRole('button', { name: /Xoá|Xóa/i }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toBeInTheDocument()

    const confirmButtons = screen.getAllByRole('button', { name: /Xoá|Xóa/i })
    await user.click(confirmButtons[confirmButtons.length - 1]!)

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/lessons/11'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })
})
