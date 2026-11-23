import { AlertCircle, CalendarClock, Clock, FolderOpen, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MetricCard, type MetricCardTone } from '@/components/ui/metric-card'
import { cn } from '@/utils/cn'
import type {
  DashboardPeriod,
  DashboardScopeMode,
  PeriodFlowStats,
  Response1hStats,
  SnapshotMetrics,
} from '../utils/dashboard-domain'

interface DashboardKpiRowProps {
  scopeMode: DashboardScopeMode
  onScopeModeChange: (mode: DashboardScopeMode) => void
  period: DashboardPeriod
  onPeriodChange: (period: DashboardPeriod) => void
  snapshot: SnapshotMetrics
  periodFlow: PeriodFlowStats
  response1h: Response1hStats
  onClickOpen: () => void
  onClickOverdue: () => void
  onClickDueToday: () => void
  onClickPeriod: () => void
  onClickResponse1h: () => void
}

const PERIOD_OPTIONS: readonly DashboardPeriod[] = ['week', 'month', 'quarter', 'year']

function responseTone(rate: number | null): MetricCardTone {
  if (rate == null) return 'default'
  if (rate >= 80) return 'success'
  if (rate >= 50) return 'warning'
  return 'destructive'
}

export function DashboardKpiRow({
  scopeMode,
  onScopeModeChange,
  period,
  onPeriodChange,
  snapshot,
  periodFlow,
  response1h,
  onClickOpen,
  onClickOverdue,
  onClickDueToday,
  onClickPeriod,
  onClickResponse1h,
}: DashboardKpiRowProps) {
  const { t } = useTranslation()

  const delta = periodFlow.backlogDelta
  const deltaText =
    delta > 0
      ? t('dashboard.kpi.backlogUp', { count: delta })
      : delta < 0
        ? t('dashboard.kpi.backlogDown', { count: Math.abs(delta) })
        : t('dashboard.kpi.backlogFlat')

  const periodTone: MetricCardTone = delta > 0 ? 'warning' : delta < 0 ? 'success' : 'primary'

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
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`dashboard.period.${opt}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard
          label={t('dashboard.kpi.open')}
          value={snapshot.open}
          subtext={t('dashboard.kpi.openSub', {
            paused: snapshot.paused,
            total: snapshot.total,
          })}
          tone="primary"
          icon={<FolderOpen className="size-4" />}
          onClick={onClickOpen}
        />

        <MetricCard
          label={t('dashboard.kpi.overdue')}
          value={snapshot.overdue}
          subtext={
            snapshot.ontimeRate != null
              ? t('dashboard.kpi.ontimeSub', { rate: snapshot.ontimeRate })
              : t('dashboard.kpi.noCompleted')
          }
          tone={snapshot.overdue > 0 ? 'destructive' : 'success'}
          icon={<AlertCircle className="size-4" />}
          onClick={onClickOverdue}
        />

        <MetricCard
          label={t('dashboard.kpi.dueToday')}
          value={snapshot.dueToday}
          subtext={t('dashboard.kpi.completedSub', {
            done: snapshot.completed,
            late: snapshot.late,
          })}
          tone={snapshot.dueToday > 0 ? 'warning' : 'default'}
          icon={<CalendarClock className="size-4" />}
          onClick={onClickDueToday}
        />

        <MetricCard
          label={t('dashboard.kpi.periodFlow')}
          value={`${periodFlow.createdTasks.length} / ${periodFlow.completedTasks.length}`}
          subtext={deltaText}
          tone={periodTone}
          icon={<Clock className="size-4" />}
          onClick={onClickPeriod}
        />

        <MetricCard
          label={t('dashboard.kpi.response1h')}
          value={response1h.passRate != null ? `${response1h.passRate}%` : '—'}
          subtext={t('dashboard.kpi.response1hSub', {
            pass: response1h.passTasks.length,
            total: response1h.respondedCount,
          })}
          tone={responseTone(response1h.passRate)}
          icon={<Timer className="size-4" />}
          onClick={onClickResponse1h}
          className="col-span-2 lg:col-span-1"
        />
      </div>
    </section>
  )
}
