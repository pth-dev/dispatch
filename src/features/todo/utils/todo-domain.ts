import type { SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import { IsoCalendarDateSchema, type TodoItem } from '@/schemas/todo'
import {
  deriveTaskStatus,
  isAssignedToUser,
  parseLocalDateTime,
  parseReqDepts,
  parseSites,
} from '@/utils/task-domain'

export interface ScheduledTodoTask {
  task: RawTask
  startTime: string
}

export interface TodoCsvHeaders {
  startTime: string
  taskId: string
  title: string
  titleVn: string
  site: string
  level: string
  progress: string
  dueDate: string
  reqDept: string
}

export interface TodoCsvFallbacks {
  timeUnset: string
  noDueDate: string
}

export function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value) return false
  return IsoCalendarDateSchema.safeParse(value).success
}

export function getMyUnfinishedTasks(
  allTasks: readonly RawTask[],
  user: Pick<SessionUser, 'username' | 'fullname'> | null | undefined,
): RawTask[] {
  if (!user) return []
  return allTasks.filter((task) => {
    const status = deriveTaskStatus(task)
    const isCompleted = status === 'completed_ontime' || status === 'late_completed'
    return !isCompleted && isAssignedToUser(task, user)
  })
}

export function splitTodoTasks(
  unfinishedTasks: readonly RawTask[],
  savedItems: readonly TodoItem[],
): {
  selected: ScheduledTodoTask[]
  available: RawTask[]
} {
  const byId = new Map<number, RawTask>()
  for (const task of unfinishedTasks) {
    byId.set(task.id, task)
  }

  const selectedIds = new Set<number>()
  const selected: ScheduledTodoTask[] = []

  for (const item of savedItems) {
    if (selectedIds.has(item.id)) continue
    const task = byId.get(item.id)
    if (!task) continue
    selectedIds.add(item.id)
    selected.push({
      task,
      startTime: item.start_time,
    })
  }

  const available = unfinishedTasks
    .filter((task) => !selectedIds.has(task.id))
    .sort((a, b) => {
      const da = parseLocalDateTime(a.due_date)
      const db = parseLocalDateTime(b.due_date)
      if (!da && !db) return b.id - a.id
      if (!da) return 1
      if (!db) return -1
      return da.getTime() - db.getTime()
    })

  return { selected, available }
}

export function matchesTodoQuery(task: RawTask, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true
  const cleaned = query.replace(/^#/, '')
  return (
    String(task.id).includes(cleaned) ||
    task.title.toLowerCase().includes(query) ||
    (task.title_vn ?? '').toLowerCase().includes(query)
  )
}

export function sortTimelineTasks(
  unfinishedTasks: readonly RawTask[],
  now: Date = new Date(),
): RawTask[] {
  const nowMs = now.getTime()
  return [...unfinishedTasks].sort((a, b) => {
    const da = parseLocalDateTime(a.due_date)
    const db = parseLocalDateTime(b.due_date)
    const timeA = da ? da.getTime() : Number.POSITIVE_INFINITY
    const timeB = db ? db.getTime() : Number.POSITIVE_INFINITY
    const overdueA = da && timeA < nowMs ? 1 : 0
    const overdueB = db && timeB < nowMs ? 1 : 0
    if (overdueA !== overdueB) return overdueB - overdueA
    if (timeA !== timeB) return timeA - timeB
    return b.id - a.id
  })
}

export function formatTodoDueDate(raw: string | null | undefined): string {
  const date = parseLocalDateTime(raw)
  if (!date) return ''
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function escapeCsvCell(value: string): string {
  const flattened = value.replace(/\r?\n/g, ' ')
  const formulaSafe = /^[=+\-@\t\r]/.test(flattened) ? `'${flattened}` : flattened
  if (/[",]/.test(formulaSafe)) {
    return `"${formulaSafe.replace(/"/g, '""')}"`
  }
  return formulaSafe
}

export function buildTodoCsvContent(
  selected: readonly ScheduledTodoTask[],
  headers: TodoCsvHeaders,
  fallbacks: TodoCsvFallbacks,
): string {
  const sorted = [...selected].sort((a, b) => {
    const ta = a.startTime.includes(':') ? a.startTime : '24:00'
    const tb = b.startTime.includes(':') ? b.startTime : '24:00'
    return ta.localeCompare(tb)
  })

  const headerRow = [
    headers.startTime,
    headers.taskId,
    headers.title,
    headers.titleVn,
    headers.site,
    headers.level,
    headers.progress,
    headers.dueDate,
    headers.reqDept,
  ]
    .map(escapeCsvCell)
    .join(',')

  const rows = sorted.map(({ task, startTime }) => {
    const sites = parseSites(task.site).join(', ')
    const reqDepts = parseReqDepts(task.req_depts, task.req_dept).join(', ')
    const due = task.due_date ? formatTodoDueDate(task.due_date) : fallbacks.noDueDate
    return [
      startTime || fallbacks.timeUnset,
      String(task.id),
      task.title,
      task.title_vn ?? '',
      sites,
      task.level ?? '',
      `${task.progress}%`,
      due,
      reqDepts,
    ]
      .map(escapeCsvCell)
      .join(',')
  })

  return `\uFEFF${[headerRow, ...rows].join('\r\n')}`
}

export function downloadTodoCsv(
  selected: readonly ScheduledTodoTask[],
  dateStr: string,
  username: string,
  headers: TodoCsvHeaders,
  fallbacks: TodoCsvFallbacks,
): void {
  const content = buildTodoCsvContent(selected, headers, fallbacks)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const safeUser = (username || 'user').replace(/[^a-zA-Z0-9_-]/g, '_') || 'user'
  link.download = `Daily_Todo_Schedule_${dateStr}_${safeUser}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
