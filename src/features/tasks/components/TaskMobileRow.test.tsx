import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { RawTask } from '@/schemas/task'
import { createTaskCardFixtures } from '../utils/task-card-fixtures'
import { mapTaskToCardViewModel } from '../utils/task-card-mapper'
import { TaskMobileRow } from './TaskMobileRow'

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

function renderRow(task: RawTask, withLessonHits = false) {
  const baseVm = mapTaskToCardViewModel(task, RESOLVERS, NOW)
  const vm = withLessonHits
    ? {
        ...baseVm,
        lessonHits: [
          {
            id: 7,
            topic: 'Lỗi máy in tem',
            matchedKeywords: ['in ấn'],
            content: 'Kiểm tra driver trước khi cài lại',
          },
        ],
      }
    : baseVm

  return render(
    <MemoryRouter>
      <TaskMobileRow vm={vm} />
    </MemoryRouter>,
  )
}

describe('TaskMobileRow', () => {
  it('renders compact 3-line summary and quick report link when needsReportToday is true', () => {
    const task = fixture(405)
    renderRow(task)

    expect(screen.getByTestId('task-mobile-row')).toBeInTheDocument()
    expect(screen.getByText('#405')).toBeInTheDocument()
    expect(screen.getByText('VT')).toBeInTheDocument()
    expect(screen.getByText('21/11')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()

    const titleLink = screen.getByRole('link', { name: task.title })
    expect(titleLink).toHaveAttribute('href', '/tasks/405')

    const reportLink = screen.getByRole('link', { name: 'Báo cáo' })
    expect(reportLink).toHaveAttribute('href', '/tasks/405#report')
  })

  it('omits report and view-detail buttons when task does not need report today', () => {
    renderRow(fixture(409))

    expect(screen.queryByRole('link', { name: 'Báo cáo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Xem chi tiết' })).not.toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows urgent marker and compact lesson badge when present', () => {
    renderRow(fixture(407), true)

    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /bài học/i })).toHaveAttribute('href', '/lessons?id=7')
  })

  it('formats short due date with year when due date is in a different year', () => {
    const nextYearTask: RawTask = {
      ...fixture(405),
      due_date: '2027-02-14T17:00',
    }
    const vm = mapTaskToCardViewModel(nextYearTask, RESOLVERS, NOW)
    expect(vm.dueShortAt).toBe('14/02/2027')
  })

  it('renders cleanly when optional fields are missing', () => {
    const task = fixture(410)
    renderRow(task)

    expect(screen.getByRole('link', { name: task.title })).toHaveAttribute('href', '/tasks/410')
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
