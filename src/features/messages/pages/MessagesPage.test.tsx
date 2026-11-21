import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/app/store'
import type { SessionUser } from '@/schemas/auth'
import { clearAllAuthStorage, setStoredSession } from '@/services'
import { MessagesPage } from './MessagesPage'

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

const SAMPLE_MESSAGES = [
  {
    id: 101,
    username: '20160',
    fullname: 'Phan Trung Hiếu',
    content: 'Xem tài liệu tại https://docs.example.com/guide nhé!',
    createdAt: '2026-11-21 09:00:00',
    ip: '10.0.0.12',
    replies: [
      {
        id: 1,
        username: '15965',
        fullname: 'Lê Hải Nam',
        content: 'Đã nhận, cảm ơn anh.',
        createdAt: '2026-11-21 09:15:00',
        ip: '10.0.0.25',
      },
    ],
  },
  {
    id: 102,
    username: '18001',
    fullname: 'Nguyễn Thị Lan',
    content: 'Lịch bảo trì mạng tuần này.',
    createdAt: '2026-11-20 14:30:00',
    ip: '',
    replies: [],
  },
]

function renderMessagesPage(initialEntry = '/messages') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MessagesPage', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    setStoredSession({ username: '20160', token: 'tok-1' })
    useAppStore.setState({ user: USER, authStatus: 'authenticated' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearAllAuthStorage()
  })

  it('renders messages, replies, IP badges, and safely linkifies URLs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SAMPLE_MESSAGES))

    renderMessagesPage()

    expect(await screen.findByText('Phan Trung Hiếu (20160)')).toBeInTheDocument()
    expect(screen.getByText('IP: 10.0.0.12')).toBeInTheDocument()
    expect(screen.getByText('IP: Không rõ')).toBeInTheDocument()
    expect(screen.getByText('Lê Hải Nam (15965)')).toBeInTheDocument()
    expect(screen.getByText('Đã nhận, cảm ơn anh.')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'https://docs.example.com/guide' })
    expect(link).toHaveAttribute('href', 'https://docs.example.com/guide')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('validates empty submission and posts a new message', async () => {
    const user = userEvent.setup()
    let messages = [...SAMPLE_MESSAGES]
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/messages') && (!init?.method || init.method === 'GET')) {
        return jsonResponse(messages)
      }
      if (url.endsWith('/api/messages') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as {
          username: string
          fullname: string
          content: string
        }
        messages = [
          {
            id: 103,
            username: body.username,
            fullname: body.fullname,
            content: body.content,
            createdAt: '2026-11-21 10:00:00',
            ip: '10.0.0.12',
            replies: [],
          },
          ...messages,
        ]
        return jsonResponse({ success: true })
      }
      return jsonResponse({}, 404)
    })

    renderMessagesPage()
    await screen.findByText('Phan Trung Hiếu (20160)')

    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }))
    expect(await screen.findByText('Vui lòng nhập nội dung tin nhắn.')).toBeInTheDocument()

    const textarea = screen.getByLabelText('Đăng tin nhắn')
    await user.type(textarea, 'Thông báo mới sáng nay')
    await user.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }))

    expect(await screen.findByText('Thông báo mới sáng nay')).toBeInTheDocument()
    await waitFor(() => expect(textarea).toHaveValue(''))

    const postCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).endsWith('/api/messages') && init?.method === 'POST',
    )
    expect(postCall).toBeDefined()
    expect(JSON.parse(String(postCall?.[1]?.body))).toEqual({
      username: '20160',
      fullname: 'Phan Trung Hiếu',
      content: 'Thông báo mới sáng nay',
    })
  })

  it('posts an inline reply to a specific message', async () => {
    const user = userEvent.setup()
    let messages = structuredClone(SAMPLE_MESSAGES)
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/messages') && (!init?.method || init.method === 'GET')) {
        return jsonResponse(messages)
      }
      if (url.endsWith('/api/messages/102/replies') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as {
          username: string
          fullname: string
          content: string
        }
        messages = messages.map((m) =>
          m.id === 102
            ? {
                ...m,
                replies: [
                  ...m.replies,
                  {
                    id: 9,
                    username: body.username,
                    fullname: body.fullname,
                    content: body.content,
                    createdAt: '2026-11-21 10:30:00',
                    ip: '10.0.0.12',
                  },
                ],
              }
            : m,
        )
        return jsonResponse({ success: true })
      }
      return jsonResponse({}, 404)
    })

    renderMessagesPage()
    const secondCard = (await screen.findByText('Lịch bảo trì mạng tuần này.')).closest('article')
    expect(secondCard).not.toBeNull()

    const scoped = within(secondCard!)
    const replyInput = scoped.getByPlaceholderText('Trả lời tin nhắn này...')
    await user.type(replyInput, 'Đã nắm lịch bảo trì')
    await user.click(scoped.getByRole('button', { name: 'Gửi' }))

    expect(await scoped.findByText('Đã nắm lịch bảo trì')).toBeInTheDocument()
    await waitFor(() => expect(replyInput).toHaveValue(''))
  })

  it('filters by scope tab and search query', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SAMPLE_MESSAGES))

    renderMessagesPage()
    await screen.findByText('Lịch bảo trì mạng tuần này.')

    await user.click(screen.getByRole('tab', { name: /Của tôi/ }))
    expect(screen.queryByText('Lịch bảo trì mạng tuần này.')).not.toBeInTheDocument()
    expect(screen.getByText('Phan Trung Hiếu (20160)')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Tất cả/ }))
    const searchInput = screen.getByPlaceholderText('Tìm theo nội dung, người gửi...')
    await user.type(searchInput, 'bảo trì')
    expect(searchInput).toHaveValue('bảo trì')
    expect(screen.getByText('Lịch bảo trì mạng tuần này.')).toBeInTheDocument()
    expect(screen.queryByText('Phan Trung Hiếu (20160)')).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, 'không-tồn-tại')
    expect(screen.getByText('Không tìm thấy tin nhắn nào khớp bộ lọc.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    expect(screen.getByText('Lịch bảo trì mạng tuần này.')).toBeInTheDocument()
  })

  it('hides composer and reply inputs when user has read-only messages permission', async () => {
    useAppStore.setState({
      user: { ...USER, menu_perms: { messages: 'sr' } },
      authStatus: 'authenticated',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SAMPLE_MESSAGES))

    renderMessagesPage()
    await screen.findByText('Phan Trung Hiếu (20160)')

    expect(screen.queryByLabelText('Đăng tin nhắn')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Trả lời tin nhắn này...')).not.toBeInTheDocument()
  })

  it('renders InlineError with retry on server error', async () => {
    const user = userEvent.setup()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ message: 'Internal Server Error' }, 500))
      .mockResolvedValueOnce(jsonResponse(SAMPLE_MESSAGES))

    renderMessagesPage()
    const retryBtn = await screen.findByRole('button', { name: 'Thử lại' })
    await user.click(retryBtn)

    expect(await screen.findByText('Phan Trung Hiếu (20160)')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
