import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import type { PeriodFlowComparison } from '../utils/dashboard-charts'
import type { DashboardPeriod } from '../utils/dashboard-domain'

interface DashboardFlowKpiCardProps {
  period: DashboardPeriod
  comparison: PeriodFlowComparison
  onClickTab: (tab: 'created' | 'completed') => void
  className?: string
}

function formatSignedDiff(diff: number): string {
  if (diff > 0) return `+${diff}`
  return `${diff}`
}

export function DashboardFlowKpiCard({
  period,
  comparison,
  onClickTab,
  className,
}: DashboardFlowKpiCardProps) {
  const { t } = useTranslation()
  const { current, previous, createdDiff, completedDiff, clearanceRate } = comparison
  const created = current.createdTasks.length
  const completed = current.completedTasks.length
  const delta = current.backlogDelta
  const prevDelta = previous.backlogDelta
  const barPct = created > 0 ? Math.min(100, Math.round((completed / created) * 100)) : completed > 0 ? 100 : 0

  const deltaTone =
    delta > 0
      ? 'bg-warning/15 text-warning'
      : delta < 0
        ? 'bg-success/15 text-success'
        : 'bg-secondary text-muted-foreground'

  const deltaLabel =
    delta > 0
      ? t('dashboard.kpi.backlogUp', { count: delta })
      : delta < 0
        ? t('dashboard.kpi.backlogDown', { count: Math.abs(delta) })
        : t('dashboard.kpi.backlogFlat')

  const tooltip = t('dashboard.tooltips.periodFlow', {
    start: current.range.startDateStr,
    end: current.range.endDateStr,
  })

  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-2 rounded-xl border border-border bg-card p-3.5 text-left',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t('dashboard.kpi.periodFlow')}
          </span>
          <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {t(`dashboard.period.${period}`)}
          </span>
        </div>
        <span title={tooltip} aria-label={tooltip} className="shrink-0 text-muted-foreground">
          <Info className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => onClickTab('created')}
          className="rounded-lg border border-transparent px-1.5 py-1 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block text-[10px] text-muted-foreground">{t('dashboard.kpi.createdLabel')}</span>
          <span className="block text-lg font-semibold leading-tight text-foreground tabular-nums">
            {created}
          </span>
          <span className="block text-[10px] text-muted-foreground tabular-nums">
            {formatSignedDiff(createdDiff)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onClickTab('completed')}
          className="rounded-lg border border-transparent px-1.5 py-1 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block text-[10px] text-muted-foreground">{t('dashboard.kpi.completedLabel')}</span>
          <span className="block text-lg font-semibold leading-tight text-success tabular-nums">
            {completed}
          </span>
          <span className="block text-[10px] text-muted-foreground tabular-nums">
            {formatSignedDiff(completedDiff)}
          </span>
        </button>

        <div className="px-1.5 py-1 text-right">
          <span className="block text-[10px] text-muted-foreground">{t('dashboard.kpi.clearanceLabel')}</span>
          <span className="block text-lg font-semibold leading-tight text-primary tabular-nums">
            {clearanceRate != null ? `${clearanceRate}%` : '—'}
          </span>
          <span className="block text-[10px] text-muted-foreground tabular-nums">
            {t('dashboard.kpi.prevDeltaShort', { diff: formatSignedDiff(prevDelta) })}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
              deltaTone,
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : delta < 0 ? (
              <ArrowDownRight className="size-3" aria-hidden="true" />
            ) : (
              <Minus className="size-3" aria-hidden="true" />
            )}
            <span>{deltaLabel}</span>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${barPct}%` }} />
        </div>
      </div>
    </div>
  )
}
