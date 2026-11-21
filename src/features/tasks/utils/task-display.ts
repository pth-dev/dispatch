import type { RawTask } from '@/schemas/task'
import {
  isSystemReporter,
  parseLocalDateTime,
  parseWorkItems,
} from '@/utils/task-domain'

export function formatTaskDueDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const dt = parseLocalDateTime(dateStr)
  if (!dt) return dateStr.slice(0, 10)
  const day = String(dt.getDate()).padStart(2, '0')
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const year = dt.getFullYear()
  return `${day}/${month}/${year}`
}

export type LastReportSummary = {
  at: string
  who: string
  progress: string
  text: string
}

export function parseLastReportSummary(task: Pick<RawTask, 'last_report' | 'last_report_meta'>): LastReportSummary | null {
  const metaRaw = typeof task.last_report_meta === 'string' ? task.last_report_meta : ''
  const parts = metaRaw.split('|')
  const rawAt = (parts[0] ?? '').trim()
  const who = (parts[1] ?? '').trim()
  const rawProgress = (parts[2] ?? '').trim()

  if (who && isSystemReporter(who)) return null

  const text = typeof task.last_report === 'string' ? task.last_report.replace(/\r\n?/g, '\n').trim() : ''
  if (!text && !rawAt) return null

  return {
    at: rawAt ? formatTaskDueDate(rawAt) : '',
    who,
    progress: rawProgress ? `${rawProgress}%` : '',
    text,
  }
}

export function getWorkItemsSummary(task: Pick<RawTask, 'work_items'>): {
  count: number
  firstTopic: string
} | null {
  const parsed = parseWorkItems(task.work_items)
  if (!parsed || parsed.items.length === 0) return null
  return {
    count: parsed.items.length,
    firstTopic: parsed.items[0]?.topic.trim() ?? '',
  }
}

export type TaskGroup = {
  typeLabel: string
  totalInType: number
  tasks: RawTask[]
}

export function groupTasksByType(
  visibleTasks: RawTask[],
  allSectionTasks: RawTask[],
  uncategorizedLabel: string,
): TaskGroup[] {
  const totalsByType = new Map<string, number>()
  for (const task of allSectionTasks) {
    const key = (task.task_type ?? '').trim() || uncategorizedLabel
    totalsByType.set(key, (totalsByType.get(key) ?? 0) + 1)
  }

  const grouped = new Map<string, RawTask[]>()
  for (const task of visibleTasks) {
    const key = (task.task_type ?? '').trim() || uncategorizedLabel
    const bucket = grouped.get(key)
    if (bucket) bucket.push(task)
    else grouped.set(key, [task])
  }

  return Array.from(grouped.entries()).map(([typeLabel, tasks]) => ({
    typeLabel,
    totalInType: totalsByType.get(typeLabel) ?? tasks.length,
    tasks,
  }))
}
