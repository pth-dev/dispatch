import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Eye, Lock } from 'lucide-react'
import type { ColumnDef } from '@/components/ui/data-table'
import { StatusText } from '@/components/ui/status-text'
import { Button } from '@/components/ui/button'
import type { RawTask } from '@/schemas/task'
import { APP_ROUTES } from '@/constants/app-routes'
import {
  deriveTaskStatus,
  isTaskPaused,
  isUrgentLevel,
  parseLocalDateTime,
  sameDept,
} from '@/utils/task-domain'
import { getDeptDisplayName } from '../api/meta'
import { useMetaDepts } from '../api/queries'

export function formatTaskDueDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const dt = parseLocalDateTime(dateStr)
  if (!dt) return dateStr.slice(0, 10)
  const day = String(dt.getDate()).padStart(2, '0')
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const year = dt.getFullYear()
  return `${day}/${month}/${year}`
}

export function useTaskColumns(page: number, pageSize: number): ColumnDef<RawTask>[] {
  const { t, i18n } = useTranslation()
  const { data: metaDepts } = useMetaDepts()

  const resolveDeptName = (rawDept: string | null | undefined): string => {
    if (!rawDept) return '-'
    const catalog = metaDepts?.allDepts ?? metaDepts?.depts ?? []
    const match = catalog.find((d) => sameDept(d.value, rawDept))
    return match ? getDeptDisplayName(match, i18n.language) : rawDept
  }

  return [
    {
      id: 'stt',
      header: t('tasks.columns.stt'),
      width: '5%',
      align: 'center',
      cell: (_, index) => {
        const serial = (page - 1) * pageSize + index + 1
        return (
          <span className="text-xs text-muted-foreground">
            {serial.toString().padStart(2, '0')}
          </span>
        )
      },
    },
    {
      id: 'code',
      header: t('tasks.columns.code'),
      width: '9%',
      cell: (task) => (
        <Link
          to={APP_ROUTES.TASK_DETAIL(task.id)}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-primary hover:underline hover:text-primary-hover"
        >
          #{task.id}
        </Link>
      ),
    },
    {
      id: 'title',
      header: t('tasks.columns.title'),
      width: '28%',
      cell: (task) => (
        <div className="flex min-w-0 items-center gap-1.5">
          {isUrgentLevel(task.level) && (
            <span className="inline-flex shrink-0 items-center" title={t('status.urgent')}>
              <span className="size-1.5 rounded-full bg-status-urgent" aria-hidden="true" />
              <span className="sr-only">{t('status.urgent')}</span>
            </span>
          )}
          {task.confidential > 0 && (
            <Lock
              className="size-3.5 shrink-0 text-warning"
              aria-label={t('tasks.confidential.label')}
            />
          )}
          <span className="truncate font-medium text-foreground" title={task.title}>
            {task.title}
          </span>
        </div>
      ),
    },
    {
      id: 'department',
      header: t('tasks.columns.department'),
      width: '14%',
      cell: (task) => {
        const deptLabel = resolveDeptName(task.assigned_unit)
        return (
          <span className="truncate text-muted-foreground" title={deptLabel}>
            {deptLabel}
          </span>
        )
      },
    },
    {
      id: 'assignee',
      header: t('tasks.columns.assignee'),
      width: '14%',
      cell: (task) => (
        <span className="truncate text-foreground" title={task.assign_person || '-'}>
          {task.assign_person || '-'}
        </span>
      ),
    },
    {
      id: 'dueDate',
      header: t('tasks.columns.dueDate'),
      width: '10%',
      cell: (task) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatTaskDueDate(task.due_date)}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('tasks.columns.status'),
      width: '14%',
      cell: (task) => {
        const derived = deriveTaskStatus(task)
        const paused = isTaskPaused(task)
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusText status={paused ? 'paused' : derived} />
            <span className="text-[11px] text-muted-foreground">{task.progress}%</span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: t('tasks.columns.actions'),
      width: '6%',
      align: 'right',
      cell: (task) => (
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
          aria-label={t('tasks.actions.view', { id: String(task.id) })}
        >
          <Link to={APP_ROUTES.TASK_DETAIL(task.id)}>
            <Eye className="size-4.5 text-muted-foreground" aria-hidden="true" />
          </Link>
        </Button>
      ),
    },
  ]
}
