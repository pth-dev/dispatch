import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { useAppStore } from '@/app/store'
import { WorklogPage } from './WorklogPage'

const MOCK_RECORDS = [
  {
    id: 101,
    task_id: 501,
    username: 'staff1',
    fullname: 'Nguyễn Văn A',
    title: 'Kiểm tra hệ thống mạng',
    title_vn: 'Kiểm tra switch tầng 2',
    content: 'Đã thay dây quang https://status.example.com',
    progress: 80,
    attachments: '[{"name":"log.txt","path":"/uploads/log.txt"}]',
    createdAt: '2026-11-25 09:30:00',
  },
  {
    id: 102,
    task_id: 502,
    username: 'staff1',
    fullname: 'Nguyễn Văn A',
    title: 'Cập nhật sao lưu DB',
    title_vn: '',
    content: 'Hoàn tất kiểm thử khôi phục',
    progress: 100,
    attachments: '[]',
    createdAt: '2026-11-24 16:00:00',
  },
]

function renderWorklogPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <WorklogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('WorklogPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useAppStore.setState({
      user: {
        username: 'staff1',
        fullname: 'Nguyễn Văn A',
        dept: '資訊部',
        site: 'YS',
        role: 'user',
        auth_source: 'local',
        menu_perms: null,
        is_computer_room: false,
      },
      authStatus: 'authenticated',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads work records, groups by date descending, and links to task detail', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/work-records')) {
        return new Response(JSON.stringify(MOCK_RECORDS), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWorklogPage()

    expect(await screen.findByText('Kiểm tra hệ thống mạng')).toBeInTheDocument()
    expect(screen.getByText('Cập nhật sao lưu DB')).toBeInTheDocument()
    expect(screen.getByText('2026-11-25')).toBeInTheDocument()
    expect(screen.getByText('2026-11-24')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://status.example.com' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'log.txt' })).toHaveAttribute('href', '/uploads/log.txt')
  })

  it('shows user selector for superadmin and refetches on quick range switch', async () => {
    const user = userEvent.setup()
    useAppStore.setState({
      user: {
        username: 'boss',
        fullname: 'Super Boss',
        dept: '資訊部',
        site: 'YS',
        role: 'superadmin',
        auth_source: 'local',
        menu_perms: null,
        is_computer_room: false,
      },
      authStatus: 'authenticated',
    })

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/admin/users')) {
        return new Response(
          JSON.stringify([{ id: 1, username: 'staff1', fullname: 'Nguyễn Văn A', dept: '資訊部' }]),
          { status: 200 },
        )
      }
      if (url.includes('/work-records')) {
        return new Response(JSON.stringify(MOCK_RECORDS), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWorklogPage()

    const userSelect = await screen.findByLabelText('Người dùng')
    expect(userSelect).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tháng này' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/work-records?'),
        expect.anything(),
      )
    })
  })
})
