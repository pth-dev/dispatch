import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@/components/ui/data-table'
import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import type { RawTask } from '@/schemas/task'
import { APP_ROUTES } from '@/constants/app-routes'
import { parseReqDepts, parseSites } from '@/utils/task-domain'
import { getSiteDisplayName } from '../api/meta'
import { useMetaSites } from '../api/queries'
import {
  TaskActionCell,
  TaskLastReportCell,
  TaskLevelCell,
  TaskStatusCell,
  TaskTitleCell,
  TaskWorkItemsCell,
} from '../components/TaskTableCells'
import { formatTaskDueDate } from '../utils/task-display'
import { useDeptNameResolver } from './use-dept-name-resolver'
import { useUserDisplayResolver } from './use-user-display-resolver'
import type { TaskColumnId } from './use-task-view-prefs'

export { formatTaskDueDate }

const DEFAULT_WIDTH_PERCENT: Partial<Record<TaskColumnId, string>> = {
  stt: '4%',
  code: '7%',
  title: '28%',
  department: '11%',
  assignee: '15%',
  dueDate: '9%',
  status: '18%',
  actions: '8%',
}

const COLUMN_MIN_WIDTH_PX: Record<TaskColumnId, string> = {
  stt: '56px',
  code: '88px',
  title: '240px',
  department: '140px',
  assignee: '140px',
  dueDate: '108px',
  status: '148px',
  lastReport: '200px',
  taskType: '140px',
  workItems: '160px',
  reqDept: '140px',
  site: '120px',
  level: '100px',
  reporter: '140px',
  actions: '64px',
}

const COLUMN_MAX_WIDTH_PX: Partial<Record<TaskColumnId, string>> = {
  title: '360px',
  department: '200px',
  assignee: '200px',
  lastReport: '320px',
  taskType: '200px',
  workItems: '240px',
  reqDept: '200px',
  site: '180px',
  reporter: '200px',
}

type UseTaskColumnsOptions = {
  visibleColumnIds?: readonly TaskColumnId[]
  useFixedWidths?: boolean
  lessonHitsByTaskId?: ReadonlyMap<number, LessonMarqueeHit[]>
}

export function useTaskColumns(
  page: number,
  pageSize: number,
  options?: UseTaskColumnsOptions,
): ColumnDef<RawTask>[] {
  const { t, i18n } = useTranslation()
  const resolveDeptName = useDeptNameResolver()
  const { resolveUser, resolveAssignees } = useUserDisplayResolver()
  const { data: metaSites } = useMetaSites()

  const siteCatalog = metaSites?.allSites ?? metaSites?.sites ?? []

  const resolveSiteLabel = (code: string): string => {
    const match = siteCatalog.find((s) => s.value.toUpperCase() === code.toUpperCase())
    return match ? getSiteDisplayName(match, i18n.language) : code
  }

  const useFixedWidths = options?.useFixedWidths ?? true
  const sizingFor = (id: TaskColumnId) =>
    useFixedWidths
      ? { width: DEFAULT_WIDTH_PERCENT[id] }
      : { minWidth: COLUMN_MIN_WIDTH_PX[id], maxWidth: COLUMN_MAX_WIDTH_PX[id] }

  const orderedIds: readonly TaskColumnId[] = options?.visibleColumnIds ?? [
    'stt',
    'code',
    'title',
    'department',
    'assignee',
    'dueDate',
    'status',
    'actions',
  ]

  const allColumns: Record<TaskColumnId, ColumnDef<RawTask>> = {
    stt: {
      id: 'stt',
      header: t('tasks.columns.stt'),
      meta: {
        ...sizingFor('stt'),
        sticky: orderedIds[0] === 'stt' ? 'left' : undefined,
        align: 'center',
      },
      cell: ({ row }) => {
        const serial = (page - 1) * pageSize + row.index + 1
        return (
          <span className="text-xs text-muted-foreground">
            {serial.toString().padStart(2, '0')}
          </span>
        )
      },
    },
    code: {
      id: 'code',
      header: t('tasks.columns.code'),
      meta: sizingFor('code'),
      cell: ({ row }) => (
        <Link
          to={APP_ROUTES.TASK_DETAIL(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-primary hover:underline hover:text-primary-hover"
        >
          #{row.original.id}
        </Link>
      ),
    },
    title: {
      id: 'title',
      header: t('tasks.columns.title'),
      meta: sizingFor('title'),
      cell: ({ row }) => (
        <TaskTitleCell
          task={row.original}
          lessonHits={options?.lessonHitsByTaskId?.get(row.original.id) ?? []}
          urgentLabel={t('status.urgent')}
          confidentialLabel={t('tasks.confidential.label')}
        />
      ),
    },
    department: {
      id: 'department',
      header: t('tasks.columns.department'),
      meta: sizingFor('department'),
      cell: ({ row }) => {
        const deptLabel = resolveDeptName(row.original.assigned_unit)
        return (
          <span className="truncate text-muted-foreground" title={deptLabel}>
            {deptLabel}
          </span>
        )
      },
    },
    assignee: {
      id: 'assignee',
      header: t('tasks.columns.assignee'),
      meta: sizingFor('assignee'),
      cell: ({ row }) => {
        const label = resolveAssignees(row.original.assign_person) || '-'
        return (
          <span className="truncate text-foreground" title={label}>
            {label}
          </span>
        )
      },
    },
    dueDate: {
      id: 'dueDate',
      header: t('tasks.columns.dueDate'),
      meta: sizingFor('dueDate'),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatTaskDueDate(row.original.due_date)}
        </span>
      ),
    },
    status: {
      id: 'status',
      header: t('tasks.columns.status'),
      meta: sizingFor('status'),
      cell: ({ row }) => <TaskStatusCell task={row.original} />,
    },
    lastReport: {
      id: 'lastReport',
      header: t('tasks.columns.lastReport'),
      meta: sizingFor('lastReport'),
      cell: ({ row }) => <TaskLastReportCell task={row.original} />,
    },
    taskType: {
      id: 'taskType',
      header: t('tasks.columns.taskType'),
      meta: sizingFor('taskType'),
      cell: ({ row }) => {
        const label = row.original.task_type?.trim() || '-'
        return (
          <span className="block truncate text-muted-foreground" title={label}>
            {label}
          </span>
        )
      },
    },
    workItems: {
      id: 'workItems',
      header: t('tasks.columns.workItems'),
      meta: sizingFor('workItems'),
      cell: ({ row }) => (
        <TaskWorkItemsCell
          task={row.original}
          formatCount={(count) => t('tasks.card.workItemsCount', { count })}
        />
      ),
    },
    reqDept: {
      id: 'reqDept',
      header: t('tasks.columns.reqDept'),
      meta: sizingFor('reqDept'),
      cell: ({ row }) => {
        const list = parseReqDepts(row.original.req_depts, row.original.req_dept).map(
          resolveDeptName,
        )
        const label = list.length > 0 ? list.join(', ') : '-'
        return (
          <span className="block truncate text-muted-foreground" title={label}>
            {label}
          </span>
        )
      },
    },
    site: {
      id: 'site',
      header: t('tasks.columns.site'),
      meta: sizingFor('site'),
      cell: ({ row }) => {
        const list = parseSites(row.original.site).map(resolveSiteLabel)
        const label = list.length > 0 ? list.join(', ') : '-'
        return (
          <span className="block truncate text-muted-foreground" title={label}>
            {label}
          </span>
        )
      },
    },
    level: {
      id: 'level',
      header: t('tasks.columns.level'),
      meta: sizingFor('level'),
      cell: ({ row }) => (
        <TaskLevelCell
          level={row.original.level}
          labels={{
            critical: t('tasks.filter.levelCritical'),
            urgent: t('tasks.filter.levelUrgent'),
            normal: t('tasks.filter.levelNormal'),
          }}
        />
      ),
    },
    reporter: {
      id: 'reporter',
      header: t('tasks.columns.reporter'),
      meta: sizingFor('reporter'),
      cell: ({ row }) => {
        const label = resolveUser(row.original.reporter, row.original.reporter_name) || '-'
        return (
          <span className="block truncate text-muted-foreground" title={label}>
            {label}
          </span>
        )
      },
    },
    actions: {
      id: 'actions',
      header: t('tasks.columns.actions'),
      meta: {
        ...sizingFor('actions'),
        align: 'right',
      },
      cell: ({ row }) => (
        <TaskActionCell
          taskId={row.original.id}
          ariaLabel={t('tasks.actions.view', { id: String(row.original.id) })}
        />
      ),
    },
  }

  return orderedIds.map((id) => allColumns[id])
}
