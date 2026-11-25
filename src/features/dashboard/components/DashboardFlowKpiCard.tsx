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
  const barPct =
    created > 0 ? Math.min(100, Math.round((completed / created) * 100)) : completed > 0 ? 100 : 0

  const deltaTone = delta > 0 ? 'text-destructive' : 'text-muted-foreground'

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
        'flex flex-col rounded-xl border border-border bg-card p-3.5 text-left',
        className,
      )}
    >
      <div className="flex min-h-14 items-start justify-between gap-2">
        <div className="min-w-0 flex flex-col items-start gap-1">
          <span
            className="min-h-8 text-xs font-medium text-muted-foreground leading-snug line-clamp-2"
            title={t('dashboard.kpi.periodFlow')}
          >
            {t('dashboard.kpi.periodFlow')}
          </span>
          <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium leading-tight text-primary">
            {t(`dashboard.period.${period}`)}
          </span>
        </div>
        <span title={tooltip} aria-label={tooltip} className="shrink-0 text-muted-foreground">
          <Info className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-2 grid flex-1 grid-cols-3 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onClickTab('created')}
          className="rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block text-[10px] leading-tight text-muted-foreground truncate">
            {t('dashboard.kpi.createdLabel')}
          </span>
          <span className="mt-0.5 block text-xl xl:text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {created}
          </span>
          <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground tabular-nums truncate">
            {formatSignedDiff(createdDiff)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onClickTab('completed')}
          className="rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block text-[10px] leading-tight text-muted-foreground truncate">
            {t('dashboard.kpi.completedLabel')}
          </span>
          <span className="mt-0.5 block text-xl xl:text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {completed}
          </span>
          <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground tabular-nums truncate">
            {formatSignedDiff(completedDiff)}
          </span>
        </button>

        <div className="px-1.5 py-1 text-right">
          <span className="block text-[10px] leading-tight text-muted-foreground truncate">
            {t('dashboard.kpi.clearanceLabel')}
          </span>
          <span className="mt-0.5 block text-xl xl:text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {clearanceRate != null ? `${clearanceRate}%` : '—'}
          </span>
          <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground tabular-nums truncate">
            {t('dashboard.kpi.prevDeltaShort', { diff: formatSignedDiff(prevDelta) })}
          </span>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium tabular-nums', deltaTone)}>
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
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div className="h-full rounded-full bg-foreground/70 transition-all" style={{ width: `${barPct}%` }} />
        </div>
      </div>
    </div>
  )
}
