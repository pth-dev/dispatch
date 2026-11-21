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
  it('renders all 4 info rows with "—" when optional fields are missing', () => {
    renderCard(fixture(410))
    expect(screen.getByText('Hạn hoàn thành')).toBeInTheDocument()
    expect(screen.getByText('Báo cáo gần nhất')).toBeInTheDocument()
    expect(screen.getByText('Người nhận')).toBeInTheDocument()
    expect(screen.getByText('Yêu cầu')).toBeInTheDocument()
    expect(screen.getAllByText(EMPTY_DISPLAY_VALUE).length).toBeGreaterThanOrEqual(5)
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

  it('shows "Xem đủ" only when the title overflows and opens the popover with the full title', async () => {
    const task = fixture(407)
    renderCard(task)

    expect(screen.queryByRole('button', { name: 'Xem đủ' })).not.toBeInTheDocument()

    const link = screen.getByRole('link', { name: task.title })
    Object.defineProperty(link, 'clientHeight', { configurable: true, value: 48 })
    Object.defineProperty(link, 'scrollHeight', { configurable: true, value: 96 })
    window.dispatchEvent(new Event('resize'))

    const readFullBtn = await waitFor(() =>
      screen.getByRole('button', { name: 'Xem đủ' }),
    )
    expect(readFullBtn).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(readFullBtn)

    expect(await screen.findByRole('link', { name: 'Mở nhiệm vụ' })).toHaveAttribute(
      'href',
      '/tasks/407',
    )
    expect(screen.getAllByText(task.title).length).toBeGreaterThanOrEqual(2)
  })
})
