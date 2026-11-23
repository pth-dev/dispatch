import { ArrowLeftRight, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import type {
  FlowTrendGranularity,
  FlowTrendPoint,
  FlowTrendSummary,
} from '../utils/dashboard-charts'

interface DashboardFlowTrendChartProps {
  summary: FlowTrendSummary
  gran: FlowTrendGranularity
  onGranChange: (gran: FlowTrendGranularity) => void
  onSelectPoint: (point: FlowTrendPoint) => void
}

const GRAN_OPTIONS: readonly FlowTrendGranularity[] = ['week', 'month']
const VIEW_W = 640
const VIEW_H = 210
const PAD = { left: 34, right: 12, top: 14, bottom: 38 }

function formatSigned(val: number): string {
  if (val > 0) return `+${val}`
  return `${val}`
}

function FlowTrendSvg({
  points,
  ariaLabel,
  onSelectPoint,
}: {
  points: readonly FlowTrendPoint[]
  ariaLabel: string
  onSelectPoint: (point: FlowTrendPoint) => void
}) {
  const maxBar = Math.max(1, ...points.map((p) => Math.max(p.created, p.completed)))
  const stepUnit = maxBar > 50 ? 10 : 1
  const step = maxBar <= 4 ? 1 : Math.ceil(maxBar / 4 / stepUnit) * stepUnit
  const topVal = Math.ceil(maxBar / step) * step

  const innerW = VIEW_W - PAD.left - PAD.right
  const innerH = VIEW_H - PAD.top - PAD.bottom
  const groupW = innerW / Math.max(1, points.length)
  const barW = Math.min(18, Math.max(6, groupW * 0.28))
  const yAt = (v: number) => PAD.top + innerH - (innerH * Math.max(0, v)) / topVal

  const yTicks: number[] = []
  for (let v = 0; v <= topVal; v += step) yTicks.push(v)

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
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
          <text x={PAD.left - 6} y={yAt(tick) + 3} textAnchor="end" fontSize="10" fill="var(--color-muted-foreground)">
            {tick}
          </text>
        </g>
      ))}

      {points.map((p, i) => {
        const cx = PAD.left + groupW * i + groupW / 2
        const createdH = PAD.top + innerH - yAt(p.created)
        const completedH = PAD.top + innerH - yAt(p.completed)
        const deltaColor =
          p.delta > 0
            ? 'var(--color-warning)'
            : p.delta < 0
              ? 'var(--color-success)'
              : 'var(--color-muted-foreground)'

        const pointSummary = `${p.rangeLabel} · ${p.created} / ${p.completed} (${formatSigned(p.delta)})`

        return (
          <g
            key={p.key}
            role="button"
            tabIndex={0}
            aria-label={pointSummary}
            className="cursor-pointer group focus-visible:outline-none"
            onClick={() => onSelectPoint(p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectPoint(p)
              }
            }}
          >
            <title>{pointSummary}</title>
            <rect
              x={cx - groupW * 0.45}
              y={PAD.top}
              width={groupW * 0.9}
              height={innerH}
              rx="4"
              fill="transparent"
              className="group-hover:fill-secondary/40 group-focus-visible:fill-primary/10 group-focus-visible:stroke-ring transition-colors"
            />
            <rect
              x={cx - barW - 1.5}
              y={yAt(p.created)}
              width={barW}
              height={Math.max(0, createdH)}
              rx="2"
              fill="var(--color-primary)"
            />
            <rect
              x={cx + 1.5}
              y={yAt(p.completed)}
              width={barW}
              height={Math.max(0, completedH)}
              rx="2"
              fill="var(--color-success)"
            />
            <text x={cx} y={VIEW_H - 20} textAnchor="middle" fontSize="10" fill="var(--color-muted-foreground)">
              {p.label}
            </text>
            <text x={cx} y={VIEW_H - 6} textAnchor="middle" fontSize="9.5" fontWeight="600" fill={deltaColor}>
              ({formatSigned(p.delta)})
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function DashboardFlowTrendChart({
  summary,
  gran,
  onGranChange,
  onSelectPoint,
}: DashboardFlowTrendChartProps) {
  const { t } = useTranslation()
  const hasAny = summary.points.some((p) => p.created > 0 || p.completed > 0)
  const tooltip = t('dashboard.flowTrend.tooltip')

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ArrowLeftRight className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">{t('dashboard.flowTrend.title')}</h2>
            <span title={tooltip} aria-label={tooltip} className="text-muted-foreground">
              <Info className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-primary" aria-hidden="true" />
              <span>{t('dashboard.kpi.createdLabel')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-xs bg-success" aria-hidden="true" />
              <span>{t('dashboard.kpi.completedLabel')}</span>
            </span>
            <span>{t('dashboard.flowTrend.clickHint')}</span>
          </div>
        </div>

        <div
          role="group"
          aria-label={t('dashboard.flowTrend.granLabel')}
          className="inline-flex w-fit rounded-lg border border-border bg-secondary/40 p-1"
        >
          {GRAN_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              aria-pressed={gran === opt}
              onClick={() => onGranChange(opt)}
              className={cn(
                'min-h-11 lg:min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                gran === opt
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`dashboard.flowTrend.gran.${opt}`)}
            </button>
          ))}
        </div>
      </div>

      {!hasAny ? (
        <p className="py-10 text-center text-xs text-muted-foreground">{t('dashboard.flowTrend.empty')}</p>
      ) : (
        <FlowTrendSvg
          points={summary.points}
          ariaLabel={t('dashboard.flowTrend.title')}
          onSelectPoint={onSelectPoint}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 text-xs text-muted-foreground tabular-nums">
        <span>
          {t('dashboard.flowTrend.summaryLine', {
            avgCreated: summary.avgCreated,
            avgCompleted: summary.avgCompleted,
          })}
        </span>
        <span
          className={cn(
            'font-semibold',
            summary.totalDelta > 0
              ? 'text-warning'
              : summary.totalDelta < 0
                ? 'text-success'
                : 'text-foreground',
          )}
        >
          {t('dashboard.flowTrend.totalDelta', { diff: formatSigned(summary.totalDelta) })}
        </span>
      </div>
    </section>
  )
}
