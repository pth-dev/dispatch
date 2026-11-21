import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import type { StatusKey } from '@/components/ui/status-text'
import type { RawTask } from '@/schemas/task'
import {
  deriveTaskStatus,
  isRecurNeedsReportToday,
  isTaskPaused,
  isUrgentLevel,
  parseLocalDateTime,
  parseSites,
  toLocalDateString,
} from '@/utils/task-domain'
import {
  formatAssigneeListWithNames,
  formatUserWithCode,
  lookupUserDept,
} from '../hooks/use-user-display-resolver'
import { formatTaskDueDate, parseLastReportSummary } from './task-display'

export const EMPTY_DISPLAY_VALUE = '—'

export type TaskCardDueTone = 'default' | 'warning' | 'destructive'

export type TaskCardViewModel = {
  id: number
  code: string
  site: string
  status: StatusKey
  isUrgent: boolean
  category: string
  title: string
  translatedTitle: string | null
  isUntranslated: boolean
  dueAt: string
  dueTone: TaskCardDueTone
  lastReportAt: string
  assigneeDisplay: string
  dispatcherDisplay: string
  progressPercent: number
  needsReportToday: boolean
  lessonHits?: LessonMarqueeHit[]
}

export type TaskCardResolvers = {
  resolveDeptName: (rawDept: string | null | undefined) => string
  resolveSiteName: (code: string) => string
  resolveUser?: (codeOrName: string | null | undefined, explicitFullname?: string | null) => string
  resolveUserDept?: (codeOrName: string | null | undefined, explicitDept?: string | null) => string
  resolveAssignees?: (rawAssignees: string | null | undefined) => string
}

function joinPresent(parts: Array<string | null | undefined>): string {
  const cleaned = parts
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0 && p !== '-' && p !== EMPTY_DISPLAY_VALUE)
  return cleaned.length > 0 ? cleaned.join(' • ') : EMPTY_DISPLAY_VALUE
}

function formatDueDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return EMPTY_DISPLAY_VALUE
  const formatted = formatTaskDueDate(dateStr)
  return formatted === '-' ? EMPTY_DISPLAY_VALUE : formatted
}

function isDueToday(dateStr: string | null | undefined, now: Date): boolean {
  if (!dateStr) return false
  const parsed = parseLocalDateTime(dateStr)
  if (!parsed) return dateStr.trim().slice(0, 10) === toLocalDateString(now)
  return toLocalDateString(parsed) === toLocalDateString(now)
}

export function mapTaskToCardViewModel(
  task: RawTask,
  resolvers: TaskCardResolvers,
  now: Date = new Date(),
): TaskCardViewModel {
  const progressPercent = Math.min(100, Math.max(0, Math.round(task.progress)))
  const paused = isTaskPaused(task)
  const derived = deriveTaskStatus(task, now)
  const dueToday = isDueToday(task.due_date, now)
  const recurNeedsToday = isRecurNeedsReportToday(task, now)
  const needsReportToday =
    recurNeedsToday || (!paused && progressPercent < 100 && dueToday)

  const status: StatusKey = paused ? 'paused' : derived

  let dueTone: TaskCardDueTone = 'default'
  if (progressPercent < 100) {
    if (derived === 'delayed_pending') dueTone = 'destructive'
    else if (dueToday || needsReportToday) dueTone = 'warning'
  }

  const sites = parseSites(task.site).map(resolvers.resolveSiteName)
  const site = sites.length > 0 ? sites.join(', ') : EMPTY_DISPLAY_VALUE

  const category = (task.task_type ?? '').trim() || EMPTY_DISPLAY_VALUE
  const translatedTitle = (task.title_vn ?? '').trim() || null
  const isUntranslated = translatedTitle === null

  const lastReport = parseLastReportSummary(task)
  const lastReportAt = lastReport?.at || EMPTY_DISPLAY_VALUE

  const resolveUser =
    resolvers.resolveUser ?? ((code, name) => formatUserWithCode(code, name))
  const resolveUserDept =
    resolvers.resolveUserDept ?? ((code, dept) => lookupUserDept(code, dept))
  const resolveAssignees =
    resolvers.resolveAssignees ?? ((raw) => formatAssigneeListWithNames(raw))

  // 1. Người nhận: Tên người nhận (Mã) • BP Nhận
  const assigneeNames = resolveAssignees(task.assign_person)
  const assigneeDept = task.assigned_unit ? resolvers.resolveDeptName(task.assigned_unit) : ''
  const assigneeDisplay = joinPresent([assigneeNames, assigneeDept])

  // 2. Người giao: Tên người giao (Mã) • BP Người giao
  const dispatcherName = resolveUser(task.reporter, task.reporter_name)
  const rawDispatcherDept = resolveUserDept(task.reporter, task.reporter_dept)
  const dispatcherDept = rawDispatcherDept ? resolvers.resolveDeptName(rawDispatcherDept) : ''
  const dispatcherDisplay = joinPresent([dispatcherName, dispatcherDept])

  return {
    id: task.id,
    code: `#${task.id}`,
    site,
    status,
    isUrgent: isUrgentLevel(task.level),
    category,
    title: task.title,
    translatedTitle,
    isUntranslated,
    dueAt: formatDueDateTime(task.due_date),
    dueTone,
    lastReportAt,
    assigneeDisplay,
    dispatcherDisplay,
    progressPercent,
    needsReportToday,
  }
}
