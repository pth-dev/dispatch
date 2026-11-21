import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import type { RawLesson } from '@/schemas/lesson'
import type { RawTask } from '@/schemas/task'
import { normalizeT2S } from './task-domain'

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

type NormalizedLessonEntry = {
  lesson: RawLesson
  keywords: Array<{ raw: string; norm: string }>
}

function buildNormalizedLessonEntries(
  lessons: readonly RawLesson[],
): NormalizedLessonEntry[] {
  const entries: NormalizedLessonEntry[] = []
  for (const lesson of lessons) {
    const keywords = parseLessonKeywords(lesson)
      .map((raw) => ({ raw, norm: normalizeLessonText(raw) }))
      .filter((item) => item.norm.length > 0)
    if (keywords.length > 0) {
      entries.push({ lesson, keywords })
    }
  }
  return entries
}

function matchTaskAgainstLessonEntries(
  task: RawTask,
  lessonEntries: readonly NormalizedLessonEntry[],
): LessonMarqueeHit[] {
  if (lessonEntries.length === 0) return []
  const taskNorm = buildTaskNormText(task)
  if (!taskNorm) return []

  const hits: LessonMarqueeHit[] = []
  for (const entry of lessonEntries) {
    const matchedKeywords = entry.keywords
      .filter((kw) => taskNorm.includes(kw.norm))
      .map((kw) => kw.raw)

    if (matchedKeywords.length > 0) {
      hits.push({
        id: entry.lesson.id,
        topic: entry.lesson.topic,
        matchedKeywords,
        content: entry.lesson.content,
      })
    }
  }
  return hits
}

export function matchLessonsForTask(
  task: RawTask | null | undefined,
  lessons: readonly RawLesson[],
): LessonMarqueeHit[] {
  if (!task || lessons.length === 0) return []
  return matchTaskAgainstLessonEntries(task, buildNormalizedLessonEntries(lessons))
}

export function buildTaskLessonHitsMap(
  tasks: readonly RawTask[],
  lessons: readonly RawLesson[],
): Map<number, LessonMarqueeHit[]> {
  const map = new Map<number, LessonMarqueeHit[]>()
  if (tasks.length === 0 || lessons.length === 0) return map
  const lessonEntries = buildNormalizedLessonEntries(lessons)
  if (lessonEntries.length === 0) return map

  for (const task of tasks) {
    const hits = matchTaskAgainstLessonEntries(task, lessonEntries)
    if (hits.length > 0) {
      map.set(task.id, hits)
    }
  }
  return map
}
