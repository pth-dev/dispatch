import type * as React from 'react'
import type { TFunction } from 'i18next'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
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

export type KpiPersonTaskDetailsProps = {
  row: PeopleKpiRow
  taskMap: ReadonlyMap<string, RawTask>
  basis: KpiBasis
  forPrint?: boolean
}

function renderTaskStatusBadge(task: RawTask, t: (key: string) => string): React.ReactElement {
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

function buildPersonTaskColumns(
  basis: KpiBasis,
  forPrint: boolean,
  t: TFunction,
): ColumnDef<RawTask>[] {
  return [
    {
      id: 'id',
      header: '#',
      meta: { cellClassName: 'font-semibold tabular-nums' },
      cell: ({ row }) =>
        forPrint ? (
          <span>#{row.original.id}</span>
        ) : (
          <Link to={APP_ROUTES.TASK_DETAIL(row.original.id)} className="text-primary hover:underline">
            #{row.original.id}
          </Link>
        ),
    },
    {
      id: 'title',
      header: t('kpi.detail.title'),
      meta: { cellClassName: 'font-medium text-foreground' },
      cell: ({ row }) => {
        const task = row.original
        const rec = isRecurringTask({ recur_type: task.recur_type ?? 'once' })
        return (
          <>
            <span>{task.title}</span>
            {rec && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {t('kpi.detail.cycleTag', {
                  no: task.cycle_no || 1,
                  date: task.cycle_date || task.recur_cycle_date || '',
                })}
              </Badge>
            )}
          </>
        )
      },
    },
    {
      id: 'created',
      header: t('kpi.detail.created'),
      meta: { cellClassName: 'whitespace-nowrap tabular-nums text-muted-foreground' },
      cell: ({ row }) =>
        formatShortDateTime(parseLocalDateTime(row.original.kpi_at || row.original.createdAt)) ||
        '-',
    },
    {
      id: 'due',
      header: t('kpi.detail.due'),
      meta: { cellClassName: 'whitespace-nowrap tabular-nums text-muted-foreground' },
      cell: ({ row }) => formatShortDateTime(parseLocalDateTime(row.original.due_date)) || '-',
    },
    {
      id: 'finalDue',
      header: t('kpi.detail.finalDue'),
      meta: { cellClassName: 'whitespace-nowrap tabular-nums' },
      cell: ({ row }) => {
        const finalDue = getTaskFinalDueInfo(row.original)
        if (finalDue.isUnlimited) {
          return <span className="font-medium text-primary">{t('kpi.detail.unlimited')}</span>
        }
        if (finalDue.displayRaw) {
          return (
            <span
              className={cn(
                'font-medium',
                finalDue.isOverdue ? 'text-destructive' : 'text-foreground',
              )}
            >
              {formatShortDateTime(finalDue.date) || finalDue.displayRaw}
              {finalDue.isOverdue ? ` (${t('kpi.detail.overdueTag')})` : ''}
            </span>
          )
        }
        return '-'
      },
    },
    {
      id: 'finish',
      header: t('kpi.detail.finish'),
      meta: { cellClassName: 'whitespace-nowrap tabular-nums text-muted-foreground' },
      cell: ({ row }) => formatShortDateTime(parseLocalDateTime(row.original.finish_date)) || '-',
    },
    {
      id: 'basisDate',
      header: t('kpi.detail.basisDate'),
      meta: { cellClassName: 'whitespace-nowrap font-medium tabular-nums text-primary' },
      cell: ({ row }) => formatShortDateTime(getKpiBasisAt(row.original, basis)) || '-',
    },
    {
      id: 'progress',
      header: t('kpi.detail.progress'),
      meta: { align: 'right', cellClassName: 'font-semibold tabular-nums' },
      cell: ({ row }) => `${row.original.progress}%`,
    },
    {
      id: 'status',
      header: t('kpi.detail.status'),
      meta: { cellClassName: 'whitespace-nowrap' },
      cell: ({ row }) => renderTaskStatusBadge(row.original, t),
    },
    {
      id: 'points',
      header: t('kpi.detail.points'),
      meta: { align: 'right', cellClassName: 'font-semibold tabular-nums text-primary' },
      cell: ({ row }) => {
        const pts = getKpiTaskPoints(row.original)
        return pts === null ? '-' : pts
      },
    },
  ]
}

export function KpiPersonTaskDetails({
  row,
  taskMap,
  basis,
  forPrint = false,
}: KpiPersonTaskDetailsProps): React.ReactElement {
  const { t } = useTranslation()
  const keys = [...row.taskKeys, ...row.pausedKeys]
  const tasks = keys
    .map((k) => taskMap.get(k))
    .filter((item): item is RawTask => Boolean(item))

  if (tasks.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">{t('kpi.detail.empty')}</p>
  }

  const columns = buildPersonTaskColumns(basis, forPrint, t)

  return (
    <DataTable
      variant="embedded"
      data={tasks}
      columns={columns}
      keyExtractor={(task, idx) => `${task.id}-${task.cycle_date ?? idx}`}
      containerClassName="rounded-lg border border-border bg-card"
      headerClassName="bg-muted/50 text-xs"
      rowClassName={() => 'hover:bg-muted/30'}
    />
  )
}
