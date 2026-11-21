import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { RawTask } from '@/schemas/task'
import { createTaskCardFixtures } from '../utils/task-card-fixtures'
import { EMPTY_DISPLAY_VALUE, mapTaskToCardViewModel } from '../utils/task-card-mapper'
import { TaskCard } from './TaskCard'

const NOW = new Date(2026, 10, 21, 10, 0, 0)
const RESOLVERS = {
  resolveDeptName: (v: string | null | undefined) => v ?? '-',
  resolveSiteName: (c: string) => c,
}

function fixture(id: number): RawTask {
  const task = createTaskCardFixtures(NOW).find((t) => t.id === id)
  if (!task) throw new Error(`missing fixture ${id}`)
  return task
}

function renderCard(task: RawTask) {
  const vm = mapTaskToCardViewModel(task, RESOLVERS, NOW)
  return render(
    <MemoryRouter>
      <TaskCard vm={vm} />
    </MemoryRouter>,
  )
}

describe('TaskCard', () => {
  it('renders all 5 info rows with "—" when optional fields are missing', () => {
    renderCard(fixture(410))
    expect(screen.getByText('Hạn hoàn thành')).toBeInTheDocument()
    expect(screen.getByText('Báo cáo gần nhất')).toBeInTheDocument()
    expect(screen.getByText('Người nhận')).toBeInTheDocument()
    expect(screen.getByText('Người giao')).toBeInTheDocument()
    expect(screen.getByText('Đơn vị Y/C')).toBeInTheDocument()
    expect(screen.getAllByText(EMPTY_DISPLAY_VALUE).length).toBeGreaterThanOrEqual(6)
  })

  it('clearly separates assignee, dispatcher, and requesting unit with Name (Code) format', () => {
    const task: RawTask = {
      ...fixture(405),
      assign_person: '15965',
      assigned_unit: 'BP. IT',
      reporter: '15965',
      reporter_name: 'Phan Trung Hiếu',
      reporter_dept: 'BP. IT',
      req_dept: 'BP. Sản xuất',
      req_contact: null,
    }
    const vm = mapTaskToCardViewModel(
      task,
      {
        ...RESOLVERS,
        resolveAssignees: () => 'Phan Trung Hiếu (15965)',
        resolveUser: () => 'Phan Trung Hiếu (15965)',
      },
      NOW,
    )
    expect(vm.assigneeDisplay).toBe('Phan Trung Hiếu (15965) • BP. IT')
    expect(vm.dispatcherDisplay).toBe('Phan Trung Hiếu (15965) • BP. IT')
    expect(vm.requesterDisplay).toBe('BP. Sản xuất')
  })

  it('switches the action label by needsReportToday', () => {
    const { unmount } = renderCard(fixture(405))
    expect(screen.getByRole('link', { name: 'Báo cáo ngay' })).toBeInTheDocument()
    unmount()
    renderCard(fixture(409))
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
