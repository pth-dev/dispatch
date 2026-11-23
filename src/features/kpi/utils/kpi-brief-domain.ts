import type { DirectoryUser, SessionUser } from '@/schemas/auth'
import type { RawReport, RawTask } from '@/schemas/task'
import { getUserDepts } from '@/utils/permissions'
import {
  deriveTaskStatus,
  isRecurringTask,
  isTaskPaused,
  parseAssigneeList,
  parseLocalDateTime,
  sameDept,
} from '@/utils/task-domain'
import { getKpiTaskKey, resolveDirectoryUser } from './kpi-people-domain'

export type BriefStatus = 'ontime' | 'late' | 'overdue' | 'progress' | 'paused'
export type BriefView = 'dept' | 'me' | 'all' | `d:${string}`
export type BriefYear = number | 'all'
export type BriefFinishedFilter = '' | 'ontime' | 'late'

export const BRIEF_STATUS_ORDER: readonly BriefStatus[] = [
  'ontime',
  'late',
  'overdue',
  'progress',
  'paused',
] as const

export const BRIEF_STATUS_COLOR_VAR: Record<BriefStatus, string> = {
  ontime: 'var(--color-success)',
  late: 'var(--color-warning)',
  overdue: 'var(--color-destructive)',
  progress: 'var(--color-primary)',
  paused: 'var(--color-muted-foreground)',
}

export const BRIEF_UNFINISHED_STATUSES: readonly BriefStatus[] = [
  'overdue',
  'progress',
  'paused',
] as const

export const BRIEF_SAMPLE_MIN = 3
export const BRIEF_FINISHED_LIMIT = 500
const DEFAULT_RECUR_TIME = '17:30'
const SYSTEM_REPORTERS = new Set(['system', '系统', '系統', 'hệ thống'])
const SYSTEM_PAUSE_ACTIONS = new Set(['cycle_start', 'cycle_done', 'auto_close'])

export interface BriefRow {
  task: RawTask
  tkey: string
  plan: Date
  month: number
  status: BriefStatus
  key: string
  username: string
  fullname: string
  deptRaw: string
}

export interface BriefAggregate {
  total: number
  ontime: number
  late: number
  overdue: number
  progress: number
  paused: number
  done: number
  unfinished: number
  rate: number
  ontimeRate: number
}

export interface BriefPersonRow extends BriefAggregate {
  key: string
  username: string
  fullname: string
  deptRaw: string
}

export interface BriefCaseRow {
  task: RawTask
  tkey: string
  plan: Date
  status: BriefStatus
  names: string[]
  overdueDays: number | null
  lateDays: number | null
}

/**
 * Matches legacy `planDate(t)` in `Dispatch-br.html`:
 * `due_date` -> recurring `recur_end + recur_time` -> `kpi_at || createdAt`.
 */
export function getBriefPlanDate(
  task: Pick<
    RawTask,
    'due_date' | 'recur_type' | 'recur_end' | 'recur_time' | 'kpi_at' | 'createdAt'
  >,
): Date | null {
  const due = parseLocalDateTime(task.due_date)
  if (due) return due
  if (isRecurringTask({ recur_type: task.recur_type ?? 'once' }) && task.recur_end) {
    const time = task.recur_time?.trim() || DEFAULT_RECUR_TIME
    const rec = parseLocalDateTime(`${task.recur_end.slice(0, 10)} ${time}:00`)
    if (rec) return rec
  }
  return parseLocalDateTime(task.kpi_at || task.createdAt)
}

/**
 * Mutually exclusive status for Supervisor Board (`Dispatch-br.html` `statusOf`):
 * paused -> ontime -> late -> overdue -> progress.
 */
export function deriveBriefStatus(
  task: Pick<RawTask, 'paused' | 'progress' | 'due_date' | 'finish_date'>,
  now: Date = new Date(),
): BriefStatus {
  if (isTaskPaused(task)) return 'paused'
  const status = deriveTaskStatus(task, now)
  if (status === 'completed_ontime') return 'ontime'
  if (status === 'late_completed') return 'late'
  if (status === 'delayed_pending') return 'overdue'
  return 'progress'
}

export function isBriefStatusDone(status: BriefStatus): boolean {
  return status === 'ontime' || status === 'late'
}

export function isBriefStatusUnfinished(status: BriefStatus): boolean {
  return status === 'overdue' || status === 'progress' || status === 'paused'
}

/**
 * Expands `tasks × assignees` rows filtered by `year` based on `planDate`.
 */
export function buildBriefRows(
  tasks: readonly RawTask[],
  directory: readonly DirectoryUser[],
  year: BriefYear,
  unassignedLabel: string,
  now: Date = new Date(),
): BriefRow[] {
  const rows: BriefRow[] = []

  for (const task of tasks) {
    const plan = getBriefPlanDate(task)
    if (!plan) continue
    if (year !== 'all' && plan.getFullYear() !== year) continue

    const status = deriveBriefStatus(task, now)
    const tkey = getKpiTaskKey(task)
    const assignees = parseAssigneeList(task.assign_person)
    const list = assignees.length > 0 ? assignees : ['']
    const seen = new Set<string>()

    for (const raw of list) {
      const resolved = raw ? resolveDirectoryUser(raw, directory) : null
      const info = resolved
        ? {
            key: `u:${resolved.username.trim().toLowerCase()}`,
            username: resolved.username,
            fullname: resolved.fullname || resolved.username,
            deptRaw: resolved.dept || '',
          }
        : raw
          ? {
              key: `r:${raw.trim().toLowerCase()}`,
              username: raw,
              fullname: raw,
              deptRaw: '',
            }
          : {
              key: 'r:__none',
              username: '',
              fullname: unassignedLabel,
              deptRaw: '',
            }

      if (seen.has(info.key)) continue
      seen.add(info.key)

      rows.push({
        task,
        tkey,
        plan,
        month: plan.getMonth() + 1,
        status,
        ...info,
      })
    }
  }

  return rows
}

export function getUserBriefKey(
  user: Pick<SessionUser, 'username'> | null | undefined,
): string {
  return `u:${(user?.username ?? '').trim().toLowerCase()}`
}

export function matchesBriefView(
  row: Pick<BriefRow, 'key' | 'deptRaw'>,
  view: BriefView,
  user: Pick<SessionUser, 'username' | 'dept' | 'extra_depts'> | null | undefined,
): boolean {
  if (view === 'me') return row.key === getUserBriefKey(user)
  if (view === 'all') return true
  if (view.startsWith('d:')) {
    const targetDept = view.slice(2)
    return Boolean(row.deptRaw) && sameDept(row.deptRaw, targetDept)
  }
  const myDepts = getUserDepts(user)
  return Boolean(row.deptRaw) && myDepts.some((d) => sameDept(row.deptRaw, d))
}

export function aggregateBriefRows(rows: readonly Pick<BriefRow, 'status'>[]): BriefAggregate {
  let ontime = 0
  let late = 0
  let overdue = 0
  let progress = 0
  let paused = 0

  for (const r of rows) {
    if (r.status === 'ontime') ontime += 1
    else if (r.status === 'late') late += 1
    else if (r.status === 'overdue') overdue += 1
    else if (r.status === 'progress') progress += 1
    else paused += 1
  }

  const total = rows.length
  const done = ontime + late
  const unfinished = overdue + progress + paused
  const rate = total > 0 ? Math.round((done / total) * 100) : 0
  const ontimeRate = total > 0 ? Math.round((ontime / total) * 100) : 0

  return { total, ontime, late, overdue, progress, paused, done, unfinished, rate, ontimeRate }
}

export function groupBriefPeople(rows: readonly BriefRow[]): BriefPersonRow[] {
  const buckets = new Map<
    string,
    { key: string; username: string; fullname: string; deptRaw: string; rows: BriefRow[] }
  >()

  for (const r of rows) {
    const existing = buckets.get(r.key)
    if (existing) {
      existing.rows.push(r)
    } else {
      buckets.set(r.key, {
        key: r.key,
        username: r.username,
        fullname: r.fullname,
        deptRaw: r.deptRaw,
        rows: [r],
      })
    }
  }

  return Array.from(buckets.values()).map((g) => ({
    key: g.key,
    username: g.username,
    fullname: g.fullname,
    deptRaw: g.deptRaw,
    ...aggregateBriefRows(g.rows),
  }))
}

export function computeOverdueDays(row: Pick<BriefRow, 'status' | 'plan'>, now: Date = new Date()): number | null {
  if (row.status !== 'overdue') return null
  return Math.max(1, Math.floor((now.getTime() - row.plan.getTime()) / 86_400_000))
}

export function computeLateDays(
  row: Pick<BriefRow, 'status' | 'plan' | 'task'>,
): number | null {
  if (row.status !== 'late') return null
  const fin = parseLocalDateTime(row.task.finish_date)
  if (!fin) return null
  return Math.max(1, Math.ceil((fin.getTime() - row.plan.getTime()) / 86_400_000))
}

/**
 * Merges multi-assignee rows of the same task (`tkey`) into a single case row.
 */
export function buildBriefCaseList(
  rows: readonly BriefRow[],
  kind: 'unfinished' | 'finished',
  options: {
    statusFilter?: BriefStatus | ''
    finFilter?: BriefFinishedFilter
    now?: Date
  } = {},
): BriefCaseRow[] {
  const { statusFilter = '', finFilter = '', now = new Date() } = options
  const filtered = rows.filter((r) => {
    if (kind === 'unfinished') {
      return isBriefStatusUnfinished(r.status) && (!statusFilter || r.status === statusFilter)
    }
    return isBriefStatusDone(r.status) && (!finFilter || r.status === finFilter)
  })

  const merged = new Map<string, BriefCaseRow>()
  for (const r of filtered) {
    const existing = merged.get(r.tkey)
    if (existing) {
      if (!existing.names.includes(r.fullname)) {
        existing.names.push(r.fullname)
      }
    } else {
      merged.set(r.tkey, {
        task: r.task,
        tkey: r.tkey,
        plan: r.plan,
        status: r.status,
        names: [r.fullname],
        overdueDays: computeOverdueDays(r, now),
        lateDays: computeLateDays(r),
      })
    }
  }

  const list = Array.from(merged.values())
  if (kind === 'unfinished') {
    return list.sort((a, b) => a.plan.getTime() - b.plan.getTime())
  }
  return list.sort((a, b) => {
    const fa = parseLocalDateTime(a.task.finish_date)?.getTime() ?? a.plan.getTime()
    const fb = parseLocalDateTime(b.task.finish_date)?.getTime() ?? b.plan.getTime()
    return fb - fa
  })
}

export function isSystemBriefReport(report: Pick<RawReport, 'username' | 'fullname' | 'pause_action'>): boolean {
  const u = (report.username ?? '').trim().toLowerCase()
  const f = (report.fullname ?? '').trim().toLowerCase()
  if (SYSTEM_REPORTERS.has(u) || SYSTEM_REPORTERS.has(f)) return true
  return SYSTEM_PAUSE_ACTIONS.has(String(report.pause_action ?? ''))
}

/**
 * Matches legacy `isAssigneeReport(r, t)` in `Dispatch-br.html`:
 * keeps only reports written by the task's assignee(s) (or split assignee).
 */
export function isAssigneeBriefReport(
  report: Pick<RawReport, 'username' | 'fullname' | 'split_assignee'>,
  task: Pick<RawTask, 'assign_person'>,
  directory: readonly DirectoryUser[],
): boolean {
  const owners = report.split_assignee
    ? parseAssigneeList(report.split_assignee)
    : parseAssigneeList(task.assign_person)

  const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase().replace(/\s+/g, '')
  const ownerSet = new Set(owners.map(norm).filter(Boolean))
  const un = norm(report.username)
  const fn = norm(report.fullname)
  if ((un && ownerSet.has(un)) || (fn && ownerSet.has(fn))) return true

  const repUser = (report.username ?? '').trim().toLowerCase()
  if (!repUser) return false
  return owners.some((owner) => {
    const resolved = resolveDirectoryUser(owner, directory)
    return resolved != null && resolved.username.trim().toLowerCase() === repUser
  })
}
