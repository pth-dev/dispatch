import { describe, expect, it } from 'vitest'
import type { RawLesson } from '@/schemas/lesson'
import type { RawTask } from '@/schemas/task'
import {
  buildTaskLessonHitsMap,
  filterLessons,
  findShortLatinKeywords,
  matchLessonsForTask,
  matchTasksForKeywords,
  mergeKeywords,
  normalizeLessonText,
  parseLessonKeywords,
  splitHighlightedText,
} from './lesson-domain'

function buildTask(overrides: Partial<RawTask> = {}): RawTask {
  return {
    id: 1,
    title: 'Firewall change request',
    content: '',
    precautions: '',
    task_type: '',
    install_req: '',
    progress: 20,
    reporter: '20160',
    assign_person: '15965',
    ...overrides,
  } as RawTask
}

function buildLesson(overrides: Partial<RawLesson> = {}): RawLesson {
  return {
    id: 10,
    topic: 'Firewall policy',
    keywords: 'firewall, VPN',
    content: 'Must get approval first',
    created_by: '20160',
    created_name: 'Phan Trung Hiếu',
    dept: '資訊部',
    ...overrides,
  }
}

describe('lesson-domain', () => {
  it('normalizes full-width characters, traditional-to-simplified Chinese, casing, and whitespace', () => {
    expect(normalizeLessonText('  ＶＰＮ   Config  ')).toBe('vpn config')
    expect(normalizeLessonText('資訊部')).toBe(normalizeLessonText('资讯部'))
  })

  it('parses keywords from keyword_list or delimited string', () => {
    expect(parseLessonKeywords({ keyword_list: ['VPN', 'Firewall'], keywords: '' })).toEqual([
      'VPN',
      'Firewall',
    ])
    expect(parseLessonKeywords({ keywords: 'firewall，VPN；DNS|Proxy' })).toEqual([
      'firewall',
      'VPN',
      'DNS',
      'Proxy',
    ])
  })

  it('merges keywords without case-insensitive duplicates and respects max limit', () => {
    const res = mergeKeywords(['Firewall'], ['firewall', 'VPN', 'DNS'], 2)
    expect(res.next).toEqual(['Firewall', 'VPN'])
    expect(res.added).toBe(1)
    expect(res.reachedLimit).toBe(true)
  })

  it('detects 1-char Latin keywords while allowing single Han characters', () => {
    expect(findShortLatinKeywords(['a', '火', 'VPN'])).toEqual(['a'])
  })

  it('matches tasks across lesson fields and sorts open tasks before completed', () => {
    const tasks = [
      buildTask({ id: 5, title: 'Firewall rule completed', progress: 100 }),
      buildTask({ id: 3, title: 'Routine check', precautions: 'Check VPN tunnel', progress: 40 }),
      buildTask({ id: 8, title: 'Firewall outage', progress: 10 }),
      buildTask({ id: 9, title: 'Unrelated task', progress: 0 }),
    ]

    const hits = matchTasksForKeywords(tasks, ['firewall', 'vpn'])
    expect(hits.map((h) => h.task.id)).toEqual([8, 3, 5])
    expect(hits[0]?.matchedKeywords).toEqual(['firewall'])
    expect(hits[1]?.matchedKeywords).toEqual(['vpn'])
    expect(hits[2]?.isCompleted).toBe(true)
  })

  it('splits text into highlighted segments safely', () => {
    const segments = splitHighlightedText('Update Firewall & VPN rules', ['firewall', 'VPN'])
    expect(segments).toEqual([
      { text: 'Update ', highlighted: false },
      { text: 'Firewall', highlighted: true },
      { text: ' & ', highlighted: false },
      { text: 'VPN', highlighted: true },
      { text: ' rules', highlighted: false },
    ])
  })

  it('filters lessons by all, hit, mine, and search query', () => {
    const lessons = [
      buildLesson({ id: 1, topic: 'Firewall policy', created_by: '20160' }),
      buildLesson({ id: 2, topic: 'Printer maintenance', created_by: '18001' }),
    ]
    const hitCounts = new Map<number, number>([
      [1, 2],
      [2, 0],
    ])

    expect(filterLessons(lessons, hitCounts, 'hit', '', '20160').map((l) => l.id)).toEqual([1])
    expect(filterLessons(lessons, hitCounts, 'mine', '', '18001').map((l) => l.id)).toEqual([2])
    expect(filterLessons(lessons, hitCounts, 'all', 'printer', '20160').map((l) => l.id)).toEqual([
      2,
    ])
  })

  it('matches lessons for a single task and builds a task-to-lessons hit map', () => {
    const lessons = [
      buildLesson({ id: 1, topic: 'Firewall policy', keywords: 'firewall,VPN' }),
      buildLesson({ id: 2, topic: 'Printer guide', keywords: 'printer' }),
    ]
    const task1 = buildTask({ id: 100, title: 'Firewall & VPN setup' })
    const task2 = buildTask({ id: 101, title: 'Unrelated task' })

    const hits = matchLessonsForTask(task1, lessons)
    expect(hits).toHaveLength(1)
    expect(hits[0]?.id).toBe(1)
    expect(hits[0]?.matchedKeywords).toEqual(['firewall', 'VPN'])

    const map = buildTaskLessonHitsMap([task1, task2], lessons)
    expect(map.get(100)?.[0]?.topic).toBe('Firewall policy')
    expect(map.has(101)).toBe(false)
  })
})
