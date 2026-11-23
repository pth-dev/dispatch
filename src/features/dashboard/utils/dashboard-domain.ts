import { PostGranularitySchema, type PostGranularity } from '@/schemas/dashboard'
import type { RawTask } from '@/schemas/task'
import {
  deriveTaskStatus,
  isAssignedToUser,
  isRecurringTask,
  isTaskCompleted,
  isTaskPaused,
  normalizeDeptKey,
  normalizeT2S,
  parseLocalDateTime,
  parseReqDepts,
  parseSites,
  toLocalDateString,
} from '@/utils/task-domain'

export type DashboardPeriod = 'week' | 'month' | 'quarter' | 'year'
export type DashboardScopeMode = 'all' | 'mine'
export type TodayTodoGroupKey = 'all' | 'sched' | 'recur' | 'due' | 'overdue'
export type BottleneckTabKey = 'dept' | 'site' | 'level' | 'type'

export interface PeriodRange {
  start: Date
  end: Date
  startDateStr: string
  endDateStr: string
}

export interface PeriodFlowStats {
  range: PeriodRange
  createdTasks: RawTask[]
  completedTasks: RawTask[]
  createdOverdue: number
  createdOpen: number
  completedOntime: number
  completedLate: number
  /** Positive means backlog grew (created > completed); negative means backlog shrank. */
  backlogDelta: number
}

export interface SnapshotMetrics {
  total: number
  open: number
  paused: number
  overdue: number
  dueToday: number
  completed: number
  ontime: number
  late: number
  completionRate: number | null
  ontimeRate: number | null
}

export interface Response1hStats {
  passTasks: RawTask[]
  failTasks: RawTask[]
  noResponseTasks: RawTask[]
  respondedCount: number
  passRate: number | null
}

export interface TodayTodoGroups {
  sched: RawTask[]
  recur: RawTask[]
  due: RawTask[]
  overdue: RawTask[]
  allUnique: RawTask[]
}

export interface BottleneckRow {
  key: string
  label: string
  filterValue: string
  total: number
  open: number
  overdue: number
  completed: number
}

export interface BottleneckBreakdowns {
  dept: BottleneckRow[]
  site: BottleneckRow[]
  level: BottleneckRow[]
  type: BottleneckRow[]
}

function roundPct(num: number, den: number): number | null {
  if (den <= 0) return null
  return Math.round((num / den) * 1000) / 10
}

export function getPeriodRange(period: DashboardPeriod, now: Date = new Date()): PeriodRange {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  let start: Date
  let end: Date

  if (period === 'week') {
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    start = new Date(y, m, d + diffToMonday, 0, 0, 0, 0)
    end = new Date(y, m, d + diffToMonday + 6, 23, 59, 59, 999)
  } else if (period === 'month') {
    start = new Date(y, m, 1, 0, 0, 0, 0)
    end = new Date(y, m + 1, 0, 23, 59, 59, 999)
  } else if (period === 'quarter') {
    const qStartMonth = Math.floor(m / 3) * 3
    start = new Date(y, qStartMonth, 1, 0, 0, 0, 0)
    end = new Date(y, qStartMonth + 3, 0, 23, 59, 59, 999)
  } else {
    start = new Date(y, 0, 1, 0, 0, 0, 0)
    end = new Date(y, 11, 31, 23, 59, 59, 999)
  }

  return {
    start,
    end,
    startDateStr: toLocalDateString(start),
    endDateStr: toLocalDateString(end),
  }
}

export function computePeriodFlow(
  tasks: readonly RawTask[],
  period: DashboardPeriod,
  now: Date = new Date(),
): PeriodFlowStats {
  const range = getPeriodRange(period, now)
  const createdTasks: RawTask[] = []
  const completedTasks: RawTask[] = []

  for (const task of tasks) {
    const created = parseLocalDateTime(task.createdAt)
    if (created && created >= range.start && created <= range.end) {
      createdTasks.push(task)
    }
    if (isTaskCompleted(task) && task.finish_date) {
      const finished = parseLocalDateTime(task.finish_date)
      if (finished && finished >= range.start && finished <= range.end) {
        completedTasks.push(task)
      }
    }
  }

  let createdOverdue = 0
  let createdOpen = 0
  for (const task of createdTasks) {
    const status = deriveTaskStatus(task, now)
    if (status === 'delayed_pending') createdOverdue += 1
    if (status !== 'completed_ontime' && status !== 'late_completed') createdOpen += 1
  }

  let completedOntime = 0
  let completedLate = 0
  for (const task of completedTasks) {
    if (deriveTaskStatus(task, now) === 'completed_ontime') completedOntime += 1
    else completedLate += 1
  }

  return {
    range,
    createdTasks,
    completedTasks,
    createdOverdue,
    createdOpen,
    completedOntime,
    completedLate,
    backlogDelta: createdTasks.length - completedTasks.length,
  }
}

export function computeSnapshotMetrics(
  tasks: readonly RawTask[],
  now: Date = new Date(),
): SnapshotMetrics {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  let open = 0
  let paused = 0
  let overdue = 0
  let dueToday = 0
  let completed = 0
  let ontime = 0
  let late = 0

  for (const task of tasks) {
    const status = deriveTaskStatus(task, now)
    const isDone = status === 'completed_ontime' || status === 'late_completed'

    if (isDone) {
      completed += 1
      if (status === 'completed_ontime') ontime += 1
      else late += 1
      continue
    }

    open += 1
    if (isTaskPaused(task)) {
      paused += 1
      continue
    }
    if (status === 'delayed_pending') overdue += 1

    const due = parseLocalDateTime(task.due_date)
    if (due && due >= todayStart && due < tomorrowStart) {
      dueToday += 1
    }
  }

  return {
    total: tasks.length,
    open,
    paused,
    overdue,
    dueToday,
    completed,
    ontime,
    late,
    completionRate: roundPct(completed, tasks.length),
    ontimeRate: roundPct(ontime, completed),
  }
}

export function computeResponse1hStats(
  tasks: readonly RawTask[],
  now: Date = new Date(),
): Response1hStats {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const passTasks: RawTask[] = []
  const failTasks: RawTask[] = []
  const noResponseTasks: RawTask[] = []

  for (const task of tasks) {
    const created = parseLocalDateTime(task.createdAt)
    if (!created || created < monthStart || created >= nextMonthStart) continue
    const mins = task.first_response_mins
    if (mins == null || !Number.isFinite(Number(mins))) {
      noResponseTasks.push(task)
    } else if (Number(mins) <= 60) {
      passTasks.push(task)
    } else {
      failTasks.push(task)
    }
  }

  const respondedCount = passTasks.length + failTasks.length
  return {
    passTasks,
    failTasks,
    noResponseTasks,
    respondedCount,
    passRate: roundPct(passTasks.length, respondedCount),
  }
}

export function computeTodayTodoGroups(
  tasks: readonly RawTask[],
  scheduledTaskIds: ReadonlySet<number>,
  user: { username: string; fullname?: string } | null | undefined,
  includeAll: boolean,
  now: Date = new Date(),
): TodayTodoGroups {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const sched: RawTask[] = []
  const recur: RawTask[] = []
  const due: RawTask[] = []
  const overdue: RawTask[] = []

  for (const task of tasks) {
    if (isTaskCompleted(task) || isTaskPaused(task)) continue
    const isMine = user ? isAssignedToUser(task, { username: user.username, fullname: user.fullname ?? '' }) : false
    if (!includeAll && !isMine) continue

    const dueDt = parseLocalDateTime(task.due_date)
    const isDueToday = Boolean(dueDt && dueDt >= todayStart && dueDt < tomorrowStart)
    const isOverdue = Boolean(dueDt && dueDt < now)

    if (scheduledTaskIds.has(task.id)) {
      sched.push(task)
    }
    if (isRecurringTask(task) && isDueToday) {
      recur.push(task)
    }
    if (isDueToday) {
      due.push(task)
    }
    if (isOverdue) {
      overdue.push(task)
    }
  }

  const seen = new Set<number>()
  const allUnique: RawTask[] = []
  for (const list of [sched, recur, due, overdue]) {
    for (const task of list) {
      if (seen.has(task.id)) continue
      seen.add(task.id)
      allUnique.push(task)
    }
  }

  return { sched, recur, due, overdue, allUnique }
}

function sortBottleneckRows(rows: BottleneckRow[]): BottleneckRow[] {
  return rows.sort(
    (a, b) =>
      b.overdue - a.overdue ||
      b.open - a.open ||
      b.total - a.total ||
      a.label.localeCompare(b.label),
  )
}

export function computeBottleneckBreakdowns(
  tasks: readonly RawTask[],
  emptyLabel: string,
  now: Date = new Date(),
): BottleneckBreakdowns {
  const deptMap = new Map<string, BottleneckRow>()
  const siteMap = new Map<string, BottleneckRow>()
  const levelMap = new Map<string, BottleneckRow>()
  const typeMap = new Map<string, BottleneckRow>()

  const bump = (
    map: Map<string, BottleneckRow>,
    key: string,
    label: string,
    filterValue: string,
    isDone: boolean,
    isOverdue: boolean,
  ) => {
    const row = map.get(key) ?? { key, label, filterValue, total: 0, open: 0, overdue: 0, completed: 0 }
    row.total += 1
    if (isDone) row.completed += 1
    else row.open += 1
    if (isOverdue) row.overdue += 1
    map.set(key, row)
  }

  for (const task of tasks) {
    const status = deriveTaskStatus(task, now)
    const isDone = status === 'completed_ontime' || status === 'late_completed'
    const isOverdue = status === 'delayed_pending' && !isTaskPaused(task)

    const rawDept = task.assigned_unit?.trim() || ''
    const deptKey = rawDept ? normalizeDeptKey(rawDept) : '__EMPTY__'
    bump(deptMap, deptKey, rawDept || emptyLabel, rawDept, isDone, isOverdue)

    const sites = parseSites(task.site)
    if (sites.length === 0) {
      bump(siteMap, '__EMPTY__', emptyLabel, '__EMPTY__', isDone, isOverdue)
    } else {
      for (const site of sites) {
        bump(siteMap, site, site, site, isDone, isOverdue)
      }
    }

    const rawLevel = task.level?.trim() || ''
    const levelKey = rawLevel ? normalizeT2S(rawLevel) : '__EMPTY__'
    bump(levelMap, levelKey, rawLevel || emptyLabel, rawLevel, isDone, isOverdue)

    const rawType = task.task_type?.trim() || ''
    const typeKey = rawType ? normalizeT2S(rawType) : '__EMPTY__'
    bump(typeMap, typeKey, rawType || emptyLabel, rawType, isDone, isOverdue)
  }

  return {
    dept: sortBottleneckRows(Array.from(deptMap.values())),
    site: sortBottleneckRows(Array.from(siteMap.values())),
    level: sortBottleneckRows(Array.from(levelMap.values())),
    type: sortBottleneckRows(Array.from(typeMap.values())),
  }
}

export function filterTasksByDeptSet(
  tasks: readonly RawTask[],
  deptSet: readonly string[],
): RawTask[] {
  const normalizedSet = new Set(deptSet.map((d) => normalizeDeptKey(d)).filter(Boolean))
  if (normalizedSet.size === 0) return []
  const hit = (value: string | null | undefined) => {
    const key = normalizeDeptKey(value)
    return key.length > 0 && normalizedSet.has(key)
  }

  return tasks.filter(
    (task) =>
      hit(task.assigned_unit) ||
      hit(task.reporter_dept) ||
      parseReqDepts(task.req_depts, task.req_dept).some(hit),
  )
}

export function formatPostBucketLabel(raw: string, gran: PostGranularity): string {
  if (gran === 'month') return raw
  if (gran === 'week') return raw.length > 5 ? raw.slice(5) : raw
  return raw.length > 5 ? raw.slice(5) : raw
}

export function readStoredPostGranularity(storageKey: string): PostGranularity {
  try {
    const parsed = PostGranularitySchema.safeParse(localStorage.getItem(storageKey))
    if (parsed.success) return parsed.data
  } catch {
    // ignore storage errors
  }
  return 'day'
}
