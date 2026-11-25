import i18n from '@/i18n'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PeriodFlowComparison } from '../utils/dashboard-charts'
import type { DashboardPeriod, Response1hStats, SnapshotMetrics } from '../utils/dashboard-domain'
import { DashboardKpiRow } from './DashboardKpiRow'

const SNAPSHOT: SnapshotMetrics = {
  total: 20,
  open: 8,
  paused: 1,
  overdue: 2,
  dueToday: 3,
  completed: 12,
  ontime: 10,
  late: 2,
  completionRate: 60,
  ontimeRate: 83.3,
}

const PERIOD_COMPARISON: PeriodFlowComparison = {
  current: {
    range: {
      start: new Date('2026-11-01T00:00:00'),
      end: new Date('2026-11-30T23:59:59'),
      startDateStr: '2026-11-01',
      endDateStr: '2026-11-30',
    },
    createdTasks: [],
    completedTasks: [],
    createdOverdue: 0,
    createdOpen: 0,
    completedOntime: 0,
    completedLate: 0,
    backlogDelta: 0,
  },
  previous: {
    range: {
      start: new Date('2026-10-01T00:00:00'),
      end: new Date('2026-10-31T23:59:59'),
      startDateStr: '2026-10-01',
      endDateStr: '2026-10-31',
    },
    createdTasks: [],
    completedTasks: [],
    createdOverdue: 0,
    createdOpen: 0,
    completedOntime: 0,
    completedLate: 0,
    backlogDelta: 0,
  },
  createdDiff: 0,
  completedDiff: 0,
  clearanceRate: null,
}

const RESPONSE_1H: Response1hStats = {
  passTasks: [],
  failTasks: [],
  noResponseTasks: [],
  respondedCount: 0,
  passRate: null,
}

function renderRow(period: DashboardPeriod = 'month') {
  return render(
    <DashboardKpiRow
      scopeMode="all"
      onScopeModeChange={vi.fn()}
      period={period}
      onPeriodChange={vi.fn()}
      snapshot={SNAPSHOT}
      periodComparison={PERIOD_COMPARISON}
      response1h={RESPONSE_1H}
      onClickOpen={vi.fn()}
      onClickOverdue={vi.fn()}
      onClickDueToday={vi.fn()}
      onClickPeriodTab={vi.fn()}
      onClickResponse1h={vi.fn()}
    />,
  )
}

describe('DashboardKpiRow', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('vi')
  })

  it('omits live badges on snapshot cards and highlights period badges on period-filtered cards', () => {
    const { rerender } = renderRow('month')

    expect(screen.queryByText('Hiện tại')).not.toBeInTheDocument()

    const monthBadges = screen
      .getAllByText('Tháng này')
      .filter((el) => el.tagName === 'SPAN')
    expect(monthBadges).toHaveLength(2)
    for (const badge of monthBadges) {
      expect(badge).toHaveClass('bg-primary-soft', 'text-primary')
    }

    rerender(
      <DashboardKpiRow
        scopeMode="all"
        onScopeModeChange={vi.fn()}
        period="week"
        onPeriodChange={vi.fn()}
        snapshot={SNAPSHOT}
        periodComparison={PERIOD_COMPARISON}
        response1h={RESPONSE_1H}
        onClickOpen={vi.fn()}
        onClickOverdue={vi.fn()}
        onClickDueToday={vi.fn()}
        onClickPeriodTab={vi.fn()}
        onClickResponse1h={vi.fn()}
      />,
    )

    const weekBadges = screen
      .getAllByText('Tuần này')
      .filter((el) => el.tagName === 'SPAN')
    expect(weekBadges).toHaveLength(2)
    for (const badge of weekBadges) {
      expect(badge).toHaveClass('bg-primary-soft', 'text-primary')
    }
  })
})
