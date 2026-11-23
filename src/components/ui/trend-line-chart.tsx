import * as React from 'react'
import { cn } from '@/utils/cn'

export interface TrendSeries {
  id: string
  label: string
  data: readonly number[]
  total: number
  dashed?: boolean
  colorVar?: string
}

export interface TrendLineChartProps {
  labels: readonly string[]
  series: readonly TrendSeries[]
  ariaLabel: string
  emptyMessage: string
  formatXLabel?: (raw: string) => string
  maxSeries?: number
  className?: string
}

interface ResolvedLine extends TrendSeries {
  stroke: string
}

const CHART_COLOR_VARS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
  'var(--color-chart-9)',
  'var(--color-chart-10)',
  'var(--color-chart-5)',
] as const

const VIEW_W = 720
const VIEW_H = 230
const PAD = { left: 36, right: 12, top: 14, bottom: 28 }

function TrendChartGrid({
  yTicks,
  labels,
  xAt,
  yAt,
  formatXLabel,
}: {
  yTicks: readonly number[]
  labels: readonly string[]
  xAt: (index: number) => number
  yAt: (value: number) => number
  formatXLabel?: (raw: string) => string
}) {
  const xEvery = Math.max(1, Math.ceil(labels.length / 10))
  return (
    <>
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            y1={yAt(tick)}
            x2={VIEW_W - PAD.right}
            y2={yAt(tick)}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 6}
            y={yAt(tick) + 3}
            textAnchor="end"
            fontSize="10"
            fill="var(--color-muted-foreground)"
          >
            {tick}
          </text>
        </g>
      ))}
      {labels.map((raw, i) =>
        i % xEvery === 0 || i === labels.length - 1 ? (
          <text
            key={`${raw}-${i}`}
            x={xAt(i)}
            y={VIEW_H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--color-muted-foreground)"
          >
            {formatXLabel ? formatXLabel(raw) : raw}
          </text>
        ) : null,
      )}
    </>
  )
}

function TrendSeriesLayer({
  line,
  labels,
  dimmed,
  xAt,
  yAt,
}: {
  line: ResolvedLine
  labels: readonly string[]
  dimmed: boolean
  xAt: (index: number) => number
  yAt: (value: number) => number
}) {
  const values = line.data.slice(0, labels.length)
  const pts = values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ')
  return (
    <g className={cn('transition-opacity', dimmed && 'opacity-20')}>
      <polyline
        points={pts}
        fill="none"
        stroke={line.stroke}
        strokeWidth={line.dashed ? 1.5 : 2}
        strokeDasharray={line.dashed ? '4 3' : undefined}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <title>{`${line.label}: ${line.total}`}</title>
      </polyline>
      {labels.length <= 36 &&
        values.map((v, i) =>
          v > 0 ? (
            <circle key={i} cx={xAt(i)} cy={yAt(v)} r="2.5" fill={line.stroke}>
              <title>{`${line.label} · ${labels[i] ?? ''}: ${v}`}</title>
            </circle>
          ) : null,
        )}
    </g>
  )
}

function TrendLegendItem({
  line,
  active,
  onToggle,
}: {
  line: ResolvedLine
  active: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onToggle(line.id)}
      className={cn(
        'inline-flex min-h-11 lg:min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary-soft/50 text-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-secondary/70',
      )}
    >
      <svg width="14" height="6" aria-hidden="true">
        <line
          x1="0"
          y1="3"
          x2="14"
          y2="3"
          stroke={line.stroke}
          strokeWidth="2.5"
          strokeDasharray={line.dashed ? '3 2' : undefined}
        />
      </svg>
      <span className="max-w-36 truncate font-medium text-foreground">{line.label}</span>
      <span className="tabular-nums text-muted-foreground">{line.total}</span>
    </button>
  )
}

export function TrendLineChart({
  labels,
  series,
  ariaLabel,
  emptyMessage,
  formatXLabel,
  maxSeries = 10,
  className,
}: TrendLineChartProps) {
  const [focusedSeriesId, setFocusedSeriesId] = React.useState<string | null>(null)

  const lines: ResolvedLine[] = series.slice(0, maxSeries).map((item, idx) => ({
    ...item,
    stroke:
      item.colorVar ??
      (item.dashed
        ? 'var(--color-foreground)'
        : (CHART_COLOR_VARS[idx % CHART_COLOR_VARS.length] ?? 'var(--color-chart-1)')),
  }))

  let maxVal = 0
  for (const line of lines) {
    for (const v of line.data.slice(0, labels.length)) {
      if (v > maxVal) maxVal = v
    }
  }

  if (labels.length === 0 || maxVal <= 0) {
    return (
      <div className={cn('py-10 text-center text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    )
  }

  const innerW = VIEW_W - PAD.left - PAD.right
  const innerH = VIEW_H - PAD.top - PAD.bottom
  const stepUnit = maxVal > 50 ? 10 : 1
  const step = maxVal <= 5 ? 1 : Math.ceil(maxVal / 5 / stepUnit) * stepUnit
  const topVal = Math.ceil(maxVal / step) * step

  const xAt = (i: number) =>
    PAD.left + (labels.length === 1 ? innerW / 2 : (innerW * i) / (labels.length - 1))
  const yAt = (v: number) => PAD.top + innerH - (innerH * Math.max(0, v)) / topVal

  const yTicks: number[] = []
  for (let v = 0; v <= topVal; v += step) yTicks.push(v)

  const toggleFocus = (id: string) => {
    setFocusedSeriesId((prev) => (prev === id ? null : id))
  }

  return (
    <div className={cn('space-y-3', className)}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
        <TrendChartGrid
          yTicks={yTicks}
          labels={labels}
          xAt={xAt}
          yAt={yAt}
          formatXLabel={formatXLabel}
        />
        {lines.map((line) => (
          <TrendSeriesLayer
            key={line.id}
            line={line}
            labels={labels}
            dimmed={focusedSeriesId != null && focusedSeriesId !== line.id}
            xAt={xAt}
            yAt={yAt}
          />
        ))}
      </svg>

      <div className="flex flex-wrap gap-1.5">
        {lines.map((line) => (
          <TrendLegendItem
            key={line.id}
            line={line}
            active={focusedSeriesId === line.id}
            onToggle={toggleFocus}
          />
        ))}
      </div>
    </div>
  )
}
