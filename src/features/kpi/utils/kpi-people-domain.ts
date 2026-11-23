import type { DirectoryUser, SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import { getKpiGrade, type KpiGradeInfo } from '@/utils/kpi-domain'
import { getUserDepts, isSuperLike } from '@/utils/permissions'
import {
  deriveTaskStatus,
  isRecurringTask,
  isTaskCompleted,
  isTaskPaused,
  parseAssigneeList,
  parseLocalDateTime,
  sameDept,
  toLocalDateString,
} from '@/utils/task-domain'

export type KpiBasis = 'final' | 'created'
export type KpiQuickRange = 'month' | 'quarter' | 'year'
export type KpiSortKey =
  | 'score'
  | 'total'
  | 'completion'
  | 'ontime'
  | 'overdue'
  | 'late'
  | 'response'
  | 'username'

export const KPI_WEIGHTS = { final: 60, ontime: 40 } as const
export const KPI_RESPONSE_THRESHOLD_MINS = 60
const DEFAULT_RECUR_TIME = '17:30'

export function formatKpiPct(value: number, total: number): string {
  return total > 0 ? `${value}%` : 'N/A'
}

export interface PeopleKpiRow {
  key: string
  username: string
  fullname: string
  isUnregistered: boolean
  deptRaw: string
  total: number
  paused: number
  completed: number
  ontime: number
  late: number
  pending: number
  overdue: number
  responded: number
  completionRate: number
  finalPart: number
  ontimeRate: number
  ontimePart: number
  lateRate: number
  responseRate: number
  score: number | null
  grade: KpiGradeInfo
  taskKeys: string[]
  pausedKeys: string[]
}

export interface PeopleKpiSummary {
  peopleCount: number
  total: number
  completed: number
  ontime: number
  late: number
  responded: number
  paused: number
  completionRate: number | null
  ontimeRate: number | null
  lateRate: number | null
  responseRate: number | null
  avgScore: number | null
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Matches legacy `DU_kpiKey(t)`:
 * recurring cycle rows use `<id>@<cycle_date>`, normal tasks use `<id>`.
 */
export function getKpiTaskKey(
  task: Pick<RawTask, 'id' | 'is_cycle' | 'cycle_date' | 'recur_cycle_date'>,
): string {
  const cycleDate = task.cycle_date || task.recur_cycle_date
  if (task.is_cycle && cycleDate) {
    return `${task.id}@${cycleDate}`
  }
  return String(task.id)
}

/**
 * Matches legacy `DU_kpiFinalAt(t)` (V16.11.0-r3):
 * completed -> finish_date; otherwise -> due_date; fallback -> kpi_at || createdAt.
 */
export function getKpiFinalAt(
  task: Pick<RawTask, 'progress' | 'finish_date' | 'due_date' | 'kpi_at' | 'createdAt'>,
): Date | null {
  if (isTaskCompleted(task) && task.finish_date) {
    const fin = parseLocalDateTime(task.finish_date)
    if (fin) return fin
  }
  if (task.due_date) {
    const due = parseLocalDateTime(task.due_date)
    if (due) return due
  }
  return parseLocalDateTime(task.kpi_at || task.createdAt)
}

export function getKpiBasisAt(
  task: Pick<RawTask, 'progress' | 'finish_date' | 'due_date' | 'kpi_at' | 'createdAt'>,
  basis: KpiBasis = 'final',
): Date | null {
  if (basis === 'final') return getKpiFinalAt(task)
  return parseLocalDateTime(task.kpi_at || task.createdAt)
}

/**
 * Matches legacy `DU_kpiTaskPoints(t)` (V16.11.0-r8):
 * ontime = 100, late completed = 60, incomplete = 0, paused = null.
 */
export function getKpiTaskPoints(
  task: Pick<RawTask, 'progress' | 'due_date' | 'finish_date' | 'paused'>,
  now: Date = new Date(),
): number | null {
  if (isTaskPaused(task)) return null
  const status = deriveTaskStatus(task, now)
  if (status === 'completed_ontime') return KPI_WEIGHTS.final + KPI_WEIGHTS.ontime
  if (status === 'late_completed') return KPI_WEIGHTS.final
  return 0
}

/**
 * Expected final completion date shown beside `due_date` in task details:
 * - Recurring task: `recur_end + recur_time` (or null if unlimited)
 * - Normal task: `due_date`
 */
export function getTaskFinalDueInfo(
  task: Pick<
    RawTask,
    'recur_type' | 'recur_end' | 'recur_time' | 'due_date' | 'progress' | 'paused' | 'is_cycle'
  >,
  now: Date = new Date(),
): {
  isRecurring: boolean
  isUnlimited: boolean
  date: Date | null
  displayRaw: string
  isOverdue: boolean
} {
  const rec = isRecurringTask({ recur_type: task.recur_type ?? 'once' })
  if (rec) {
    if (!task.recur_end) {
      return {
        isRecurring: true,
        isUnlimited: true,
        date: null,
        displayRaw: '',
        isOverdue: false,
      }
    }
    const time = task.recur_time?.trim() || DEFAULT_RECUR_TIME
    const dateStr = `${task.recur_end.slice(0, 10)} ${time}`
    const parsed = parseLocalDateTime(dateStr)
    const done = Boolean(task.is_cycle) || isTaskCompleted(task)
    const overdue = !done && !isTaskPaused(task) && parsed != null && parsed.getTime() < now.getTime()
    return {
      isRecurring: true,
      isUnlimited: false,
      date: parsed,
      displayRaw: dateStr,
      isOverdue: overdue,
    }
  }

  const parsed = parseLocalDateTime(task.due_date)
  const done = isTaskCompleted(task)
  const overdue = !done && !isTaskPaused(task) && parsed != null && parsed.getTime() < now.getTime()
  return {
    isRecurring: false,
    isUnlimited: false,
    date: parsed,
    displayRaw: task.due_date ?? '',
    isOverdue: overdue,
  }
}

export function getPeriodDateRange(
  type: KpiQuickRange,
  now: Date = new Date(),
): { start: string; end: string } {
  const y = now.getFullYear()
  const m = now.getMonth()
  if (type === 'month') {
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0)
    return { start: toLocalDateString(start), end: toLocalDateString(end) }
  }
  if (type === 'quarter') {
    const qStartMonth = Math.floor(m / 3) * 3
    const start = new Date(y, qStartMonth, 1)
    const end = new Date(y, qStartMonth + 3, 0)
    return { start: toLocalDateString(start), end: toLocalDateString(end) }
  }
  const start = new Date(y, 0, 1)
  const end = new Date(y, 11, 31)
  return { start: toLocalDateString(start), end: toLocalDateString(end) }
}

function isDateInRange(date: Date | null, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true
  if (!date) return false
  const ts = date.getTime()
  if (start && ts < start.getTime()) return false
  if (end && ts > end.getTime()) return false
  return true
}

export function resolveDirectoryUser(
  raw: string,
  directory: readonly DirectoryUser[],
): DirectoryUser | null {
  const needle = raw.trim().toLowerCase()
  if (!needle) return null
  const byUsername = directory.find((u) => u.username.trim().toLowerCase() === needle)
  if (byUsername) return byUsername
  const byFullname = directory.find(
    (u) => (u.fullname ?? '').trim().toLowerCase() === needle,
  )
  return byFullname ?? null
}

/**
 * Returns users visible in KPI people table for the current user's scope:
 * `isSuperLike` -> entire directory; others -> users in primary + extra depts.
 */
export function getScopedKpiPeople(
  user: Pick<SessionUser, 'role' | 'dept' | 'extra_depts'> | null | undefined,
  directory: readonly DirectoryUser[],
): DirectoryUser[] {
  if (!user) return []
  if (isSuperLike(user)) return [...directory]
  const myDepts = getUserDepts(user)
  if (myDepts.length === 0) return []
  return directory.filter((u) =>
    myDepts.some((dept) => sameDept(u.dept, dept)),
  )
}

/**
 * Matches legacy `DU_kpiCalc` (V16.11.0-r8 / r3):
 * - Multi-assignee tasks count 1 per assignee.
 * - Recurring cycle rows count 1 per cycle.
 * - Paused tasks excluded from denominator and counted in `paused`.
 * - Score = round1(completionRate * 0.6 + ontimeRate * 0.4), clamped 0..100.
 */
export function computePeopleKpi(
  tasks: readonly RawTask[],
  options: {
    startStr?: string
    endStr?: string
    basis?: KpiBasis
    people?: readonly DirectoryUser[]
    directory?: readonly DirectoryUser[]
    now?: Date
  } = {},
): PeopleKpiRow[] {
  const {
    startStr,
    endStr,
    basis = 'final',
    people = [],
    directory = people,
    now = new Date(),
  } = options

  const start = startStr ? parseLocalDateTime(`${startStr} 00:00:00`) : null
  const end = endStr ? parseLocalDateTime(`${endStr} 23:59:59`) : null

  interface MutableBucket {
    key: string
    username: string
    fullname: string
    isUnregistered: boolean
    deptRaw: string
    total: number
    paused: number
    completed: number
    ontime: number
    late: number
    pending: number
    overdue: number
    responded: number
    taskKeys: string[]
    pausedKeys: string[]
  }

  const map = new Map<string, MutableBucket>()
  const ensure = (info: {
    key: string
    username: string
    fullname: string
    isUnregistered: boolean
    deptRaw: string
  }): MutableBucket => {
    const existing = map.get(info.key)
    if (existing) return existing
    const created: MutableBucket = {
      ...info,
      total: 0,
      paused: 0,
      completed: 0,
      ontime: 0,
      late: 0,
      pending: 0,
      overdue: 0,
      responded: 0,
      taskKeys: [],
      pausedKeys: [],
    }
    map.set(info.key, created)
    return created
  }

  for (const u of people) {
    ensure({
      key: `u:${u.username.trim().toLowerCase()}`,
      username: u.username,
      fullname: u.fullname || '',
      isUnregistered: false,
      deptRaw: u.dept || '',
    })
  }

  for (const task of tasks) {
    const basisAt = getKpiBasisAt(task, basis)
    if (!isDateInRange(basisAt, start, end)) continue

    const assignees = parseAssigneeList(task.assign_person)
    if (assignees.length === 0) continue

    const seen = new Set<string>()
    const tkey = getKpiTaskKey(task)
    const paused = isTaskPaused(task)
    const status = deriveTaskStatus(task, now)

    for (const raw of assignees) {
      const resolved = resolveDirectoryUser(raw, directory)
      const info = resolved
        ? {
            key: `u:${resolved.username.trim().toLowerCase()}`,
            username: resolved.username,
            fullname: resolved.fullname || '',
            isUnregistered: false,
            deptRaw: resolved.dept || '',
          }
        : {
            key: `r:${raw.trim().toLowerCase()}`,
            username: raw,
            fullname: '',
            isUnregistered: true,
            deptRaw: '',
          }

      if (seen.has(info.key)) continue
      seen.add(info.key)

      const bucket = ensure(info)
      if (paused) {
        bucket.paused += 1
        bucket.pausedKeys.push(tkey)
        continue
      }

      bucket.total += 1
      bucket.taskKeys.push(tkey)

      if (status === 'completed_ontime') {
        bucket.completed += 1
        bucket.ontime += 1
      } else if (status === 'late_completed') {
        bucket.completed += 1
        bucket.late += 1
      } else {
        bucket.pending += 1
        if (status === 'delayed_pending') {
          bucket.overdue += 1
        }
      }

      if (
        task.first_response_mins != null &&
        Number.isFinite(Number(task.first_response_mins)) &&
        Number(task.first_response_mins) <= KPI_RESPONSE_THRESHOLD_MINS
      ) {
        bucket.responded += 1
      }
    }
  }

  return Array.from(map.values()).map((b) => {
    const ratio = (n: number) => (b.total > 0 ? n / b.total : 0)
    const completionRate = round1(ratio(b.completed) * 100)
    const ontimeRate = round1(ratio(b.ontime) * 100)
    const lateRate = round1(ratio(b.late) * 100)
    const responseRate = round1(ratio(b.responded) * 100)
    const finalPart = round1(ratio(b.completed) * KPI_WEIGHTS.final)
    const ontimePart = round1(ratio(b.ontime) * KPI_WEIGHTS.ontime)
    const rawScore = ratio(b.completed) * KPI_WEIGHTS.final + ratio(b.ontime) * KPI_WEIGHTS.ontime
    const score = b.total > 0 ? round1(Math.max(0, Math.min(100, rawScore))) : null

    return {
      ...b,
      completionRate,
      finalPart,
      ontimeRate,
      ontimePart,
      lateRate,
      responseRate,
      score,
      grade: getKpiGrade(score),
    }
  })
}

export function filterAndSortPeopleKpi(
  rows: readonly PeopleKpiRow[],
  options: {
    query: string
    dept: string
    showEmpty: boolean
    sort: KpiSortKey
  },
): PeopleKpiRow[] {
  const tokens = options.query
    .split(/[,，、;；\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const filtered = rows.filter((r) => {
    if (!options.showEmpty && r.total === 0 && r.paused === 0) return false
    if (options.dept && !sameDept(r.deptRaw, options.dept)) return false
    if (tokens.length > 0) {
      const hay = `${r.username}\n${r.fullname}`.toLowerCase()
      if (!tokens.some((tok) => hay.includes(tok))) return false
    }
    return true
  })

  const scoreVal = (r: PeopleKpiRow) => (r.score === null ? -1 : r.score)

  const comparators: Record<KpiSortKey, (a: PeopleKpiRow, b: PeopleKpiRow) => number> = {
    score: (a, b) => scoreVal(b) - scoreVal(a) || b.total - a.total,
    total: (a, b) => b.total - a.total || scoreVal(b) - scoreVal(a),
    completion: (a, b) => b.completionRate - a.completionRate || b.total - a.total,
    ontime: (a, b) => b.ontimeRate - a.ontimeRate || b.total - a.total,
    overdue: (a, b) => b.overdue - a.overdue || b.total - a.total,
    late: (a, b) => b.lateRate - a.lateRate || b.total - a.total,
    response: (a, b) => b.responseRate - a.responseRate || b.total - a.total,
    username: (a, b) => a.username.localeCompare(b.username),
  }

  return [...filtered].sort(comparators[options.sort] ?? comparators.score)
}

export function computePeopleKpiSummary(rows: readonly PeopleKpiRow[]): PeopleKpiSummary {
  let total = 0
  let completed = 0
  let ontime = 0
  let late = 0
  let responded = 0
  let paused = 0
  let scoreSum = 0
  let scoredCount = 0

  for (const r of rows) {
    total += r.total
    completed += r.completed
    ontime += r.ontime
    late += r.late
    responded += r.responded
    paused += r.paused
    if (r.score !== null) {
      scoreSum += r.score
      scoredCount += 1
    }
  }

  return {
    peopleCount: rows.length,
    total,
    completed,
    ontime,
    late,
    responded,
    paused,
    completionRate: total > 0 ? round1((completed / total) * 100) : null,
    ontimeRate: total > 0 ? round1((ontime / total) * 100) : null,
    lateRate: total > 0 ? round1((late / total) * 100) : null,
    responseRate: total > 0 ? round1((responded / total) * 100) : null,
    avgScore: scoredCount > 0 ? round1(scoreSum / scoredCount) : null,
  }
}
