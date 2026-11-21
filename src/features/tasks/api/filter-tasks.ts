import type { SessionUser } from '@/schemas/auth'
import type { RawTask, TaskListParams, TaskScopeCounts } from '@/schemas/task'
import {
  deriveTaskStatus,
  isTaskPaused,
  parseAssigneeList,
  parseReqDepts,
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

export type FilteredTaskPage = {
  items: RawTask[]
  total: number
  counts: TaskScopeCounts
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
  for (const t of tasks) {
    if (matchesAssignee(t, user)) mine += 1
    if (matchesCreator(t, user)) created += 1
  }

  const counts: TaskScopeCounts = {
    mine,
    created,
    all: tasks.length,
  }

  const keyword = params.search?.trim().toLowerCase() ?? ''

  const filtered = tasks
    .filter((task) => {
      if (params.scope === 'mine' && !matchesAssignee(task, user)) return false
      if (params.scope === 'created' && !matchesCreator(task, user)) return false

      if (keyword) {
        const idStr = `#${task.id}`
        const haystack = [
          idStr,
          String(task.id),
          task.title,
          task.title_vn ?? '',
          task.assign_person ?? '',
          task.assigned_unit ?? '',
          task.reporter_name ?? '',
          task.reporter,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(keyword)) return false
      }

      if (params.fromDate || params.toDate) {
        const dueDay = extractDateOnly(task.due_date)
        const createdDay = extractDateOnly(task.createdAt)
        const refDay = dueDay || createdDay
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
        if (params.status === 'paused') {
          if (!isTaskPaused(task)) return false
        } else if (deriveTaskStatus(task, now) !== params.status) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => b.id - a.id)

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const items = filtered.slice(start, start + params.pageSize)

  return { items, total, counts }
}
