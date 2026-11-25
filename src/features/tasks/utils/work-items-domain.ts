import type {
  RawReport,
  WorkItem,
  WorkItemsEnvelope,
  WorkItemsRule,
  WorkTopicReportEntry,
} from '@/schemas/task'
import { parseLocalDateTime } from '@/utils/task-domain'

export const WORK_ITEM_WARN_DAYS = 5

export type WorkItemDayCalc = {
  gross: number
  auto: number
  manual: number
  net: number
  hasRangeError: boolean
}

export type WorkItemsSummary = {
  count: number
  calcs: WorkItemDayCalc[]
  gross: number
  auto: number
  manual: number
  deduct: number
  net: number
  shares: number[]
  spanStart: Date | null
  spanEnd: Date | null
  spanDays: number
  spanAuto: number
  spanManual: number
  spanDeduct: number
  spanNet: number
  errorCount: number
}

export type WorkItemWarnLevel = '' | 'over' | 'urgent' | 'warn'

export type WorkItemRemainRow = {
  index: number
  id: string
  topic: string
  end: string
  remain: number
  ok: boolean
  done: boolean
  future: boolean
  level: WorkItemWarnLevel
}

export type WorkItemsRemainingSummary = {
  rows: WorkItemRemainRow[]
  warnings: WorkItemRemainRow[]
  overCount: number
  urgentCount: number
  warnCount: number
  allDone: boolean
  remainNet: number
  remainGross: number
  remainAuto: number
  remainManual: number
  ok: boolean
  future: boolean
  passed: boolean
  farEnd: Date | null
  farTopics: Array<{ index: number; topic: string; end: string }>
}

export type WorkItemReportMark = {
  at: string
  who: string
  progress: number | null
  reportId: number
  early: boolean
}

export type WorkItemReportStat = {
  count: number
  lastAt: string
  lastTaskProgress: number | null
  topicProgress: number | null
  topicLastAt: string
  topicEarly: boolean
  topicDoneAt: string
  marks: WorkItemReportMark[]
}

const MS_PER_DAY = 86_400_000
const WARN_RANK: Record<Exclude<WorkItemWarnLevel, ''>, number> = {
  over: 0,
  urgent: 1,
  warn: 2,
}

export function generateWorkItemId(): string {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function createBlankWorkItem(defaultOu = ''): WorkItem {
  return {
    id: generateWorkItemId(),
    topic: '',
    content: '',
    risk: '',
    owner_ou: defaultOu,
    owner: '',
    agent: '',
    start: '',
    end: '',
    deduct: 0,
  }
}

export function toStartOfDay(value: Date | string | null | undefined): Date | null {
  const dt = value instanceof Date ? value : parseLocalDateTime(value)
  if (!dt || Number.isNaN(dt.getTime())) return null
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

function countRuleOffDays(startDay: Date, dayCount: number, rule: WorkItemsRule): number {
  if (rule === 'none' || dayCount <= 0) return 0
  let offDays = 0
  const cursor = new Date(startDay)
  const limit = Math.min(dayCount, 3700)
  for (let i = 0; i < limit; i++) {
    const wd = cursor.getDay()
    if (wd === 0 || (rule === 'satsun' && wd === 6)) {
      offDays += 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return offDays
}

export function calcWorkItemDays(
  item: Pick<WorkItem, 'start' | 'end' | 'deduct'> | { start?: Date | string; end?: Date | string; deduct?: number },
  rule: WorkItemsRule,
): WorkItemDayCalc {
  const out: WorkItemDayCalc = { gross: 0, auto: 0, manual: 0, net: 0, hasRangeError: false }
  const startDt = item.start instanceof Date ? item.start : parseLocalDateTime(item.start)
  const endDt = item.end instanceof Date ? item.end : parseLocalDateTime(item.end)
  if (!startDt || !endDt) return out
  if (endDt.getTime() < startDt.getTime()) {
    out.hasRangeError = true
    return out
  }
  const d1 = toStartOfDay(startDt)
  const d2 = toStartOfDay(endDt)
  if (!d1 || !d2) return out

  out.gross = Math.round((d2.getTime() - d1.getTime()) / MS_PER_DAY) + 1
  out.auto = countRuleOffDays(d1, out.gross, rule)
  const rawManual = Math.max(0, Number(item.deduct) || 0)
  out.manual = Math.min(rawManual, Math.max(0, out.gross - out.auto))
  out.net = Math.max(0, Number((out.gross - out.auto - out.manual).toFixed(1)))
  return out
}

export function summarizeWorkItems(items: WorkItem[], rule: WorkItemsRule): WorkItemsSummary {
  const calcs = items.map((it) => calcWorkItemDays(it, rule))
  const sumField = (key: 'gross' | 'auto' | 'manual' | 'net') =>
    Number(calcs.reduce((acc, c) => acc + c[key], 0).toFixed(1))

  const gross = sumField('gross')
  const auto = sumField('auto')
  const manual = sumField('manual')
  const net = sumField('net')
  const shares = calcs.map((c) => (net > 0 ? Number(((c.net / net) * 100).toFixed(1)) : 0))

  let spanStart: Date | null = null
  let spanEnd: Date | null = null
  for (const it of items) {
    const s = parseLocalDateTime(it.start)
    const e = parseLocalDateTime(it.end)
    if (s && (!spanStart || s.getTime() < spanStart.getTime())) spanStart = s
    if (e && (!spanEnd || e.getTime() > spanEnd.getTime())) spanEnd = e
  }

  const startDay = toStartOfDay(spanStart)
  const endDay = toStartOfDay(spanEnd)
  const spanDays =
    startDay && endDay && endDay.getTime() >= startDay.getTime()
      ? Math.round((endDay.getTime() - startDay.getTime()) / MS_PER_DAY) + 1
      : 0

  const spanCalc =
    spanStart && spanEnd
      ? calcWorkItemDays({ start: spanStart, end: spanEnd, deduct: manual }, rule)
      : { gross: 0, auto: 0, manual: 0, net: 0, hasRangeError: false }

  const spanAuto = spanDays > 0 ? spanCalc.auto : 0
  const spanManual = spanDays > 0 ? spanCalc.manual : 0
  const spanDeduct = Number((spanAuto + spanManual).toFixed(1))
  const spanNet = spanDays > 0 ? spanCalc.net : 0

  return {
    count: items.length,
    calcs,
    gross,
    auto,
    manual,
    deduct: Number((auto + manual).toFixed(1)),
    net,
    shares,
    spanStart,
    spanEnd,
    spanDays,
    spanAuto,
    spanManual,
    spanDeduct,
    spanNet,
    errorCount: calcs.filter((c) => c.hasRangeError).length,
  }
}

function calcRemainingRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  manual: number,
  gross: number,
  rule: WorkItemsRule,
  today: Date,
  fromToday = false,
): {
  ok: boolean
  net: number
  gross: number
  auto: number
  manual: number
  future: boolean
  passed: boolean
} {
  const out = { ok: false, net: 0, gross: 0, auto: 0, manual: 0, future: false, passed: false }
  const s = toStartOfDay(start)
  const e = toStartOfDay(end)
  if (!s || !e || e.getTime() < s.getTime()) return out
  out.ok = true
  if (e.getTime() < today.getTime()) {
    out.passed = true
    return out
  }
  const from = s.getTime() > today.getTime() && !fromToday ? s : today
  out.future = s.getTime() > today.getTime()
  out.gross = Math.round((e.getTime() - from.getTime()) / MS_PER_DAY) + 1
  out.auto = countRuleOffDays(from, out.gross, rule)
  const proportionalManual =
    gross > 0
      ? Math.round(Math.max(0, manual) * Math.min(1, out.gross / gross) * 2) / 2
      : 0
  out.manual = Number(Math.min(proportionalManual, Math.max(0, out.gross - out.auto)).toFixed(1))
  out.net = Math.max(0, Number((out.gross - out.auto - out.manual).toFixed(1)))
  return out
}

export function calcWorkItemsRemaining(
  items: WorkItem[],
  rule: WorkItemsRule,
  summary: WorkItemsSummary,
  reportStats: Record<string, WorkItemReportStat>,
  now: Date = new Date(),
  isTaskFinished = false,
): WorkItemsRemainingSummary {
  const today = toStartOfDay(now) ?? new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const rows: WorkItemRemainRow[] = items.map((it, index) => {
    const calc = summary.calcs[index]
    const stat = reportStats[it.id]
    const done = isTaskFinished || stat?.topicProgress === 100
    const range = calc?.hasRangeError
      ? { ok: false, net: 0, future: false, passed: false }
      : calcRemainingRange(it.start, it.end, calc?.manual ?? 0, calc?.gross ?? 0, rule, today)

    let level: WorkItemWarnLevel = ''
    if (!done && range.ok) {
      const endDt = parseLocalDateTime(it.end)
      if (endDt && endDt.getTime() < now.getTime()) {
        level = 'over'
      } else if (range.net <= 1) {
        level = 'urgent'
      } else if (range.net < WORK_ITEM_WARN_DAYS) {
        level = 'warn'
      }
    }

    return {
      index,
      id: it.id,
      topic: it.topic,
      end: it.end,
      remain: range.net,
      ok: range.ok,
      done,
      future: range.future,
      level,
    }
  })

  const warnings = rows
    .filter((row): row is WorkItemRemainRow & { level: Exclude<WorkItemWarnLevel, ''> } => row.level !== '')
    .sort(
      (a, b) =>
        WARN_RANK[a.level] - WARN_RANK[b.level] || a.remain - b.remain || a.index - b.index,
    )

  const span = calcRemainingRange(
    summary.spanStart,
    summary.spanEnd,
    summary.spanManual,
    summary.spanDays,
    rule,
    today,
    true,
  )

  const farDay = toStartOfDay(summary.spanEnd)
  const farTopics = farDay
    ? rows
        .filter((row) => {
          const d = toStartOfDay(row.end)
          return d !== null && d.getTime() === farDay.getTime()
        })
        .map((row) => ({ index: row.index, topic: row.topic, end: row.end }))
    : []

  return {
    rows,
    warnings,
    overCount: warnings.filter((w) => w.level === 'over').length,
    urgentCount: warnings.filter((w) => w.level === 'urgent').length,
    warnCount: warnings.filter((w) => w.level === 'warn').length,
    allDone: items.length > 0 && (isTaskFinished || rows.every((row) => row.done)),
    remainNet: span.net,
    remainGross: span.gross,
    remainAuto: span.auto,
    remainManual: span.manual,
    ok: span.ok,
    future: span.future,
    passed: span.passed,
    farEnd: summary.spanEnd,
    farTopics,
  }
}

function clampProgress(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.max(0, Math.min(100, Math.round(num)))
}

export function parseReportWorkTopics(report: Pick<RawReport, 'work_topics'>): WorkTopicReportEntry[] {
  let raw: unknown = report.work_topics
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return []
    }
  }
  if (!Array.isArray(raw)) return []

  const entries: WorkTopicReportEntry[] = []
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      entries.push({ id: item.trim(), progress: null, early: false })
      continue
    }
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const id = typeof rec.id === 'string' ? rec.id.trim() : String(rec.id ?? '').trim()
    if (!id) continue
    const early = Boolean(rec.early && rec.early !== '0')
    entries.push({
      id,
      topic: typeof rec.topic === 'string' ? rec.topic : undefined,
      progress: early ? 100 : clampProgress(rec.progress),
      early,
    })
  }
  return entries
}

export function computeWorkItemReportStats(reports: RawReport[]): Record<string, WorkItemReportStat> {
  const stats: Record<string, WorkItemReportStat> = {}

  for (const report of reports) {
    const topics = parseReportWorkTopics(report)
    const at = report.createdAt || ''
    const who = report.fullname || report.username || ''
    const taskProg = clampProgress(report.progress)

    for (const entry of topics) {
      const existing =
        stats[entry.id] ??
        (stats[entry.id] = {
          count: 0,
          lastAt: '',
          lastTaskProgress: null,
          topicProgress: null,
          topicLastAt: '',
          topicEarly: false,
          topicDoneAt: '',
          marks: [],
        })

      existing.count += 1
      if (!existing.lastAt || at > existing.lastAt) {
        existing.lastAt = at
        existing.lastTaskProgress = taskProg
      }

      const entryProg = entry.progress ?? null
      if (entryProg !== null && (!existing.topicLastAt || at > existing.topicLastAt)) {
        existing.topicLastAt = at
        existing.topicProgress = entryProg
        existing.topicEarly = Boolean(entry.early) && entryProg === 100
        existing.topicDoneAt = entryProg === 100 ? at : ''
      }

      existing.marks.push({
        at,
        who,
        progress: entryProg,
        reportId: report.id,
        early: Boolean(entry.early),
      })
    }
  }

  return stats
}

export function calcWeightedTotalProgress(
  envelope: WorkItemsEnvelope,
  reportStats: Record<string, WorkItemReportStat>,
  overrides: Record<string, number | null> = {},
): { total: number; useEqualWeights: boolean } {
  const { items, rule } = envelope
  if (items.length === 0) return { total: 0, useEqualWeights: true }

  const summary = summarizeWorkItems(items, rule)
  const useEqualWeights = summary.net <= 0
  let total = 0

  items.forEach((item, idx) => {
    const override = overrides[item.id]
    const progress =
      typeof override === 'number'
        ? override
        : (reportStats[item.id]?.topicProgress ?? item.progress ?? 0)
    const weight = useEqualWeights ? 100 / items.length : (summary.shares[idx] ?? 0)
    total += (weight / 100) * progress
  })

  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    useEqualWeights,
  }
}

export function isWorkItemMine(item: Pick<WorkItem, 'owner' | 'agent'>, username?: string | null): boolean {
  const me = (username ?? '').trim().toLowerCase()
  if (!me) return false
  return [item.owner, item.agent].some((field) => field.trim().toLowerCase() === me)
}

export function serializeWorkItemsEnvelope(
  items: WorkItem[],
  rule: WorkItemsRule,
): string {
  const cleaned = items
    .filter((item) => item.topic.trim().length > 0)
    .map((item) => ({
      id: item.id || generateWorkItemId(),
      topic: item.topic.trim().slice(0, 120),
      content: item.content.slice(0, 4000),
      risk: item.risk.slice(0, 4000),
      owner_ou: item.owner_ou.trim().slice(0, 128),
      owner: item.owner.trim().slice(0, 128),
      agent: item.agent.trim().slice(0, 128),
      start: item.start.trim(),
      end: item.end.trim(),
      deduct: Math.max(0, Math.min(999, Math.round((Number(item.deduct) || 0) * 2) / 2)),
    }))
  if (cleaned.length === 0) return ''
  return JSON.stringify({ v: 1, rule, items: cleaned })
}
