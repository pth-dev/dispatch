import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { useAppStore } from '@/app/store'
import { ReportsPage } from './ReportsPage'

const NOW = new Date()
const CUR_YM = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`

const MOCK_TASKS = [
  {
    id: 801,
    title: 'Nâng cấp máy chủ',
    assigned_unit: '資訊部',
    assign_person: 'staff1',
    reporter: 'boss',
    due_date: `${CUR_YM}-28T17:00`,
    finish_date: `${CUR_YM}-15 10:00:00`,
    progress: 100,
    paused: 0,
    confidential: 0,
    task_type: '系統 / Hệ thống',
    site: 'YS',
    createdAt: `${CUR_YM}-10 08:00:00`,
  },
]

const MOCK_ARCHIVES = [
  {
    id: 12,
    title: 'Báo cáo tháng 11',
    report_no: 'WR-2026-11-BOSS',
    file_base: 'Dispatch_Report_2026-11',
    subject_label: 'Cá nhân tôi',
    range_start: '2026-11-01',
    range_end: '2026-11-30',
    size_bytes: 4096,
    createdAt: '2026-11-25 10:00:00',
  },
]

function renderReportsPage(initialUrl = '/reports') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <ReportsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('switches across PDF, Periodic KPI, Excel, and Web Archive tabs', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/reports/tasks')) {
        return new Response(JSON.stringify(MOCK_TASKS), { status: 200 })
      }
      if (url.includes('/webreports/12') && init?.method === 'DELETE') {
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      if (url.includes('/webreports') && init?.method === 'POST') {
        return new Response(JSON.stringify({ success: true, id: 13 }), { status: 200 })
      }
      if (url.includes('/webreports')) {
        return new Response(JSON.stringify({ success: true, items: MOCK_ARCHIVES }), {
          status: 200,
        })
      }
      return new Response(JSON.stringify({ depts: [] }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderReportsPage('/reports?tab=pdf')

    expect(await screen.findByText('Nâng cấp máy chủ')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'KPI định kỳ' }))
    expect(await screen.findByText('100 (A)')).toBeInTheDocument()
    expect(screen.getByText('Top 10 nhân sự (xem trước)')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('include_cycles=1&basis=final'),
      expect.anything(),
    )

    await user.click(screen.getByRole('tab', { name: 'Thống kê Excel' }))
    expect(await screen.findByText('staff1')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Báo cáo Web & Lưu trữ' }))
    expect(await screen.findByText('Báo cáo tháng 11')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Lưu vào kho lưu trữ' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/webreports'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('hides restricted report tabs based on menu_perms', async () => {
    useAppStore.setState({
      user: {
        username: 'staff1',
        fullname: 'Staff',
        dept: '資訊部',
        site: 'YS',
        role: 'user',
        auth_source: 'local',
        menu_perms: { report_pdf: 'sr', kpi_report: '', excel_report: '' },
        is_computer_room: false,
      },
      authStatus: 'authenticated',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(MOCK_TASKS), { status: 200 })),
    )

    renderReportsPage('/reports')

    expect(await screen.findByRole('tab', { name: 'Xuất báo cáo PDF' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'KPI định kỳ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Thống kê Excel' })).not.toBeInTheDocument()
  })
})
