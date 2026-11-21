import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionUser } from '@/schemas/auth'
import type { RawReport, RawTask } from '@/schemas/task'
import { ReportFeed } from './ReportFeed'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const sampleUser: SessionUser = {
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

const sampleTask: RawTask = {
  id: 101,
  title: 'Test Task',
  reporter: 'hieu',
  assigned_unit: '資訊部',
  assign_person: 'hieu',
  due_date: '2026-12-01T17:00',
  progress: 50,
  paused: 0,
  confidential: 0,
  cross_dept: 0,
}

const sampleReport: RawReport = {
  id: 501,
  task_id: 101,
  username: 'hieu',
  fullname: 'Phan Trung Hiếu',
  content: 'Báo cáo ban đầu',
  attachments: JSON.stringify([{ name: 'doc.pdf', path: '/uploads/doc.pdf' }]),
  createdAt: '2026-11-20 10:00:00',
  progress: 50,
}

function renderFeed() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportFeed
        task={sampleTask}
        user={sampleUser}
        reports={[sampleReport]}
        isLoading={false}
      />
    </QueryClientProvider>,
  )
}

describe('ReportFeed', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('surfaces localized error and preserves draft when editing report fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ success: false, message: '編輯失敗 / Không thể cập nhật báo cáo' }, 400),
      ),
    )

    const user = userEvent.setup()
    renderFeed()

    await user.click(screen.getByRole('button', { name: /chỉnh sửa/i }))
    const textarea = screen.getByRole('textbox')
    await user.clear(textarea)
    await user.type(textarea, 'Nội dung mới chưa lưu')
    await user.click(screen.getByRole('button', { name: /lưu/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Không thể cập nhật báo cáo')
    expect(screen.getByRole('textbox')).toHaveValue('Nội dung mới chưa lưu')
  })

  it('surfaces localized error when deleting report attachment fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ success: false, message: '刪除失敗 / Không có quyền xóa tệp' }, 400),
      ),
    )

    const user = userEvent.setup()
    renderFeed()

    await user.click(screen.getByRole('button', { name: /xoá/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Không có quyền xóa tệp')
  })
})
