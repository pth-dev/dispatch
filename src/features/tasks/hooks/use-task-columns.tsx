import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Eye, Lock } from 'lucide-react'
import type { ColumnDef } from '@/components/ui/data-table'
import { LessonRuleBadge, type LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import { StatusText } from '@/components/ui/status-text'
import { Button } from '@/components/ui/button'
import type { RawTask } from '@/schemas/task'
import { APP_ROUTES } from '@/constants/app-routes'
import {
  deriveTaskStatus,
  getTaskLevelCode,
  isTaskPaused,
  isUrgentLevel,
  parseReqDepts,
  parseSites,
} from '@/utils/task-domain'
import { getSiteDisplayName } from '../api/meta'
import { useMetaSites } from '../api/queries'
import {
  formatTaskDueDate,
  getWorkItemsSummary,
  parseLastReportSummary,
} from '../utils/task-display'
import { useDeptNameResolver } from './use-dept-name-resolver'
import { useUserDisplayResolver } from './use-user-display-resolver'
import type { TaskColumnId } from './use-task-view-prefs'

export { formatTaskDueDate }

const DEFAULT_WIDTH_PERCENT: Partial<Record<TaskColumnId, string>> = {
  stt: '5%',
  code: '9%',
  title: '28%',
  department: '14%',
  assignee: '14%',
  dueDate: '10%',
  status: '14%',
  actions: '6%',
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
  const sizingFor = (
    id: TaskColumnId,
  ): Pick<ColumnDef<RawTask>, 'width' | 'minWidth' | 'maxWidth'> =>
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
      ...sizingFor('stt'),
      sticky: orderedIds[0] === 'stt' ? 'left' : undefined,
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
    code: {
      id: 'code',
      header: t('tasks.columns.code'),
      ...sizingFor('code'),
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
    title: {
      id: 'title',
      header: t('tasks.columns.title'),
      ...sizingFor('title'),
      cell: (task) => {
        const lessonHits = options?.lessonHitsByTaskId?.get(task.id) ?? []
        return (
          <div className="flex min-w-0 items-center gap-1.5">
            {isUrgentLevel(task.level) && (
              <span className="inline-flex shrink-0 items-center" title={t('status.urgent')}>
                <span className="size-1.5 rounded-full bg-status-urgent" aria-hidden="true" />
                <span className="sr-only">{t('status.urgent')}</span>
              </span>
            )}
            {task.confidential > 0 && (
              <span className="inline-flex shrink-0 items-center" title={t('tasks.confidential.label')}>
                <Lock className="size-3.5 text-warning" aria-hidden="true" />
                <span className="sr-only">{t('tasks.confidential.label')}</span>
              </span>
            )}
            <span className="min-w-0 truncate font-medium text-foreground" title={task.title}>
              {task.title}
            </span>
            {lessonHits.length > 0 && <LessonRuleBadge hits={lessonHits} />}
          </div>
        )
      },
    },
    department: {
      id: 'department',
      header: t('tasks.columns.department'),
      ...sizingFor('department'),
      cell: (task) => {
        const deptLabel = resolveDeptName(task.assigned_unit)
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
      ...sizingFor('assignee'),
      cell: (task) => {
        const label = resolveAssignees(task.assign_person) || '-'
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
      ...sizingFor('dueDate'),
      cell: (task) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatTaskDueDate(task.due_date)}
        </span>
      ),
    },
    status: {
      id: 'status',
      header: t('tasks.columns.status'),
      ...sizingFor('status'),
      cell: (task) => {
        const derived = deriveTaskStatus(task)
        const paused = isTaskPaused(task)
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusText status={paused ? 'paused' : derived} />
            <span className="text-xs text-muted-foreground">{task.progress}%</span>
          </div>
        )
      },
    },
    lastReport: {
      id: 'lastReport',
      header: t('tasks.columns.lastReport'),
      ...sizingFor('lastReport'),
      cell: (task) => {
        const summary = parseLastReportSummary(task)
        if (!summary) {
          return <span className="text-muted-foreground">-</span>
        }
        const tooltip = [summary.at, summary.who, summary.progress, summary.text]
          .filter(Boolean)
          .join(' • ')
        return (
          <span className="block truncate text-foreground" title={tooltip}>
            {summary.text || summary.at}
          </span>
        )
      },
    },
    taskType: {
      id: 'taskType',
      header: t('tasks.columns.taskType'),
      ...sizingFor('taskType'),
      cell: (task) => {
        const label = task.task_type?.trim() || '-'
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
      ...sizingFor('workItems'),
      cell: (task) => {
        const summary = getWorkItemsSummary(task)
        if (!summary) return <span className="text-muted-foreground">-</span>
        const label = t('tasks.card.workItemsCount', { count: summary.count })
        const detail = summary.firstTopic ? `${label} • ${summary.firstTopic}` : label
        return (
          <span className="block truncate text-foreground" title={detail}>
            {detail}
          </span>
        )
      },
    },
    reqDept: {
      id: 'reqDept',
      header: t('tasks.columns.reqDept'),
      ...sizingFor('reqDept'),
      cell: (task) => {
        const list = parseReqDepts(task.req_depts, task.req_dept).map(resolveDeptName)
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
      ...sizingFor('site'),
      cell: (task) => {
        const list = parseSites(task.site).map(resolveSiteLabel)
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
      ...sizingFor('level'),
      cell: (task) => {
        const code = getTaskLevelCode(task.level)
        const label =
          code === 'critical'
            ? t('tasks.filter.levelCritical')
            : code === 'urgent'
              ? t('tasks.filter.levelUrgent')
              : t('tasks.filter.levelNormal')
        const toneClass =
          code === 'critical'
            ? 'text-status-urgent font-semibold'
            : code === 'urgent'
              ? 'text-warning font-semibold'
              : 'text-muted-foreground'
        return <span className={toneClass}>{label}</span>
      },
    },
    reporter: {
      id: 'reporter',
      header: t('tasks.columns.reporter'),
      ...sizingFor('reporter'),
      cell: (task) => {
        const label = resolveUser(task.reporter, task.reporter_name) || '-'
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
      ...sizingFor('actions'),
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
  }

  return orderedIds.map((id) => allColumns[id])
}
