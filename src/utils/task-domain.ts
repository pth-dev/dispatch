import { z } from 'zod'
import {
  RawAttachmentSchema,
  WorkItemsEnvelopeSchema,
  type DerivedTaskStatus,
  type RawAttachment,
  type RawTask,
  type SplitMember,
  type WorkItem,
  type WorkItemsEnvelope,
} from '@/schemas/task'

/**
 * Common Traditional -> Simplified character pairs observed in department names,
 * task titles, and legacy system fields (`DU_T2S_MAP` subset).
 */
const T2S_CHAR_MAP: Record<string, string> = {
  資: '资',
  訊: '讯',
  製: '制',
  總: '总',
  務: '务',
  財: '财',
  發: '发',
  業: '业',
  質: '质',
  採: '采',
  購: '购',
  廠: '厂',
  電: '电',
  腦: '脑',
  網: '网',
  機: '机',
  關: '关',
  統: '统',
  計: '计',
  劃: '划',
  產: '产',
  銷: '销',
  運: '运',
  輸: '输',
  倉: '仓',
  庫: '库',
  儲: '储',
  衛: '卫',
  環: '环',
  醫: '医',
  療: '疗',
  經: '经',
  營: '营',
  審: '审',
  規: '规',
  專: '专',
  類: '类',
  維: '维',
  護: '护',
  裝: '装',
  設: '设',
  備: '备',
  無: '无',
  報: '报',
  國: '国',
  際: '际',
  區: '区',
  處: '处',
  組: '组',
  課: '课',
  員: '员',
  會: '会',
  議: '议',
  開: '开',
  軟: '软',
  體: '体',
  測: '测',
  試: '试',
}

const SYSTEM_REPORTERS = new Set(['system', '系统', '系統', 'hệ thống'])
const LOCAL_DT_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/

export function normalizeT2S(input: string): string {
  let out = ''
  for (const ch of input) {
    out += T2S_CHAR_MAP[ch] ?? ch
  }
  return out
}

export function normalizeDeptKey(value: string | null | undefined): string {
  if (!value) return ''
  return normalizeT2S(value.normalize('NFKC'))
    .replace(/\s+/g, '')
    .toLowerCase()
}

export function sameDept(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = normalizeDeptKey(a)
  const kb = normalizeDeptKey(b)
  return ka.length > 0 && ka === kb
}

/**
 * Parses backend local datetime strings (`YYYY-MM-DD HH:mm:ss`, `YYYY-MM-DDTHH:mm`,
 * or `YYYY-MM-DD`) in the browser's local timezone without UTC shift.
 */
export function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const match = LOCAL_DT_REGEX.exec(trimmed)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const hour = match[4] ? Number(match[4]) : 0
    const minute = match[5] ? Number(match[5]) : 0
    const second = match[6] ? Number(match[6]) : 0
    const date = new Date(year, month - 1, day, hour, minute, second)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  const fallback = new Date(trimmed)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isTaskCompleted(task: { progress?: number | null }): boolean {
  return Number(task.progress ?? 0) >= 100
}

export function isTaskPaused(task: {
  paused?: number | boolean | null
  progress?: number | null
}): boolean {
  return Number(task.paused ?? 0) === 1 && !isTaskCompleted(task)
}

/**
 * Derives the mutually exclusive task status (precedence: completed > overdue >
 * not_started > in_progress). `paused` is orthogonal and checked via `isTaskPaused`.
 */
export function deriveTaskStatus(
  task: {
    progress?: number | null
    due_date?: string | null
    finish_date?: string | null
  },
  now: Date = new Date(),
): DerivedTaskStatus {
  const progress = Number(task.progress ?? 0)
  const due = parseLocalDateTime(task.due_date)

  if (progress >= 100) {
    const finish = parseLocalDateTime(task.finish_date) ?? now
    if (due && finish.getTime() > due.getTime()) {
      return 'late_completed'
    }
    return 'completed_ontime'
  }

  if (due && due.getTime() < now.getTime()) {
    return 'delayed_pending'
  }

  if (progress <= 0) {
    return 'not_started'
  }

  return 'in_progress'
}

export function parseAssigneeList(raw: string | null | undefined, max = 20): string[] {
  if (!raw) return []
  const parts = raw
    .split(/[,，、;；\r\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const seen = new Set<string>()
  const result: string[] = []
  for (const part of parts) {
    const key = part.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(part)
    if (result.length >= max) break
  }
  return result
}

export function parseSites(raw: string | null | undefined): string[] {
  if (!raw) return []
  const parts = raw
    .split(/[,，;、|/\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)

  return Array.from(new Set(parts))
}

export function parseReqDepts(
  reqDepts: string | null | undefined,
  reqDept?: string | null,
): string[] {
  const candidates: string[] = []
  if (reqDept?.trim()) {
    candidates.push(reqDept.trim())
  }
  if (reqDepts) {
    for (const part of reqDepts.split('|')) {
      const trimmed = part.trim()
      if (trimmed) candidates.push(trimmed)
    }
  }

  const seen = new Set<string>()
  const result: string[] = []
  for (const item of candidates) {
    const key = normalizeDeptKey(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

const AttachmentArraySchema = z.array(RawAttachmentSchema)

export function parseAttachments(
  raw: string | RawAttachment[] | null | undefined,
): RawAttachment[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    const parsed = AttachmentArraySchema.safeParse(raw)
    return parsed.success ? parsed.data : []
  }
  try {
    const json: unknown = JSON.parse(raw)
    const parsed = AttachmentArraySchema.safeParse(json)
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export function resolveFileUrl(filePath: string): string {
  const trimmed = filePath.trim()
  if (!trimmed) return ''
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return ''
  if (trimmed.startsWith('//')) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function getSafeExternalUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) return null
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function parseLinks(raw: string | null | undefined): string[] {
  if (!raw) return []
  const parts = raw
    .split(/[\s,;，；]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  const links: string[] = []
  for (const part of parts) {
    const safe = getSafeExternalUrl(part)
    if (safe) links.push(safe)
  }
  return links
}

/**
 * Decodes `split_members`: semicolon-delimited records of
 * `id|assignee|progress|paused|finish_date`.
 */
export function parseSplitMembers(raw: string | null | undefined): SplitMember[] {
  if (!raw) return []
  const records = raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  const members: SplitMember[] = []
  for (const record of records) {
    const [idStr, assignee, progressStr, pausedStr, finishDate] = record.split('|')
    const id = Number(idStr)
    if (!Number.isFinite(id) || id <= 0) continue
    const progress = Math.min(100, Math.max(0, Number(progressStr ?? 0) || 0))
    members.push({
      id,
      assignee: (assignee ?? '').trim(),
      progress,
      paused: Number(pausedStr ?? 0) === 1 && progress !== 100,
      finish_date: (finishDate ?? '').trim(),
    })
  }
  return members
}

export function summarizeSplitMembers(members: SplitMember[]): {
  total: number
  done: number
  avgProgress: number
} {
  if (members.length === 0) {
    return { total: 0, done: 0, avgProgress: 0 }
  }
  let done = 0
  let sum = 0
  for (const m of members) {
    if (m.progress >= 100) done += 1
    sum += m.progress
  }
  return {
    total: members.length,
    done,
    avgProgress: Math.round(sum / members.length),
  }
}

const TypeDetailRecordSchema = z.record(z.string(), z.array(z.string()))

export function parseTypeDetail(
  raw: string | Record<string, string[]> | null | undefined,
): Record<string, string[]> {
  if (!raw) return {}
  if (typeof raw === 'object') {
    const parsed = TypeDetailRecordSchema.safeParse(raw)
    return parsed.success ? parsed.data : {}
  }
  try {
    const json: unknown = JSON.parse(raw)
    const parsed = TypeDetailRecordSchema.safeParse(json)
    return parsed.success ? parsed.data : {}
  } catch {
    return {}
  }
}

const LooseWorkItemSchema = z.object({
  id: z.string().optional(),
  topic: z.string().nullish(),
  content: z.string().nullish(),
  risk: z.string().nullish(),
  owner: z.string().nullish(),
  agent: z.string().nullish(),
  start: z.string().nullish(),
  end: z.string().nullish(),
  deduct: z.coerce.number().nullish(),
  progress: z.coerce.number().nullish(),
})

const LooseWorkItemsEnvelopeSchema = z.object({
  v: z.number().optional(),
  rule: z.enum(['none', 'sun', 'satsun']).optional(),
  items: z.array(LooseWorkItemSchema).optional(),
})

export function parseWorkItems(
  raw: string | WorkItemsEnvelope | null | undefined,
): WorkItemsEnvelope | null {
  if (!raw) return null

  let candidate: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    try {
      candidate = JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  const parsed = LooseWorkItemsEnvelopeSchema.safeParse(candidate)
  if (!parsed.success || !parsed.data.items || parsed.data.items.length === 0) {
    return null
  }

  const items: WorkItem[] = parsed.data.items.map((item, idx) => ({
    id: item.id && item.id.trim().length > 0 ? item.id : `n${idx + 1}`,
    topic: item.topic ?? '',
    content: item.content ?? '',
    risk: item.risk ?? '',
    owner: item.owner ?? '',
    agent: item.agent ?? '',
    start: item.start ?? '',
    end: item.end ?? '',
    deduct: item.deduct ?? 0,
    progress: item.progress ?? undefined,
  }))

  const normalized = WorkItemsEnvelopeSchema.safeParse({
    v: parsed.data.v ?? 1,
    rule: parsed.data.rule ?? 'sun',
    items,
  })
  return normalized.success ? normalized.data : null
}

export function parseRecurInts(
  raw: string | null | undefined,
  min: number,
  max: number,
): number[] {
  if (!raw) return []
  const nums = raw
    .split(/[,，\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= min && n <= max)
  return Array.from(new Set(nums)).sort((a, b) => a - b)
}

export function isRecurringTask(task: Pick<RawTask, 'recur_type'>): boolean {
  return task.recur_type === 'weekly' || task.recur_type === 'monthly'
}

export function isSystemReporter(username: string | null | undefined): boolean {
  if (!username) return false
  return SYSTEM_REPORTERS.has(username.trim().toLowerCase())
}

export function getTaskLevelCode(level: string | null | undefined): 'critical' | 'urgent' | 'normal' {
  if (!level) return 'normal'
  const lower = normalizeT2S(level).toLowerCase()
  if (
    lower.includes('特急') ||
    lower.includes('critical') ||
    lower.includes('rất gấp') ||
    lower.includes('hỏa tốc')
  ) {
    return 'critical'
  }
  if (
    lower.includes('急') ||
    lower.includes('urgent') ||
    lower.includes('khẩn') ||
    lower.includes('gấp')
  ) {
    return 'urgent'
  }
  return 'normal'
}

export function isUrgentLevel(level: string | null | undefined): boolean {
  return getTaskLevelCode(level) !== 'normal'
}

export function isAssignedToUser(
  task: Pick<RawTask, 'assign_person'>,
  user: { username: string; fullname: string } | null | undefined,
): boolean {
  if (!user) return false
  const assignees = parseAssigneeList(task.assign_person)
  const uname = user.username.trim().toLowerCase()
  const fname = user.fullname.trim().toLowerCase()
  return assignees.some((assignee) => {
    const lower = assignee.trim().toLowerCase()
    return lower === uname || (fname.length > 0 && lower === fname)
  })
}

export function isRecurNeedsReportToday(
  task: Pick<RawTask, 'recur_type' | 'progress' | 'paused' | 'due_date' | 'recur_cycle_date'>,
  now: Date = new Date(),
): boolean {
  if (!isRecurringTask(task)) return false
  if (isTaskPaused(task) || task.progress > 0) return false
  const today = toLocalDateString(now)
  const targetDay = (task.due_date || task.recur_cycle_date || '').trim().slice(0, 10)
  return targetDay === today
}
