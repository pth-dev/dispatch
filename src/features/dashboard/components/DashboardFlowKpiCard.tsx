import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/cn'
import type { PeriodFlowComparison } from '../utils/dashboard-charts'
import type { DashboardPeriod } from '../utils/dashboard-domain'

type DashboardFlowKpiCardProps = {
  period: DashboardPeriod
  comparison: PeriodFlowComparison
  onClickTab: (tab: 'created' | 'completed') => void
  className?: string
}

type FlowStatButtonProps = {
  label: string
  value: number
  diff: number
  onClick: () => void
  className?: string
}

function formatSignedDiff(diff: number): string {
  return diff > 0 ? `+${diff}` : `${diff}`
}

function FlowStatButton({ label, value, diff, onClick, className }: FlowStatButtonProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-secondary/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span className="block text-[10px] leading-tight text-muted-foreground truncate">{label}</span>
      <span className="mt-0.5 block text-xl xl:text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground tabular-nums truncate">
        {formatSignedDiff(diff)}
      </span>
    </button>
  )
}

export function DashboardFlowKpiCard({
  period,
  comparison,
  onClickTab,
  className,
}: DashboardFlowKpiCardProps): ReactNode {
  const { t } = useTranslation()
  const { current, previous, createdDiff, completedDiff, clearanceRate } = comparison
  const created = current.createdTasks.length
  const completed = current.completedTasks.length
  const delta = current.backlogDelta
  const barPct =
    created > 0 ? Math.min(100, Math.round((completed / created) * 100)) : completed > 0 ? 100 : 0
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
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus

  return (
    <div className={cn('flex flex-col rounded-xl border border-border bg-card p-3 text-left', className)}>
      <div className="flex min-h-8 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className="truncate text-xs font-medium text-muted-foreground leading-4"
            title={t('dashboard.kpi.periodFlow')}
          >
            {t('dashboard.kpi.periodFlow')}
          </span>
          <span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary">
            {t(`dashboard.period.${period}`)}
          </span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('dashboard.kpi.periodFlow')}
              title={tooltip}
              className="-m-1 inline-flex shrink-0 items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <Info className="size-3.5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2.5 text-xs leading-relaxed">
            {tooltip}
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-1.5 grid flex-1 grid-cols-3 items-center gap-1.5">
        <FlowStatButton
          label={t('dashboard.kpi.createdLabel')}
          value={created}
          diff={createdDiff}
          onClick={() => onClickTab('created')}
          className="-ml-1.5"
        />
        <FlowStatButton
          label={t('dashboard.kpi.completedLabel')}
          value={completed}
          diff={completedDiff}
          onClick={() => onClickTab('completed')}
        />
        <div className="pl-1.5 py-0.5 text-right">
          <span className="block text-[10px] leading-tight text-muted-foreground truncate">
            {t('dashboard.kpi.clearanceLabel')}
          </span>
          <span className="mt-0.5 block text-xl xl:text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {clearanceRate != null ? `${clearanceRate}%` : '—'}
          </span>
          <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground tabular-nums truncate">
            {t('dashboard.kpi.prevDeltaShort', { diff: formatSignedDiff(previous.backlogDelta) })}
          </span>
        </div>
      </div>

      <div className="mt-1.5 flex min-h-4 items-center gap-2.5">
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 text-[11px] font-medium leading-4 tabular-nums',
            delta > 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          <DeltaIcon className="size-3" aria-hidden="true" />
          <span>{deltaLabel}</span>
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
          <div className="h-full rounded-full bg-foreground/70 transition-all" style={{ width: `${barPct}%` }} />
        </div>
      </div>
    </div>
  )
}
