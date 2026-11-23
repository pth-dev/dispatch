import { describe, expect, it } from 'vitest'
import type { DirectoryUser } from '@/schemas/auth'
import { RawReportSchema, RawTaskSchema, type RawTask } from '@/schemas/task'
import {
  aggregateBriefRows,
  buildBriefCaseList,
  buildBriefRows,
  deriveBriefStatus,
  getBriefPlanDate,
  isAssigneeBriefReport,
  isSystemBriefReport,
  matchesBriefView,
} from './kpi-brief-domain'

function makeTask(overrides: Partial<RawTask> = {}): RawTask {
  return RawTaskSchema.parse({
    id: 1,
    title: 'Board Task',
    progress: 0,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    reporter: 'boss',
    assign_person: 'alice',
    due_date: '2026-11-20T18:00',
    createdAt: '2026-11-01 09:00:00',
    ...overrides,
  })
}

const DIRECTORY: DirectoryUser[] = [
  { username: 'alice', fullname: 'Alice Nguyen', dept: '資訊部', site: 'VN' },
  { username: 'bob', fullname: 'Bob Tran', dept: '電腦室', site: 'VN' },
  { username: 'carol', fullname: 'Carol Le', dept: '業務部', site: 'VN' },
]

describe('kpi-brief-domain', () => {
  const now = new Date(2026, 10, 23, 12, 0, 0)

  it('derives mutually exclusive statuses with paused taking highest precedence', () => {
    expect(deriveBriefStatus(makeTask({ paused: 1, due_date: '2026-11-01T10:00' }), now)).toBe('paused')
    expect(
      deriveBriefStatus(
        makeTask({ progress: 100, due_date: '2026-11-20T18:00', finish_date: '2026-11-20 12:00:00' }),
        now,
      ),
    ).toBe('ontime')
    expect(
      deriveBriefStatus(
        makeTask({ progress: 100, due_date: '2026-11-20T18:00', finish_date: '2026-11-22 12:00:00' }),
        now,
      ),
    ).toBe('late')
    expect(deriveBriefStatus(makeTask({ progress: 30, due_date: '2026-11-20T18:00' }), now)).toBe('overdue')
    expect(deriveBriefStatus(makeTask({ progress: 30, due_date: '2026-11-28T18:00' }), now)).toBe('progress')
  })

  it('uses due_date -> recur_end -> createdAt as planDate for month attribution', () => {
    const dueTask = makeTask({ due_date: '2026-08-15T18:00', finish_date: '2026-09-01 10:00:00' })
    expect(getBriefPlanDate(dueTask)?.getMonth()).toBe(7) // August (0-indexed)

    const recTask = makeTask({ due_date: '', recur_type: 'monthly', recur_end: '2026-12-31' })
    expect(getBriefPlanDate(recTask)?.getMonth()).toBe(11)
  })

  it('filters views (dept + extra_depts, me, all, d:<dept>) and merges multi-assignee cases', () => {
    const tasks = [
      makeTask({ id: 101, assign_person: 'alice, bob', progress: 20, due_date: '2026-11-18T12:00' }),
      makeTask({ id: 102, assign_person: 'carol', progress: 100, due_date: '2026-11-10T18:00', finish_date: '2026-11-12 18:00:00' }),
    ]

    const rows = buildBriefRows(tasks, DIRECTORY, 2026, 'Unassigned', now)
    expect(rows).toHaveLength(3)

    const deptUser = { username: 'alice', dept: '資訊部', extra_depts: [] }
    const deptRows = rows.filter((r) => matchesBriefView(r, 'dept', deptUser))
    expect(deptRows).toHaveLength(2)

    const agg = aggregateBriefRows(deptRows)
    expect(agg.total).toBe(2)
    expect(agg.overdue).toBe(2)
    expect(agg.unfinished).toBe(2)

    const unfinished = buildBriefCaseList(deptRows, 'unfinished', { now })
    expect(unfinished).toHaveLength(1)
    expect(unfinished[0]?.names).toEqual(['Alice Nguyen', 'Bob Tran'])
    expect(unfinished[0]?.overdueDays).toBe(5)

    const finished = buildBriefCaseList(rows, 'finished', { now })
    expect(finished).toHaveLength(1)
    expect(finished[0]?.lateDays).toBe(2)
  })

  it('filters out system reports and non-assignee comments for finished task modal', () => {
    const task = makeTask({ id: 50, assign_person: 'Alice Nguyen' })
    const sysRep = RawReportSchema.parse({ id: 1, task_id: 50, username: 'system', content: 'Auto closed', pause_action: 'auto_close', createdAt: '2026-11-20 10:00:00' })
    const otherRep = RawReportSchema.parse({ id: 2, task_id: 50, username: 'carol', fullname: 'Carol Le', content: 'Please check', createdAt: '2026-11-20 11:00:00' })
    const assigneeRep = RawReportSchema.parse({ id: 3, task_id: 50, username: 'alice', fullname: 'Alice Nguyen', content: 'Done!', createdAt: '2026-11-20 12:00:00' })

    expect(isSystemBriefReport(sysRep)).toBe(true)
    expect(isSystemBriefReport(assigneeRep)).toBe(false)
    expect(isAssigneeBriefReport(otherRep, task, DIRECTORY)).toBe(false)
    expect(isAssigneeBriefReport(assigneeRep, task, DIRECTORY)).toBe(true)
  })
})
