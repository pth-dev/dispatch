import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DonutChart } from './donut-chart'
import { HorizontalBarRow } from './horizontal-bar-row'
import { MetricCard } from './metric-card'
import { ResponsiveModal } from './responsive-modal'
import { Sparkline } from './sparkline'
import { TrendLineChart } from './trend-line-chart'

describe('Phase 0 reusable UI primitives', () => {
  it('renders MetricCard as static card or clickable drill-down button', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <div>
        <MetricCard label="Static Total" value={42} subtext="All tasks" />
        <MetricCard label="Overdue" value={5} tone="destructive" onClick={onClick} active />
      </div>,
    )

    expect(screen.getByText('Static Total')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /Overdue/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await user.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders HorizontalBarRow with progressbar semantics and click action', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <HorizontalBarRow
        label="IT Dept"
        percent={60}
        secondaryPercent={20}
        valueText="80%"
        onClick={onClick}
      />,
    )

    const bar = screen.getByRole('progressbar', { name: 'IT Dept' })
    expect(bar).toHaveAttribute('aria-valuenow', '80')
    await user.click(screen.getByRole('button', { name: /IT Dept/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders Sparkline SVG when >= 2 points and dash fallback otherwise', () => {
    const { rerender } = render(<Sparkline data={[3]} ariaLabel="Mini trend" />)
    expect(screen.getByText('—')).toBeInTheDocument()

    rerender(<Sparkline data={[1, 4, 2, 6]} ariaLabel="Mini trend" />)
    expect(screen.getByRole('img', { name: 'Mini trend' })).toBeInTheDocument()
  })

  it('renders DonutChart and supports selecting a segment via legend button', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DonutChart
        ariaLabel="Task status distribution"
        centerLabel="Total"
        activeSegmentId="ontime"
        onSelectSegment={onSelect}
        segments={[
          { id: 'ontime', label: 'On time', value: 8, colorVar: 'var(--color-success)' },
          { id: 'overdue', label: 'Overdue', value: 2, colorVar: 'var(--color-destructive)' },
        ]}
      />,
    )

    expect(screen.getByRole('img', { name: 'Task status distribution' })).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Overdue/i }))
    expect(onSelect).toHaveBeenCalledWith('overdue')
  })

  it('renders TrendLineChart empty state and interactive legend toggle', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <TrendLineChart
        labels={[]}
        series={[]}
        ariaLabel="Post trends"
        emptyMessage="No trend data"
      />,
    )
    expect(screen.getByText('No trend data')).toBeInTheDocument()

    rerender(
      <TrendLineChart
        labels={['2026-11-01', '2026-11-02']}
        series={[
          { id: 'it', label: 'IT', data: [2, 5], total: 7 },
          { id: 'mfg', label: 'MFG', data: [1, 3], total: 4 },
        ]}
        ariaLabel="Post trends"
        emptyMessage="No trend data"
      />,
    )

    expect(screen.getByRole('img', { name: 'Post trends' })).toBeInTheDocument()
    const itLegend = screen.getByRole('button', { name: /IT/i })
    await user.click(itLegend)
    expect(itLegend).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders ResponsiveModal title, body, and footer when open', () => {
    render(
      <ResponsiveModal
        open
        onOpenChange={vi.fn()}
        title="Details Modal"
        description="Summary info"
        footer={<button type="button">Done</button>}
      >
        <p>Modal content body</p>
      </ResponsiveModal>,
    )

    expect(screen.getByText('Details Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content body')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })
})
