import * as React from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Eye } from 'lucide-react'
import type { ColumnDef } from '@/components/ui/data-table'
import { StatusText } from '@/components/ui/status-text'
import { Button } from '@/components/ui/button'
import type { Task } from '@/schemas/task'
import { APP_ROUTES } from '@/constants/app-routes'

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

export function useTaskColumns(page: number, pageSize: number): ColumnDef<Task>[] {
  const { t } = useTranslation()

  return React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: 'stt',
        header: t('tasks.columns.stt'),
        width: '5%',
        align: 'center',
        cell: (_, index) => {
          const serial = (page - 1) * pageSize + index + 1
          return (
            <span className="font-mono text-xs text-muted-foreground">
              {serial.toString().padStart(2, '0')}
            </span>
          )
        },
      },
      {
        id: 'code',
        header: t('tasks.columns.code'),
        width: '12%',
        cell: (task) => (
          <Link
            to={APP_ROUTES.TASK_DETAIL(task.id)}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-primary hover:underline hover:text-primary-hover"
          >
            {task.id}
          </Link>
        ),
      },
      {
        id: 'title',
        header: t('tasks.columns.title'),
        width: '27%',
        cell: (task) => (
          <div className="flex items-center gap-1.5 truncate">
            {task.urgent && (
              <span
                className="size-1.5 rounded-full bg-destructive shrink-0"
                title={t('status.urgent')}
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
        width: '15%',
        cell: (task) => (
          <span className="truncate text-muted-foreground" title={task.departmentName || task.department}>
            {task.departmentName || task.department}
          </span>
        ),
      },
      {
        id: 'assignee',
        header: t('tasks.columns.assignee'),
        width: '15%',
        cell: (task) => (
          <span className="truncate text-foreground" title={task.assignee}>
            {task.assignee}
          </span>
        ),
      },
      {
        id: 'dueDate',
        header: t('tasks.columns.dueDate'),
        width: '10%',
        cell: (task) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDateVN(task.dueDate)}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('tasks.columns.status'),
        width: '10%',
        cell: (task) => <StatusText status={task.status} />,
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
            aria-label={`View task ${task.id}`}
          >
            <Link to={APP_ROUTES.TASK_DETAIL(task.id)}>
              <Eye className="size-3.5 text-muted-foreground" />
            </Link>
          </Button>
        ),
      },
    ],
    [page, pageSize, t],
  )
}
