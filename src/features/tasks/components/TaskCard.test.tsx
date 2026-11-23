import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import { createTaskCardFixtures } from '../utils/task-card-fixtures'
import { EMPTY_DISPLAY_VALUE, mapTaskToCardViewModel } from '../utils/task-card-mapper'
import { TaskCard } from './TaskCard'

const NOW = new Date(2026, 10, 21, 10, 0, 0)
const RESOLVERS = {
  resolveDeptName: (v: string | null | undefined) => v ?? '-',
  resolveSiteName: (c: string) => c,
}
const ASSIGNEE_USER: SessionUser = {
  id: 1,
  username: '20160',
  fullname: 'Phan Trung Hiếu',
  dept: '資訊部',
  site: 'VT',
  role: 'user',
  auth_source: 'local',
  menu_perms: null,
  is_computer_room: false,
}
const OTHER_USER: SessionUser = {
  ...ASSIGNEE_USER,
  id: 2,
  username: '99999',
  fullname: 'Người Dùng Khác',
}

function fixture(id: number): RawTask {
  const task = createTaskCardFixtures(NOW).find((t) => t.id === id)
  if (!task) throw new Error(`missing fixture ${id}`)
  return task
}

function renderCard(task: RawTask, currentUser: SessionUser | null = ASSIGNEE_USER) {
  const vm = mapTaskToCardViewModel(task, RESOLVERS, NOW, currentUser)
  return render(
    <MemoryRouter>
      <TaskCard vm={vm} />
    </MemoryRouter>,
  )
}

describe('TaskCard', () => {
  it('renders all 4 info rows with "—" when optional fields are missing', () => {
    renderCard(fixture(410))
    expect(screen.getByText('Hạn hoàn thành')).toBeInTheDocument()
    expect(screen.getByText('Báo cáo gần nhất')).toBeInTheDocument()
    expect(screen.getByText('Người nhận')).toBeInTheDocument()
    expect(screen.getByText('Người giao')).toBeInTheDocument()
    expect(screen.getAllByText(EMPTY_DISPLAY_VALUE).length).toBeGreaterThanOrEqual(5)
  })

  it('clearly separates assignee and dispatcher with Name (Code) • Department format', () => {
    const task: RawTask = {
      ...fixture(405),
      assign_person: '15965',
      assigned_unit: 'BP. IT',
      reporter: '20160',
      reporter_name: 'Phan Trung Hiếu',
      reporter_dept: 'BP. Sản xuất',
    }
    const vm = mapTaskToCardViewModel(
      task,
      {
        ...RESOLVERS,
        resolveAssignees: () => 'Nguyễn Văn A (15965)',
        resolveUser: () => 'Phan Trung Hiếu (20160)',
        resolveUserDept: () => 'BP. Sản xuất',
      },
      NOW,
    )
    expect(vm.assigneeDisplay).toBe('Nguyễn Văn A (15965) • BP. IT')
    expect(vm.dispatcherDisplay).toBe('Phan Trung Hiếu (20160) • BP. Sản xuất')
  })

  it('shows "Báo cáo ngay" only when due today, incomplete, and current user is the assignee', () => {
    const dueTodayTask = fixture(405)

    // 1. Assignee sees "Báo cáo ngay"
    const first = renderCard(dueTodayTask, ASSIGNEE_USER)
    expect(screen.getByRole('link', { name: 'Báo cáo ngay' })).toBeInTheDocument()
    first.unmount()

    // 2. Non-assignee sees "Xem chi tiết" even when task is due today
    const second = renderCard(dueTodayTask, OTHER_USER)
    expect(screen.getByRole('link', { name: 'Xem chi tiết' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Báo cáo ngay' })).not.toBeInTheDocument()
    second.unmount()

    // 3. Assignee sees "Xem chi tiết" when task progress is 100%
    const third = renderCard({ ...dueTodayTask, progress: 100 }, ASSIGNEE_USER)
    expect(screen.getByRole('link', { name: 'Xem chi tiết' })).toBeInTheDocument()
    third.unmount()

    // 4. Completed task (409) shows "Xem chi tiết"
    renderCard(fixture(409), ASSIGNEE_USER)
    expect(screen.getByRole('link', { name: 'Xem chi tiết' })).toBeInTheDocument()
  })

  it('clamps progress to 0..100', () => {
    expect(mapTaskToCardViewModel({ ...fixture(406), progress: 140 }, RESOLVERS, NOW).progressPercent).toBe(100)
    expect(mapTaskToCardViewModel({ ...fixture(406), progress: -5 }, RESOLVERS, NOW).progressPercent).toBe(0)
  })

  it('maps tones: due today = warning, overdue = destructive, done = default', () => {
    expect(mapTaskToCardViewModel(fixture(405), RESOLVERS, NOW).dueTone).toBe('warning')
    expect(mapTaskToCardViewModel(fixture(406), RESOLVERS, NOW).dueTone).toBe('destructive')
    expect(mapTaskToCardViewModel(fixture(409), RESOLVERS, NOW).dueTone).toBe('default')
  })

  it('keeps the full title in the DOM as the single detail link', () => {
    const task = fixture(407)
    renderCard(task)
    const link = screen.getByRole('link', { name: task.title })
    expect(link).toHaveAttribute('href', '/tasks/407')
    expect(link).not.toHaveAttribute('aria-label')
  })

  it('shows urgent marker and untranslated state', () => {
    renderCard(fixture(407))
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument()
    expect(screen.getByText('Chưa dịch')).toBeInTheDocument()
  })

  it('uses a tooltip on desktop and shows "Xem đủ" sheet with full title only on mobile when truncated', async () => {
    const task = fixture(407)
    const user = userEvent.setup()

    // 1. Desktop (default width >= 1024): tooltip renders on hover, no "Xem đủ" button
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 })
    const { unmount } = renderCard(task)
    const desktopLink = screen.getByRole('link', { name: task.title })
    Object.defineProperty(desktopLink, 'clientHeight', { configurable: true, value: 48 })
    Object.defineProperty(desktopLink, 'scrollHeight', { configurable: true, value: 96 })
    window.dispatchEvent(new Event('resize'))

    await user.hover(desktopLink)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(task.title)
    expect(screen.queryByRole('button', { name: 'Xem đủ' })).not.toBeInTheDocument()
    unmount()

    // 2. Mobile (< 1024): "Xem đủ" button appears and opens sheet with the full title only
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
    renderCard(task)
    const mobileLink = screen.getByRole('link', { name: task.title })
    Object.defineProperty(mobileLink, 'clientHeight', { configurable: true, value: 48 })
    Object.defineProperty(mobileLink, 'scrollHeight', { configurable: true, value: 96 })
    window.dispatchEvent(new Event('resize'))

    const readFullBtn = await waitFor(() =>
      screen.getByRole('button', { name: 'Xem đủ' }),
    )
    await user.click(readFullBtn)

    expect(await screen.findByText(/#407 — Tiêu đề đầy đủ/)).toBeInTheDocument()
    expect(screen.getAllByText(task.title).length).toBeGreaterThanOrEqual(2)
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 })
  })
})
