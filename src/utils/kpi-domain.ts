import type { RawTask } from '@/schemas/task'
import {
  deriveTaskStatus,
  isRecurringTask,
  isTaskPaused,
  parseAssigneeList,
  parseLocalDateTime,
} from './task-domain'

export type KpiGradeCode = 'A' | 'B' | 'C' | 'D' | '-'
export type KpiGradeTone = 'success' | 'primary' | 'warning' | 'destructive' | 'muted'

export interface KpiGradeInfo {
  code: KpiGradeCode
  tone: KpiGradeTone
}

export interface KpiMetrics {
  /** Eligible tasks (excluding paused) used as denominator. */
  total: number
  completed: number
  ontime: number
  late: number
  inProgress: number
  notStarted: number
  overdue: number
  paused: number
  completionRate: number
  ontimeRate: number
  lateRate: number
  /** Reference-only 1-hour response metrics (not weighted in KPI score). */
  responseTotal: number
  response1hPass: number
  response1hRate: number | null
  /** 0..100 score = round(completionRate * 0.6 + ontimeRate * 0.4), null when total === 0. */
  score: number | null
  grade: KpiGradeInfo
}

export interface PersonLoadRow {
  name: string
  total: number
  open: number
  delayed: number
  done: number
}

export interface DeptTaskSummary {
  total: number
  completed: number
  ontime: number
  late: number
  delayed: number
  progress: number
  notStarted: number
  paused: number
  recur: number
  secret: number
  dueToday: number
  open: number
  completionRate: number
  ontimeRate: number
  people: PersonLoadRow[]
}

export interface AssigneeRankingRow {
  assignee: string
  total: number
  completed: number
  ontime: number
  late: number
  overdue: number
  ontimeRate: number
  completionRate: number
}

type KpiTaskInput = Partial<
  Pick<
    RawTask,
    | 'progress'
    | 'due_date'
    | 'finish_date'
    | 'paused'
    | 'assign_person'
    | 'first_response_mins'
    | 'recur_type'
    | 'confidential'
  >
>

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Matches legacy `DU_kpiGrade` (V16.11.0-r8):
 * A >= 90, B >= 80, C >= 60, D < 60.
 */
export function getKpiGrade(score: number | null | undefined): KpiGradeInfo {
  if (score == null || !Number.isFinite(score)) {
    return { code: '-', tone: 'muted' }
  }
  if (score >= 90) return { code: 'A', tone: 'success' }
  if (score >= 80) return { code: 'B', tone: 'primary' }
  if (score >= 60) return { code: 'C', tone: 'warning' }
  return { code: 'D', tone: 'destructive' }
}

/**
 * Matches legacy `DU_kpiCalc` (V16.11.0-r8):
 * - Paused tasks are excluded from KPI denominator and tracked separately.
 * - Score = round(completionRate * 0.6 + ontimeRate * 0.4), clamped 0..100.
 * - 1H response rate is reference-only and does not deduct points.
 */
export function computeKpiMetrics(
  tasks: readonly KpiTaskInput[],
  now: Date = new Date(),
): KpiMetrics {
  let total = 0
  let completed = 0
  let ontime = 0
  let late = 0
  let inProgress = 0
  let notStarted = 0
  let overdue = 0
  let paused = 0
  let responseTotal = 0
  let response1hPass = 0

  for (const task of tasks) {
    if (isTaskPaused(task)) {
      paused += 1
      continue
    }

    total += 1
    const status = deriveTaskStatus(task, now)
    if (status === 'completed_ontime') {
      completed += 1
      ontime += 1
    } else if (status === 'late_completed') {
      completed += 1
      late += 1
    } else if (status === 'delayed_pending') {
      overdue += 1
    } else if (status === 'not_started') {
      notStarted += 1
    } else {
      inProgress += 1
    }

    if (task.first_response_mins != null && Number.isFinite(Number(task.first_response_mins))) {
      responseTotal += 1
      if (Number(task.first_response_mins) <= 60) {
        response1hPass += 1
      }
    }
  }

  const completionRate = total > 0 ? roundOneDecimal((completed / total) * 100) : 0
  const ontimeRate = total > 0 ? roundOneDecimal((ontime / total) * 100) : 0
  const lateRate = total > 0 ? roundOneDecimal((late / total) * 100) : 0
  const response1hRate =
    responseTotal > 0 ? roundOneDecimal((response1hPass / responseTotal) * 100) : null

  const score =
    total > 0
      ? Math.max(0, Math.min(100, Math.round(completionRate * 0.6 + ontimeRate * 0.4)))
      : null

  return {
    total,
    completed,
    ontime,
    late,
    inProgress,
    notStarted,
    overdue,
    paused,
    completionRate,
    ontimeRate,
    lateRate,
    responseTotal,
    response1hPass,
    response1hRate,
    score,
    grade: getKpiGrade(score),
  }
}

/**
 * Matches legacy `DU_deptTaskSummary` (V16.11.0-r28) for department overview cards
 * and per-person open workload bars.
 */
export function computeDeptTaskSummary(
  tasks: readonly KpiTaskInput[],
  now: Date = new Date(),
): DeptTaskSummary {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  let completed = 0
  let ontime = 0
  let late = 0
  let delayed = 0
  let progress = 0
  let notStarted = 0
  let paused = 0
  let recur = 0
  let secret = 0
  let dueToday = 0

  const peopleMap = new Map<string, PersonLoadRow>()

  for (const task of tasks) {
    const status = deriveTaskStatus(task, now)
    const isDone = status === 'completed_ontime' || status === 'late_completed'

    if (status === 'completed_ontime') {
      completed += 1
      ontime += 1
    } else if (status === 'late_completed') {
      completed += 1
      late += 1
    } else if (status === 'delayed_pending') {
      delayed += 1
    } else if (status === 'not_started') {
      notStarted += 1
    } else {
      progress += 1
    }

    if (isTaskPaused(task)) paused += 1
    if (isRecurringTask({ recur_type: task.recur_type ?? 'once' })) recur += 1
    if (Number(task.confidential ?? 0) >= 1) secret += 1

    const due = parseLocalDateTime(task.due_date)
    if (!isDone && due && due >= todayStart && due < tomorrowStart) {
      dueToday += 1
    }

    for (const assignee of parseAssigneeList(task.assign_person)) {
      const key = assignee.toLowerCase()
      const row = peopleMap.get(key) ?? {
        name: assignee,
        total: 0,
        open: 0,
        delayed: 0,
        done: 0,
      }
      row.total += 1
      if (isDone) {
        row.done += 1
      } else {
        row.open += 1
        if (status === 'delayed_pending') row.delayed += 1
      }
      peopleMap.set(key, row)
    }
  }

  const total = tasks.length
  const people = Array.from(peopleMap.values()).sort(
    (a, b) => b.open - a.open || b.total - a.total || a.name.localeCompare(b.name),
  )

  return {
    total,
    completed,
    ontime,
    late,
    delayed,
    progress,
    notStarted,
    paused,
    recur,
    secret,
    dueToday,
    open: total - completed,
    completionRate: total > 0 ? roundOneDecimal((completed / total) * 100) : 0,
    ontimeRate: total > 0 ? roundOneDecimal((ontime / total) * 100) : 0,
    people,
  }
}

/**
 * Computes efficiency leaderboard rows sorted by on-time completion rate desc,
 * then total assigned tasks desc (paused tasks excluded).
 */
export function computeAssigneeRanking(
  tasks: readonly KpiTaskInput[],
  now: Date = new Date(),
): AssigneeRankingRow[] {
  const bucket = new Map<
    string,
    {
      assignee: string
      total: number
      completed: number
      ontime: number
      late: number
      overdue: number
    }
  >()

  for (const task of tasks) {
    if (isTaskPaused(task)) continue
    const status = deriveTaskStatus(task, now)
    for (const assignee of parseAssigneeList(task.assign_person)) {
      const key = assignee.toLowerCase()
      const entry = bucket.get(key) ?? {
        assignee,
        total: 0,
        completed: 0,
        ontime: 0,
        late: 0,
        overdue: 0,
      }
      entry.total += 1
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
    .map((entry) => ({
      ...entry,
      ontimeRate: entry.total > 0 ? roundOneDecimal((entry.ontime / entry.total) * 100) : 0,
      completionRate: entry.total > 0 ? roundOneDecimal((entry.completed / entry.total) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        b.ontimeRate - a.ontimeRate ||
        b.total - a.total ||
        b.completionRate - a.completionRate ||
        a.assignee.localeCompare(b.assignee),
    )
}
