import type { RawTask } from '@/schemas/task'
import {
  deriveTaskStatus,
  getTaskLevelCode,
  isTaskCompleted,
  isTaskPaused,
  parseAssigneeList,
  parseLocalDateTime,
  toLocalDateString,
} from '@/utils/task-domain'
import {
  computePeriodFlow,
  getPeriodRange,
  type DashboardPeriod,
  type DashboardScopeMode,
  type PeriodFlowStats,
  type PeriodRange,
} from './dashboard-domain'

export type FlowTrendGranularity = 'week' | 'month'
export type OverdueBucketKey = '1_3' | '4_7' | '8_14' | 'over_14'

export interface PeriodFlowComparison {
  current: PeriodFlowStats
  previous: PeriodFlowStats
  createdDiff: number
  completedDiff: number
  clearanceRate: number | null
}

export interface FlowTrendPoint {
  key: string
  label: string
  rangeLabel: string
  startDateStr: string
  endDateStr: string
  created: number
  completed: number
  delta: number
  createdTasks: RawTask[]
  completedTasks: RawTask[]
}

export interface FlowTrendSummary {
  gran: FlowTrendGranularity
  points: FlowTrendPoint[]
  avgCreated: number
  avgCompleted: number
  totalDelta: number
}

export interface OverdueAgingBucket {
  key: OverdueBucketKey
  count: number
  percent: number
  tasks: RawTask[]
}

export interface LongestOverdueItem {
  task: RawTask
  overdueDays: number
}

export interface OverdueAgingStats {
  overdueCount: number
  pausedCount: number
  avgOpenAgeDays: number | null
  maxOverdueDays: number | null
  buckets: OverdueAgingBucket[]
  longestTasks: LongestOverdueItem[]
}

export interface DeptMemberStatusRow {
  name: string
  notStarted: number
  inProgress: number
  overdue: number
  paused: number
  completed: number
  open: number
  total: number
}

export interface PeriodAssigneeRankRow {
  assignee: string
  completed: number
  ontime: number
  late: number
  overdue: number
  ontimeRate: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function roundOneDecimal(val: number): number {
  return Math.round(val * 10) / 10
}

export function getPreviousPeriodAnchor(period: DashboardPeriod, now: Date = new Date()): Date {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  if (period === 'week') return new Date(y, m, d - 7, 12, 0, 0)
  if (period === 'month') return new Date(y, m - 1, 15, 12, 0, 0)
  if (period === 'quarter') return new Date(y, m - 3, 15, 12, 0, 0)
  return new Date(y - 1, 5, 15, 12, 0, 0)
}

export function computePeriodFlowComparison(
  tasks: readonly RawTask[],
  period: DashboardPeriod,
  now: Date = new Date(),
): PeriodFlowComparison {
  const current = computePeriodFlow(tasks, period, now)
  const prevAnchor = getPreviousPeriodAnchor(period, now)
  const previous = computePeriodFlow(tasks, period, prevAnchor)
  const clearanceRate =
    current.createdTasks.length > 0
      ? roundOneDecimal((current.completedTasks.length / current.createdTasks.length) * 100)
      : null

  return {
    current,
    previous,
    createdDiff: current.createdTasks.length - previous.createdTasks.length,
    completedDiff: current.completedTasks.length - previous.completedTasks.length,
    clearanceRate,
  }
}

function buildTrendBuckets(gran: FlowTrendGranularity, now: Date): Array<{
  key: string
  label: string
  range: PeriodRange
}> {
  const result: Array<{ key: string; label: string; range: PeriodRange }> = []
  if (gran === 'week') {
    const base = getPeriodRange('week', now).start
    for (let i = 7; i >= 0; i--) {
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i * 7, 0, 0, 0, 0)
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999)
      const startStr = toLocalDateString(start)
      const endStr = toLocalDateString(end)
      const label = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`
      result.push({
        key: startStr,
        label,
        range: { start, end, startDateStr: startStr, endDateStr: endStr },
      })
    }
    return result
  }

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    const startStr = toLocalDateString(start)
    const endStr = toLocalDateString(end)
    const label = `${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getFullYear()).slice(2)}`
    result.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label,
      range: { start, end, startDateStr: startStr, endDateStr: endStr },
    })
  }
  return result
}

export function computeCreatedVsResolvedSeries(
  tasks: readonly RawTask[],
  gran: FlowTrendGranularity,
  now: Date = new Date(),
): FlowTrendSummary {
  const buckets = buildTrendBuckets(gran, now)
  const points: FlowTrendPoint[] = buckets.map((b) => ({
    key: b.key,
    label: b.label,
    rangeLabel: `${b.range.startDateStr} ~ ${b.range.endDateStr}`,
    startDateStr: b.range.startDateStr,
    endDateStr: b.range.endDateStr,
    created: 0,
    completed: 0,
    delta: 0,
    createdTasks: [],
    completedTasks: [],
  }))

  for (const task of tasks) {
    const created = parseLocalDateTime(task.createdAt)
    if (created) {
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i]!
        if (created >= b.range.start && created <= b.range.end) {
          points[i]!.created += 1
          points[i]!.createdTasks.push(task)
          break
        }
      }
    }
    if (isTaskCompleted(task) && task.finish_date) {
      const finished = parseLocalDateTime(task.finish_date)
      if (finished) {
        for (let i = 0; i < buckets.length; i++) {
          const b = buckets[i]!
          if (finished >= b.range.start && finished <= b.range.end) {
            points[i]!.completed += 1
            points[i]!.completedTasks.push(task)
            break
          }
        }
      }
    }
  }

  let totalCreated = 0
  let totalCompleted = 0
  for (const p of points) {
    p.delta = p.created - p.completed
    totalCreated += p.created
    totalCompleted += p.completed
  }

  const count = Math.max(1, points.length)
  return {
    gran,
    points,
    avgCreated: roundOneDecimal(totalCreated / count),
    avgCompleted: roundOneDecimal(totalCompleted / count),
    totalDelta: totalCreated - totalCompleted,
  }
}

export function computeOverdueAgingStats(
  tasks: readonly RawTask[],
  now: Date = new Date(),
): OverdueAgingStats {
  const nowMs = now.getTime()
  const bucketMap: Record<OverdueBucketKey, RawTask[]> = {
    '1_3': [],
    '4_7': [],
    '8_14': [],
    over_14: [],
  }

  let pausedCount = 0
  let openAgeSumDays = 0
  let openAgeCount = 0
  const overdueItems: LongestOverdueItem[] = []

  for (const task of tasks) {
    const status = deriveTaskStatus(task, now)
    const isDone = status === 'completed_ontime' || status === 'late_completed'
    if (isDone) continue

    if (isTaskPaused(task)) {
      pausedCount += 1
      continue
    }

    const created = parseLocalDateTime(task.createdAt)
    if (created) {
      openAgeSumDays += Math.max(0, (nowMs - created.getTime()) / MS_PER_DAY)
      openAgeCount += 1
    }

    if (status === 'delayed_pending') {
      const due = parseLocalDateTime(task.due_date)
      const overdueDays = due ? Math.max(1, Math.ceil((nowMs - due.getTime()) / MS_PER_DAY)) : 1
      overdueItems.push({ task, overdueDays })
      if (overdueDays <= 3) bucketMap['1_3'].push(task)
      else if (overdueDays <= 7) bucketMap['4_7'].push(task)
      else if (overdueDays <= 14) bucketMap['8_14'].push(task)
      else bucketMap.over_14.push(task)
    }
  }

  overdueItems.sort((a, b) => b.overdueDays - a.overdueDays || a.task.id - b.task.id)
  const overdueCount = overdueItems.length
  const bucketOrder: readonly OverdueBucketKey[] = ['1_3', '4_7', '8_14', 'over_14']

  return {
    overdueCount,
    pausedCount,
    avgOpenAgeDays: openAgeCount > 0 ? roundOneDecimal(openAgeSumDays / openAgeCount) : null,
    maxOverdueDays: overdueItems.length > 0 ? overdueItems[0]!.overdueDays : null,
    buckets: bucketOrder.map((key) => {
      const list = bucketMap[key]
      return {
        key,
        count: list.length,
        percent: overdueCount > 0 ? Math.round((list.length / overdueCount) * 100) : 0,
        tasks: list,
      }
    }),
    longestTasks: overdueItems.slice(0, 5),
  }
}

export function computeDeptPeopleStatusMatrix(
  tasks: readonly RawTask[],
  now: Date = new Date(),
): DeptMemberStatusRow[] {
  const map = new Map<string, DeptMemberStatusRow>()

  for (const task of tasks) {
    const status = deriveTaskStatus(task, now)
    const isDone = status === 'completed_ontime' || status === 'late_completed'
    const paused = !isDone && isTaskPaused(task)

    for (const person of parseAssigneeList(task.assign_person)) {
      const key = person.toLowerCase()
      const row = map.get(key) ?? {
        name: person,
        notStarted: 0,
        inProgress: 0,
        overdue: 0,
        paused: 0,
        completed: 0,
        open: 0,
        total: 0,
      }
      row.total += 1
      if (isDone) {
        row.completed += 1
      } else {
        row.open += 1
        if (paused) row.paused += 1
        else if (status === 'delayed_pending') row.overdue += 1
        else if (status === 'not_started') row.notStarted += 1
        else row.inProgress += 1
      }
      map.set(key, row)
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.overdue - a.overdue || b.open - a.open || b.total - a.total || a.name.localeCompare(b.name),
  )
}

/**
 * Computes period-aligned assignee ranking using the unified on-time formula:
 * ontimeRate = ontime / completed (for tasks completed within the selected period, excluding paused).
 */
export function computePeriodAssigneeRanking(
  tasks: readonly RawTask[],
  period: DashboardPeriod,
  now: Date = new Date(),
): PeriodAssigneeRankRow[] {
  const range = getPeriodRange(period, now)
  const bucket = new Map<
    string,
    { assignee: string; completed: number; ontime: number; late: number; overdue: number }
  >()

  for (const task of tasks) {
    if (isTaskPaused(task)) continue
    const status = deriveTaskStatus(task, now)
    const isDone = status === 'completed_ontime' || status === 'late_completed'

    let inPeriod = false
    if (isDone && task.finish_date) {
      const finished = parseLocalDateTime(task.finish_date)
      inPeriod = Boolean(finished && finished >= range.start && finished <= range.end)
    } else if (status === 'delayed_pending') {
      const due = parseLocalDateTime(task.due_date)
      const created = parseLocalDateTime(task.createdAt)
      const ref = due ?? created
      inPeriod = Boolean(ref && ref >= range.start && ref <= range.end)
    }
    if (!inPeriod) continue

    for (const assignee of parseAssigneeList(task.assign_person)) {
      const key = assignee.toLowerCase()
      const entry = bucket.get(key) ?? { assignee, completed: 0, ontime: 0, late: 0, overdue: 0 }
      if (status === 'completed_ontime') {
        entry.completed += 1
        entry.ontime += 1
      } else if (status === 'late_completed') {
        entry.completed += 1
        entry.late += 1
      } else if (status === 'delayed_pending') {
        entry.overdue += 1
      }
      bucket.set(key, entry)
    }
  }

  return Array.from(bucket.values())
    .filter((entry) => entry.completed > 0)
    .map((entry) => ({
      ...entry,
      ontimeRate: roundOneDecimal((entry.ontime / entry.completed) * 100),
    }))
    .sort(
      (a, b) =>
        b.ontimeRate - a.ontimeRate ||
        b.completed - a.completed ||
        a.overdue - b.overdue ||
        a.assignee.localeCompare(b.assignee),
    )
}

export interface TaskDrilldownQuery {
  scope?: DashboardScopeMode
  department?: string
  status?: string
  site?: string
  levelRaw?: string
  taskType?: string
  fromDate?: string
  toDate?: string
  search?: string
}

export function buildTaskDrilldownUrl(baseRoute: string, query: TaskDrilldownQuery): string {
  const qs = new URLSearchParams()
  if (query.scope) qs.set('scope', query.scope)
  if (query.department) qs.set('department', query.department)
  if (query.status) qs.set('status', query.status)
  if (query.site) qs.set('site', query.site)
  if (query.levelRaw) {
    const code = getTaskLevelCode(query.levelRaw)
    if (code) qs.set('level', code)
  }
  if (query.taskType) qs.set('taskType', query.taskType)
  if (query.fromDate) qs.set('fromDate', query.fromDate)
  if (query.toDate) qs.set('toDate', query.toDate)
  if (query.search) qs.set('search', query.search)
  const str = qs.toString()
  return str ? `${baseRoute}?${str}` : baseRoute
}
