import { describe, expect, it } from 'vitest'
import type { RawReport, WorkItem } from '@/schemas/task'
import {
  calcWeightedTotalProgress,
  calcWorkItemDays,
  calcWorkItemsRemaining,
  computeWorkItemReportStats,
  parseReportWorkTopics,
  serializeWorkItemsEnvelope,
  summarizeWorkItems,
} from './work-items-domain'

function makeItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: 'w1',
    topic: 'Phase A',
    content: '',
    risk: '',
    owner_ou: 'IT',
    owner: 'alice',
    agent: '',
    start: '2026-11-02T08:00',
    end: '2026-11-08T17:00',
    deduct: 0,
    ...overrides,
  }
}

describe('work-items-domain', () => {
  it('calculates inclusive gross, weekend auto deductions, manual deduct, and net days', () => {
    // 2026-11-02 (Mon) .. 2026-11-08 (Sun) = 7 days, 1 Sat + 1 Sun
    const item = makeItem({ deduct: 1 })
    expect(calcWorkItemDays(item, 'none')).toEqual({
      gross: 7,
      auto: 0,
      manual: 1,
      net: 6,
      hasRangeError: false,
    })
    expect(calcWorkItemDays(item, 'sun')).toEqual({
      gross: 7,
      auto: 1,
      manual: 1,
      net: 5,
      hasRangeError: false,
    })
    expect(calcWorkItemDays(item, 'satsun')).toEqual({
      gross: 7,
      auto: 2,
      manual: 1,
      net: 4,
      hasRangeError: false,
    })
  })

  it('flags range error when end is before start', () => {
    const res = calcWorkItemDays(
      makeItem({ start: '2026-11-10T08:00', end: '2026-11-08T17:00' }),
      'sun',
    )
    expect(res.hasRangeError).toBe(true)
    expect(res.net).toBe(0)
  })

  it('computes non-overlapping project span and weighted shares', () => {
    const items = [
      makeItem({ id: 'w1', start: '2026-11-02T08:00', end: '2026-11-04T17:00' }), // 3 days
      makeItem({ id: 'w2', start: '2026-11-03T08:00', end: '2026-11-07T17:00' }), // 5 days (no sun)
    ]
    const sm = summarizeWorkItems(items, 'sun')
    expect(sm.spanDays).toBe(6) // Nov 2..7
    expect(sm.net).toBe(8)
    expect(sm.shares).toEqual([37.5, 62.5])
  })

  it('parses work_topics from reports and computes latest topic progress + weighted total', () => {
    const reports: RawReport[] = [
      {
        id: 1,
        task_id: 10,
        username: 'alice',
        createdAt: '2026-11-03 10:00:00',
        progress: 40,
        work_topics: JSON.stringify([{ id: 'w1', progress: 50 }]),
      },
      {
        id: 2,
        task_id: 10,
        username: 'alice',
        createdAt: '2026-11-04 10:00:00',
        progress: 80,
        work_topics: JSON.stringify([{ id: 'w1', progress: 100, early: true }]),
      },
    ]

    expect(parseReportWorkTopics(reports[1]!)).toEqual([
      { id: 'w1', topic: undefined, progress: 100, early: true },
    ])

    const stats = computeWorkItemReportStats(reports)
    expect(stats.w1?.count).toBe(2)
    expect(stats.w1?.topicProgress).toBe(100)
    expect(stats.w1?.topicEarly).toBe(true)

    const items = [
      makeItem({ id: 'w1', start: '2026-11-02T08:00', end: '2026-11-03T17:00' }), // 2 days
      makeItem({ id: 'w2', start: '2026-11-04T08:00', end: '2026-11-05T17:00' }), // 2 days
    ]
    const weighted = calcWeightedTotalProgress({ v: 1, rule: 'sun', items }, stats, { w2: 50 })
    expect(weighted.total).toBe(75)
    expect(weighted.useEqualWeights).toBe(false)
  })

  it('classifies <5 day completion warnings and skips completed items', () => {
    const items = [
      makeItem({ id: 'over', start: '2026-11-01T08:00', end: '2026-11-03T17:00' }),
      makeItem({ id: 'urgent', start: '2026-11-01T08:00', end: '2026-11-05T17:00' }),
      makeItem({ id: 'warn', start: '2026-11-01T08:00', end: '2026-11-07T17:00' }),
      makeItem({ id: 'done', start: '2026-11-01T08:00', end: '2026-11-03T17:00' }),
    ]
    const sm = summarizeWorkItems(items, 'none')
    const now = new Date(2026, 10, 5, 9, 0) // 2026-11-05 09:00
    const stats = computeWorkItemReportStats([
      {
        id: 1,
        task_id: 1,
        username: 'alice',
        createdAt: '2026-11-04 10:00:00',
        work_topics: JSON.stringify([{ id: 'done', progress: 100 }]),
      },
    ])
    const rem = calcWorkItemsRemaining(items, 'none', sm, stats, now, false)
    expect(rem.overCount).toBe(1)
    expect(rem.urgentCount).toBe(1)
    expect(rem.warnCount).toBe(1)
    expect(rem.warnings.map((w) => w.id)).toEqual(['over', 'urgent', 'warn'])
  })

  it('serializes only non-empty topics into envelope JSON', () => {
    const json = serializeWorkItemsEnvelope(
      [makeItem({ id: 'w1', topic: '  Setup  ' }), makeItem({ id: 'w2', topic: '   ' })],
      'satsun',
    )
    const parsed = JSON.parse(json) as { v: number; rule: string; items: WorkItem[] }
    expect(parsed.v).toBe(1)
    expect(parsed.rule).toBe('satsun')
    expect(parsed.items).toHaveLength(1)
    expect(parsed.items[0]?.topic).toBe('Setup')
  })
})
