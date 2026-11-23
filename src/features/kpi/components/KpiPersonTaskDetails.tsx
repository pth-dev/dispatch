import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { APP_ROUTES } from '@/constants/app-routes'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import {
  deriveTaskStatus,
  isRecurringTask,
  isTaskPaused,
  parseLocalDateTime,
} from '@/utils/task-domain'
import { formatShortDateTime } from '../utils/kpi-export'
import {
  getKpiBasisAt,
  getKpiTaskPoints,
  getTaskFinalDueInfo,
  type KpiBasis,
  type PeopleKpiRow,
} from '../utils/kpi-people-domain'

export interface KpiPersonTaskDetailsProps {
  row: PeopleKpiRow
  taskMap: ReadonlyMap<string, RawTask>
  basis: KpiBasis
  forPrint?: boolean
}

function renderTaskStatusBadge(task: RawTask, t: (key: string) => string) {
  if (isTaskPaused(task)) {
    return (
      <Badge variant="outline" className="border-border bg-secondary text-muted-foreground">
        {t('kpi.taskState.paused')}
      </Badge>
    )
  }
  const st = deriveTaskStatus(task)
  if (st === 'completed_ontime') {
    return (
      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
        {t('kpi.taskState.ontime')}
      </Badge>
    )
  }
  if (st === 'late_completed') {
    return (
      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
        {t('kpi.taskState.late')}
      </Badge>
    )
  }
  if (st === 'delayed_pending') {
    return (
      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
        {t('kpi.taskState.overdue')}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-primary/30 bg-primary-soft/60 text-primary">
      {t('kpi.taskState.progress')}
    </Badge>
  )
}

export function KpiPersonTaskDetails({
  row,
  taskMap,
  basis,
  forPrint = false,
}: KpiPersonTaskDetailsProps) {
  const { t } = useTranslation()
  const keys = [...row.taskKeys, ...row.pausedKeys]
  const tasks = keys
    .map((k) => taskMap.get(k))
    .filter((item): item is RawTask => Boolean(item))

  if (tasks.length === 0) {
    return (
      <p className="py-2 text-xs text-muted-foreground">{t('kpi.detail.empty')}</p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-2.5 py-2 font-medium">#</th>
            <th className="px-2.5 py-2 font-medium">{t('kpi.detail.title')}</th>
            <th className="px-2.5 py-2 font-medium">{t('kpi.detail.created')}</th>
            <th className="px-2.5 py-2 font-medium">{t('kpi.detail.due')}</th>
            <th className="px-2.5 py-2 font-medium">{t('kpi.detail.finalDue')}</th>
            <th className="px-2.5 py-2 font-medium">{t('kpi.detail.finish')}</th>
            <th className="px-2.5 py-2 font-medium">{t('kpi.detail.basisDate')}</th>
            <th className="px-2.5 py-2 text-right font-medium">{t('kpi.detail.progress')}</th>
            <th className="px-2.5 py-2 font-medium">{t('kpi.detail.status')}</th>
            <th className="px-2.5 py-2 text-right font-medium">{t('kpi.detail.points')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task, idx) => {
            const rec = isRecurringTask({ recur_type: task.recur_type ?? 'once' })
            const finalDue = getTaskFinalDueInfo(task)
            const basisAt = getKpiBasisAt(task, basis)
            const pts = getKpiTaskPoints(task)
            return (
              <tr key={`${task.id}-${task.cycle_date ?? idx}`} className="hover:bg-muted/30">
                <td className="px-2.5 py-2 font-semibold tabular-nums">
                  {forPrint ? (
                    <span>#{task.id}</span>
                  ) : (
                    <Link
                      to={APP_ROUTES.TASK_DETAIL(task.id)}
                      className="text-primary hover:underline"
                    >
                      #{task.id}
                    </Link>
                  )}
                </td>
                <td className="px-2.5 py-2 font-medium text-foreground">
                  <span>{task.title}</span>
                  {rec && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px]">
                      {t('kpi.detail.cycleTag', {
                        no: task.cycle_no || 1,
                        date: task.cycle_date || task.recur_cycle_date || '',
                      })}
                    </Badge>
                  )}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 tabular-nums text-muted-foreground">
                  {formatShortDateTime(parseLocalDateTime(task.kpi_at || task.createdAt)) || '-'}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 tabular-nums text-muted-foreground">
                  {formatShortDateTime(parseLocalDateTime(task.due_date)) || '-'}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 tabular-nums">
                  {finalDue.isUnlimited ? (
                    <span className="font-medium text-primary">{t('kpi.detail.unlimited')}</span>
                  ) : finalDue.displayRaw ? (
                    <span
                      className={cn(
                        'font-medium',
                        finalDue.isOverdue ? 'text-destructive' : 'text-foreground',
                      )}
                    >
                      {formatShortDateTime(finalDue.date) || finalDue.displayRaw}
                      {finalDue.isOverdue ? ` (${t('kpi.detail.overdueTag')})` : ''}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 tabular-nums text-muted-foreground">
                  {formatShortDateTime(parseLocalDateTime(task.finish_date)) || '-'}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 font-medium tabular-nums text-primary">
                  {formatShortDateTime(basisAt) || '-'}
                </td>
                <td className="px-2.5 py-2 text-right font-semibold tabular-nums">
                  {task.progress}%
                </td>
                <td className="whitespace-nowrap px-2.5 py-2">
                  {renderTaskStatusBadge(task, t)}
                </td>
                <td className="px-2.5 py-2 text-right font-semibold tabular-nums text-primary">
                  {pts === null ? '-' : pts}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
