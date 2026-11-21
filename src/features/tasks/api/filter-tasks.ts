import type { SessionUser } from '@/schemas/auth'
import {
  EMPTY_SITE_FILTER,
  type RawTask,
  type TaskListParams,
  type TaskScopeCounts,
  type TaskSortMode,
} from '@/schemas/task'
import { isCrossViewer, isReaderOnly } from '@/utils/permissions'
import {
  deriveTaskStatus,
  getTaskLevelCode,
  isRecurringTask,
  isRecurNeedsReportToday,
  isTaskPaused,
  parseAssigneeList,
  parseLocalDateTime,
  parseReqDepts,
  parseSites,
  sameDept,
} from '@/utils/task-domain'

function matchesAssignee(task: RawTask, user: SessionUser | null): boolean {
  if (!user) return false
  const assignees = parseAssigneeList(task.assign_person)
  const uname = user.username.trim().toLowerCase()
  const fname = user.fullname.trim().toLowerCase()
  return assignees.some((a) => {
    const lower = a.trim().toLowerCase()
    return lower === uname || (fname.length > 0 && lower === fname)
  })
}

function matchesCreator(task: RawTask, user: SessionUser | null): boolean {
  if (!user) return false
  return task.reporter.trim().toLowerCase() === user.username.trim().toLowerCase()
}

function extractDateOnly(dt: string | null | undefined): string {
  if (!dt) return ''
  return dt.trim().slice(0, 10)
}

function levelRank(task: RawTask): number {
  const code = getTaskLevelCode(task.level)
  if (code === 'critical') return 0
  if (code === 'urgent') return 1
  return 2
}

function compareTasks(a: RawTask, b: RawTask, sort: TaskSortMode): number {
  switch (sort) {
    case 'oldest':
      return a.id - b.id
    case 'progress_asc':
      return a.progress - b.progress || b.id - a.id
    case 'progress_desc':
      return b.progress - a.progress || b.id - a.id
    case 'level':
      return levelRank(a) - levelRank(b) || b.id - a.id
    case 'due_asc':
    case 'due_desc': {
      const da = parseLocalDateTime(a.due_date)?.getTime() ?? null
      const db = parseLocalDateTime(b.due_date)?.getTime() ?? null
      if (da === null && db === null) return b.id - a.id
      if (da === null) return 1
      if (db === null) return -1
      return sort === 'due_asc' ? da - db : db - da
    }
    default:
      return b.id - a.id
  }
}

function matchesSearchKeyword(task: RawTask, keyword: string): boolean {
  const cleaned = keyword.replace(/^#/, '')
  const haystack = [
    `#${task.id}`,
    String(task.id),
    task.title,
    task.title_vn ?? '',
    task.content ?? '',
    task.assign_person ?? '',
    task.assigned_unit ?? '',
    task.req_dept ?? '',
    task.req_depts ?? '',
    task.req_contact ?? '',
    task.task_type ?? '',
    task.level ?? '',
    task.site ?? '',
    task.reporter_name ?? '',
    task.reporter,
    task.precautions ?? '',
    task.install_req ?? '',
    task.split_group ? `#${task.split_group}` : '',
  ]
    .join('\n')
    .toLowerCase()
  return haystack.includes(cleaned)
}

export type FilteredTaskPage = {
  items: RawTask[]
  total: number
  counts: TaskScopeCounts
  availableTaskTypes: string[]
}

/**
 * Pure client-side scope counting, filtering, sorting, and pagination over the
 * full `GET /api/tasks` cache (docs/DEVIATIONS.md §9.2).
 */
export function filterAndPaginateTasks(
  tasks: RawTask[],
  params: TaskListParams,
  user: SessionUser | null,
  now: Date = new Date(),
): FilteredTaskPage {
  let mine = 0
  let created = 0
  const typeSet = new Set<string>()

  for (const t of tasks) {
    if (matchesAssignee(t, user)) mine += 1
    if (matchesCreator(t, user)) created += 1
    const tt = (t.task_type ?? '').trim()
    if (tt) typeSet.add(tt)
  }

  const counts: TaskScopeCounts = {
    mine,
    created,
    all: tasks.length,
  }

  const keyword = params.search?.trim().toLowerCase() ?? ''
  const sortMode: TaskSortMode = params.sort ?? 'default'

  const filtered = tasks
    .filter((task) => {
      if (params.scope === 'mine' && !matchesAssignee(task, user)) return false
      if (params.scope === 'created' && !matchesCreator(task, user)) return false

      if (keyword && !matchesSearchKeyword(task, keyword)) return false

      if (params.fromDate || params.toDate) {
        const refDay = extractDateOnly(task.due_date) || extractDateOnly(task.createdAt)
        if (!refDay) return false
        if (params.fromDate && refDay < params.fromDate) return false
        if (params.toDate && refDay > params.toDate) return false
      }

      if (params.department) {
        const matchesAssigned = sameDept(task.assigned_unit, params.department)
        const matchesReq = parseReqDepts(task.req_depts, task.req_dept).some((d) =>
          sameDept(d, params.department),
        )
        if (!matchesAssigned && !matchesReq) return false
      }

      if (params.status) {
        if (params.status === 'incomplete') {
          if (task.progress >= 100) return false
        } else if (params.status === 'completed') {
          if (task.progress < 100) return false
        } else if (params.status === 'paused') {
          if (!isTaskPaused(task)) return false
        } else if (deriveTaskStatus(task, now) !== params.status) {
          return false
        }
      }

      if (params.site) {
        const taskSites = parseSites(task.site)
        const targetSite = params.site.trim().toUpperCase()
        if (targetSite === EMPTY_SITE_FILTER) {
          if (taskSites.length > 0) return false
        } else if (!taskSites.includes(targetSite)) {
          return false
        }
      }

      if (params.level && getTaskLevelCode(task.level) !== params.level) {
        return false
      }

      if (params.taskType && (task.task_type ?? '').trim() !== params.taskType) {
        return false
      }

      if (params.confidential && String(task.confidential) !== params.confidential) {
        return false
      }

      if (params.flags && params.flags.length > 0) {
        for (const flag of params.flags) {
          if (flag === 'recurring' && !isRecurringTask(task)) return false
          if (flag === 'recur_today' && !isRecurNeedsReportToday(task, now)) return false
          if (flag === 'cross' && !isCrossViewer(user, task)) return false
          if (flag === 'reader' && !isReaderOnly(user, task)) return false
        }
      }

      return true
    })
    .sort((a, b) => compareTasks(a, b, sortMode))

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const items = filtered.slice(start, start + params.pageSize)

  return {
    items,
    total,
    counts,
    availableTaskTypes: Array.from(typeSet).sort((a, b) => a.localeCompare(b)),
  }
}
