import { describe, expect, it } from 'vitest'
import {
  deriveTaskStatus,
  getSafeExternalUrl,
  isSystemReporter,
  isTaskPaused,
  isUrgentLevel,
  parseAssigneeList,
  parseAttachments,
  parseLinks,
  parseLocalDateTime,
  parseRecurInts,
  parseReqDepts,
  parseSites,
  parseSplitMembers,
  parseTypeDetail,
  parseWorkItems,
  resolveFileUrl,
  sameDept,
  summarizeSplitMembers,
} from './task-domain'

describe('parseLocalDateTime & deriveTaskStatus', () => {
  it('parses YYYY-MM-DD HH:mm:ss and YYYY-MM-DDTHH:mm in local timezone', () => {
    const d1 = parseLocalDateTime('2026-11-20 19:30:15')
    expect(d1?.getFullYear()).toBe(2026)
    expect(d1?.getMonth()).toBe(10)
    expect(d1?.getDate()).toBe(20)
    expect(d1?.getHours()).toBe(19)
    expect(d1?.getMinutes()).toBe(30)
    expect(d1?.getSeconds()).toBe(15)

    const d2 = parseLocalDateTime('2026-11-20T08:05')
    expect(d2?.getHours()).toBe(8)
    expect(d2?.getMinutes()).toBe(5)

    expect(parseLocalDateTime('')).toBeNull()
  })

  it('derives all 5 mutually exclusive task statuses with correct precedence', () => {
    const now = new Date(2026, 10, 20, 12, 0, 0)

    expect(deriveTaskStatus({ progress: 0, due_date: '2026-11-21T19:00' }, now)).toBe(
      'not_started',
    )
    expect(deriveTaskStatus({ progress: 45, due_date: '2026-11-21T19:00' }, now)).toBe(
      'in_progress',
    )
    expect(deriveTaskStatus({ progress: 0, due_date: '2026-11-19T19:00' }, now)).toBe(
      'delayed_pending',
    )
    expect(
      deriveTaskStatus(
        {
          progress: 100,
          due_date: '2026-11-20 19:00:00',
          finish_date: '2026-11-20 18:00:00',
        },
        now,
      ),
    ).toBe('completed_ontime')
    expect(
      deriveTaskStatus(
        {
          progress: 100,
          due_date: '2026-11-20 19:00:00',
          finish_date: '2026-11-20 19:01:00',
        },
        now,
      ),
    ).toBe('late_completed')
    // Missing due_date when 100% counts as completed_ontime
    expect(deriveTaskStatus({ progress: 100, due_date: null }, now)).toBe('completed_ontime')
  })

  it('treats paused as orthogonal and never paused once progress === 100', () => {
    expect(isTaskPaused({ paused: 1, progress: 50 })).toBe(true)
    expect(isTaskPaused({ paused: 1, progress: 100 })).toBe(false)
    expect(isTaskPaused({ paused: 0, progress: 50 })).toBe(false)
  })
})

describe('encoded field decoders', () => {
  it('parses assignees with multiple delimiters, case-insensitive dedup, and max cap', () => {
    expect(parseAssigneeList('tom, Mary、TOM; alice\nbob')).toEqual([
      'tom',
      'Mary',
      'alice',
      'bob',
    ])
    expect(parseAssigneeList('a,b,c,d', 2)).toEqual(['a', 'b'])
  })

  it('parses uppercase site codes', () => {
    expect(parseSites('ys, ya / FS1 | ys')).toEqual(['YS', 'YA', 'FS1'])
  })

  it('merges req_dept + req_depts and deduplicates Traditional/Simplified variants', () => {
    expect(sameDept('資訊部', '资讯部')).toBe(true)
    expect(sameDept('製造部', '制造部')).toBe(true)
    expect(sameDept('資訊部', '製造部')).toBe(false)

    expect(parseReqDepts('资讯部|製造部', '資訊部')).toEqual(['資訊部', '製造部'])
  })

  it('parses attachments JSON safely and rejects malformed input', () => {
    expect(
      parseAttachments('[{"name":"a.png","path":"/uploads/a.png","size":123}]'),
    ).toEqual([{ name: 'a.png', path: '/uploads/a.png', size: 123 }])
    expect(parseAttachments('{bad-json')).toEqual([])
  })

  it('parses and summarizes split_members', () => {
    const members = parseSplitMembers(
      '101|tom|50|0|;102|mary|100|1|2026-11-19 16:00;103|an|25|1|',
    )
    expect(members).toEqual([
      { id: 101, assignee: 'tom', progress: 50, paused: false, finish_date: '' },
      {
        id: 102,
        assignee: 'mary',
        progress: 100,
        paused: false,
        finish_date: '2026-11-19 16:00',
      },
      { id: 103, assignee: 'an', progress: 25, paused: true, finish_date: '' },
    ])
    expect(summarizeSplitMembers(members)).toEqual({
      total: 3,
      done: 1,
      avgProgress: 58,
    })
  })

  it('parses type_detail and work_items with id backfill', () => {
    expect(parseTypeDetail('{"repair":["WIFI"]}')).toEqual({ repair: ['WIFI'] })
    expect(parseTypeDetail('invalid')).toEqual({})

    const wi = parseWorkItems(
      JSON.stringify({
        v: 1,
        rule: 'sun',
        items: [{ topic: 'Phase 1', owner: 'tom', start: '2026-11-01', end: '2026-11-05' }],
      }),
    )
    expect(wi?.items[0]?.id).toBe('n1')
    expect(wi?.items[0]?.topic).toBe('Phase 1')
    expect(parseWorkItems('{"v":1,"items":[]}')).toBeNull()
  })

  it('sanitizes external links and attachment URLs against javascript: scheme', () => {
    expect(resolveFileUrl('uploads/a.png')).toBe('/uploads/a.png')
    expect(resolveFileUrl('javascript:alert(1)')).toBe('')
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(getSafeExternalUrl('km.corp.local/doc/1')).toBe('https://km.corp.local/doc/1')
    expect(parseLinks('https://a.com javascript:evil() b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ])
  })

  it('parses recurring integers and identifies system reporters & urgent levels', () => {
    expect(parseRecurInts('5, 1, 3, 99, 1', 1, 7)).toEqual([1, 3, 5])
    expect(isSystemReporter('system')).toBe(true)
    expect(isSystemReporter('系統')).toBe(true)
    expect(isSystemReporter('hieu')).toBe(false)
    expect(isUrgentLevel('緊急件 / Khẩn cấp')).toBe(true)
    expect(isUrgentLevel('一般件 / Bình thường')).toBe(false)
  })
})
