import { useTranslation } from 'react-i18next'
import { MetricCard, type MetricCardTone } from '@/components/ui/metric-card'
import { cn } from '@/utils/cn'
import type { PeriodFlowComparison } from '../utils/dashboard-charts'
import type {
  DashboardPeriod,
  DashboardScopeMode,
  Response1hStats,
  SnapshotMetrics,
} from '../utils/dashboard-domain'
import { DashboardFlowKpiCard } from './DashboardFlowKpiCard'

interface DashboardKpiRowProps {
  scopeMode: DashboardScopeMode
  onScopeModeChange: (mode: DashboardScopeMode) => void
  period: DashboardPeriod
  onPeriodChange: (period: DashboardPeriod) => void
  snapshot: SnapshotMetrics
  periodComparison: PeriodFlowComparison
  response1h: Response1hStats
  onClickOpen: () => void
  onClickOverdue: () => void
  onClickDueToday: () => void
  onClickPeriodTab: (tab: 'created' | 'completed') => void
  onClickResponse1h: () => void
}

const PERIOD_OPTIONS: readonly DashboardPeriod[] = ['week', 'month', 'quarter', 'year']

function responseTone(rate: number | null): MetricCardTone {
  if (rate != null && rate < 50) return 'destructive'
  return 'default'
}

export function DashboardKpiRow({
  scopeMode,
  onScopeModeChange,
  period,
  onPeriodChange,
  snapshot,
  periodComparison,
  response1h,
  onClickOpen,
  onClickOverdue,
  onClickDueToday,
  onClickPeriodTab,
  onClickResponse1h,
}: DashboardKpiRowProps) {
  const { t } = useTranslation()
  const periodFlow = periodComparison.current

  const liveBadge = (
    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {t('dashboard.scopeBadge.live')}
    </span>
  )
  const periodBadge = (
    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {t(`dashboard.period.${period}`)}
    </span>
  )

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label={t('dashboard.scope.label')}
          className="inline-flex w-fit rounded-lg border border-border bg-card p-1"
        >
          {(['all', 'mine'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={scopeMode === mode}
              onClick={() => onScopeModeChange(mode)}
              className={cn(
                'min-h-11 lg:min-h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                scopeMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t(`dashboard.scope.${mode}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {periodFlow.range.startDateStr} ~ {periodFlow.range.endDateStr}
          </span>
          <div
            role="group"
            aria-label={t('dashboard.period.label')}
            className="inline-flex rounded-lg border border-border bg-card p-1"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={period === opt}
                onClick={() => onPeriodChange(opt)}
                className={cn(
                  'min-h-11 lg:min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  period === opt
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`dashboard.period.${opt}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <MetricCard
          label={t('dashboard.kpi.open')}
          badge={liveBadge}
          tooltip={t('dashboard.tooltips.open')}
          value={snapshot.open}
          subtext={t('dashboard.kpi.openSub', {
            paused: snapshot.paused,
            total: snapshot.total,
          })}
          tone="default"
          onClick={onClickOpen}
        />

        <MetricCard
          label={t('dashboard.kpi.overdue')}
          badge={liveBadge}
          tooltip={t('dashboard.tooltips.overdue')}
          value={snapshot.overdue}
          subtext={
            snapshot.ontimeRate != null
              ? t('dashboard.kpi.ontimeSubWithBase', {
                  rate: snapshot.ontimeRate,
                  done: snapshot.completed,
                })
              : t('dashboard.kpi.noCompleted')
          }
          tone={snapshot.overdue > 0 ? 'destructive' : 'default'}
          onClick={onClickOverdue}
        />

        <MetricCard
          label={t('dashboard.kpi.dueToday')}
          badge={liveBadge}
          tooltip={t('dashboard.tooltips.dueToday')}
          value={snapshot.dueToday}
          subtext={t('dashboard.kpi.completedSub', {
            done: snapshot.completed,
            late: snapshot.late,
          })}
          tone="default"
          onClick={onClickDueToday}
        />

        <DashboardFlowKpiCard
          period={period}
          comparison={periodComparison}
          onClickTab={onClickPeriodTab}
          className="col-span-2 order-5 lg:order-4 lg:col-span-2"
        />

        <MetricCard
          label={t('dashboard.kpi.response1h')}
          badge={periodBadge}
          tooltip={t('dashboard.tooltips.response1h')}
          value={response1h.passRate != null ? `${response1h.passRate}%` : '—'}
          subtext={t('dashboard.kpi.response1hSubFull', {
            pass: response1h.passTasks.length,
            total: response1h.respondedCount,
            none: response1h.noResponseTasks.length,
          })}
          tone={responseTone(response1h.passRate)}
          onClick={onClickResponse1h}
          className="order-4 lg:order-5 lg:col-span-1"
        />
      </div>
    </section>
  )
}
