import {
  LESSON_KEYWORD_CHAR_MAX,
  LESSON_KEYWORD_MAX,
  type RawLesson,
} from '@/schemas/lesson'
import type { RawAttachment, RawTask } from '@/schemas/task'
import {
  deriveTaskStatus,
  normalizeT2S,
  parseAttachments,
  parseLocalDateTime,
} from '@/utils/task-domain'

export type LessonListFilter = 'all' | 'hit' | 'mine'

export type MatchedLessonTask = {
  task: RawTask
  matchedKeywords: string[]
  isCompleted: boolean
}

export type HighlightSegment = {
  text: string
  highlighted: boolean
}

const HAN_CHAR_REGEX = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/
const KEYWORD_SPLIT_REGEX = /[,，、;；|\r\n]+/

export function normalizeLessonText(value: string | null | undefined): string {
  if (!value) return ''
  return normalizeT2S(String(value).normalize('NFKC').toLowerCase())
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseLessonKeywords(
  lesson: Pick<RawLesson, 'keyword_list' | 'keywords'>,
): string[] {
  if (Array.isArray(lesson.keyword_list) && lesson.keyword_list.length > 0) {
    return lesson.keyword_list.map((k) => k.trim()).filter(Boolean)
  }
  return String(lesson.keywords ?? '')
    .split(KEYWORD_SPLIT_REGEX)
    .map((k) => k.trim())
    .filter(Boolean)
}

export function parseLessonImages(lesson: Pick<RawLesson, 'images'>): RawAttachment[] {
  return parseAttachments(lesson.images)
}

export function parseRawKeywordsInput(raw: string): string[] {
  return String(raw ?? '')
    .split(KEYWORD_SPLIT_REGEX)
    .map((item) => item.trim().replace(/\s+/g, ' ').slice(0, LESSON_KEYWORD_CHAR_MAX))
    .filter(Boolean)
}

export function mergeKeywords(
  existing: readonly string[],
  incoming: readonly string[],
  max = LESSON_KEYWORD_MAX,
): { next: string[]; added: number; reachedLimit: boolean } {
  const next = [...existing]
  let added = 0
  let reachedLimit = false

  for (const kw of incoming) {
    if (next.length >= max) {
      reachedLimit = true
      break
    }
    const norm = normalizeLessonText(kw)
    if (!norm) continue
    const duplicate = next.some(
      (item) => item.toLowerCase() === kw.toLowerCase() || normalizeLessonText(item) === norm,
    )
    if (duplicate) continue
    next.push(kw)
    added += 1
  }

  return { next, added, reachedLimit }
}

export function findShortLatinKeywords(keywords: readonly string[]): string[] {
  return keywords.filter((kw) => kw.length < 2 && !HAN_CHAR_REGEX.test(kw))
}

export function buildTaskNormText(task: RawTask): string {
  const combined = [
    task.title,
    task.title_vn,
    task.content,
    task.content_vn,
    task.precautions,
    task.task_type,
    task.install_req,
  ]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join('\n')
  return normalizeLessonText(combined)
}

type NormalizedTaskEntry = {
  task: RawTask
  norm: string
  isCompleted: boolean
}

export type LessonHitIndex = {
  hitsById: Map<number, MatchedLessonTask[]>
  hitCountById: Map<number, number>
  openHitCountById: Map<number, number>
}

function buildNormalizedTaskEntries(tasks: readonly RawTask[]): NormalizedTaskEntry[] {
  const entries: NormalizedTaskEntry[] = []
  for (const task of tasks) {
    const norm = buildTaskNormText(task)
    if (!norm) continue
    const status = deriveTaskStatus(task)
    entries.push({
      task,
      norm,
      isCompleted: status === 'completed_ontime' || status === 'late_completed',
    })
  }
  return entries
}

function matchEntriesForKeywords(
  entries: readonly NormalizedTaskEntry[],
  keywords: readonly string[],
): MatchedLessonTask[] {
  const normalizedKws = keywords
    .map((raw) => ({ raw, norm: normalizeLessonText(raw) }))
    .filter((item) => item.norm.length > 0)

  if (normalizedKws.length === 0 || entries.length === 0) return []

  const hits: MatchedLessonTask[] = []
  for (const entry of entries) {
    const matchedKeywords = normalizedKws
      .filter((kw) => entry.norm.includes(kw.norm))
      .map((kw) => kw.raw)

    if (matchedKeywords.length > 0) {
      hits.push({
        task: entry.task,
        matchedKeywords,
        isCompleted: entry.isCompleted,
      })
    }
  }

  return hits.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1
    }
    return b.task.id - a.task.id
  })
}

export function matchTasksForKeywords(
  tasks: readonly RawTask[],
  keywords: readonly string[],
): MatchedLessonTask[] {
  return matchEntriesForKeywords(buildNormalizedTaskEntries(tasks), keywords)
}

export function buildLessonHitIndex(
  lessons: readonly RawLesson[],
  tasks: readonly RawTask[],
): LessonHitIndex {
  const entries = buildNormalizedTaskEntries(tasks)
  const hitsById = new Map<number, MatchedLessonTask[]>()
  const hitCountById = new Map<number, number>()
  const openHitCountById = new Map<number, number>()

  for (const lesson of lessons) {
    const hits = matchEntriesForKeywords(entries, parseLessonKeywords(lesson))
    hitsById.set(lesson.id, hits)
    hitCountById.set(lesson.id, hits.length)
    openHitCountById.set(
      lesson.id,
      hits.filter((item) => !item.isCompleted).length,
    )
  }

  return { hitsById, hitCountById, openHitCountById }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function splitHighlightedText(
  text: string,
  keywords: readonly string[],
): HighlightSegment[] {
  if (!text) return []
  const unique = Array.from(new Set(keywords.map((k) => k.trim()).filter(Boolean))).sort(
    (a, b) => b.length - a.length,
  )
  if (unique.length === 0) {
    return [{ text, highlighted: false }]
  }

  const regex = new RegExp(`(${unique.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(regex).filter((part) => part.length > 0)
  const lowerSet = new Set(unique.map((k) => k.toLowerCase()))

  return parts.map((part) => ({
    text: part,
    highlighted: lowerSet.has(part.toLowerCase()),
  }))
}

export function filterLessons(
  lessons: readonly RawLesson[],
  hitCountById: ReadonlyMap<number, number>,
  filter: LessonListFilter,
  search: string,
  currentUsername?: string | null,
): RawLesson[] {
  const normalizedUser = (currentUsername ?? '').trim().toLowerCase()
  const query = search.trim().toLowerCase()
  const queryNorm = query ? normalizeLessonText(query) : ''

  return lessons.filter((lesson) => {
    if (filter === 'mine') {
      if (!normalizedUser || lesson.created_by.trim().toLowerCase() !== normalizedUser) {
        return false
      }
    }
    if (filter === 'hit') {
      if ((hitCountById.get(lesson.id) ?? 0) === 0) {
        return false
      }
    }
    if (!query) return true

    const haystack = [
      String(lesson.id),
      lesson.topic,
      lesson.keywords,
      lesson.content,
      lesson.created_name ?? '',
      lesson.created_by,
    ].join('\n')

    return (
      haystack.toLowerCase().includes(query) ||
      normalizeLessonText(haystack).includes(queryNorm)
    )
  })
}

export function formatLessonAuthor(fullname?: string | null, username?: string | null): string {
  const name = (fullname ?? '').trim()
  const code = (username ?? '').trim()
  if (name && code && name.toLowerCase() !== code.toLowerCase()) {
    return `${name} (${code})`
  }
  return name || code || '-'
}

export function formatLessonDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const dt = parseLocalDateTime(dateStr)
  if (!dt) return dateStr.slice(0, 16)
  const day = String(dt.getDate()).padStart(2, '0')
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const year = dt.getFullYear()
  const hours = String(dt.getHours()).padStart(2, '0')
  const minutes = String(dt.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}
