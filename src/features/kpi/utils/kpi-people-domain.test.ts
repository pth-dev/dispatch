import { describe, expect, it } from 'vitest'
import type { DirectoryUser } from '@/schemas/auth'
import { RawTaskSchema, type RawTask } from '@/schemas/task'
import {
  computePeopleKpi,
  computePeopleKpiSummary,
  filterAndSortPeopleKpi,
  getKpiTaskKey,
  getKpiTaskPoints,
  getScopedKpiPeople,
  getTaskFinalDueInfo,
} from './kpi-people-domain'

function makeTask(overrides: Partial<RawTask> = {}): RawTask {
  return RawTaskSchema.parse({
    id: 1,
    title: 'Sample Task',
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

describe('kpi-people-domain', () => {
  const now = new Date(2026, 10, 23, 12, 0, 0)

  it('computes 60/40 KPI score with 1-decimal precision and excludes paused tasks from denominator', () => {
    const tasks: RawTask[] = [
      // Ontime completed = 100 pts
      makeTask({
        id: 1,
        assign_person: 'alice',
        progress: 100,
        due_date: '2026-11-10T18:00',
        finish_date: '2026-11-10 17:00:00',
        first_response_mins: 30,
      }),
      // Late completed = 60 pts
      makeTask({
        id: 2,
        assign_person: 'alice',
        progress: 100,
        due_date: '2026-11-12T18:00',
        finish_date: '2026-11-13 10:00:00',
        first_response_mins: 90,
      }),
      // Overdue incomplete = 0 pts
      makeTask({
        id: 3,
        assign_person: 'alice',
        progress: 40,
        due_date: '2026-11-15T18:00',
        first_response_mins: 45,
      }),
      // Paused -> excluded from total, counted in paused
      makeTask({
        id: 4,
        assign_person: 'alice',
        progress: 20,
        paused: 1,
        due_date: '2026-11-18T18:00',
      }),
    ]

    const rows = computePeopleKpi(tasks, {
      startStr: '2026-11-01',
      endStr: '2026-11-30',
      basis: 'final',
      people: DIRECTORY,
      directory: DIRECTORY,
      now,
    })

    const alice = rows.find((r) => r.username === 'alice')
    expect(alice).toBeDefined()
    expect(alice?.total).toBe(3)
    expect(alice?.paused).toBe(1)
    expect(alice?.completed).toBe(2)
    expect(alice?.ontime).toBe(1)
    expect(alice?.late).toBe(1)
    expect(alice?.overdue).toBe(1)
    expect(alice?.completionRate).toBe(66.7)
    expect(alice?.ontimeRate).toBe(33.3)
    expect(alice?.finalPart).toBe(40)
    expect(alice?.ontimePart).toBe(13.3)
    expect(alice?.score).toBe(53.3)
    expect(alice?.grade.code).toBe('D')
    expect(alice?.responseRate).toBe(66.7)
  })

  it('respects final vs created basis for cross-month tasks', () => {
    const crossMonth = makeTask({
      id: 10,
      assign_person: 'bob',
      progress: 100,
      createdAt: '2026-10-25 09:00:00',
      due_date: '2026-11-05T18:00',
      finish_date: '2026-11-04 16:00:00',
    })

    const byFinal = computePeopleKpi([crossMonth], {
      startStr: '2026-11-01',
      endStr: '2026-11-30',
      basis: 'final',
      directory: DIRECTORY,
      now,
    })
    expect(byFinal[0]?.total).toBe(1)

    const byCreated = computePeopleKpi([crossMonth], {
      startStr: '2026-11-01',
      endStr: '2026-11-30',
      basis: 'created',
      directory: DIRECTORY,
      now,
    })
    expect(byCreated).toHaveLength(0)
  })

  it('counts multi-assignee tasks once per assignee and uses cycle keys for recurring rows', () => {
    const cycleTask = makeTask({
      id: 20,
      assign_person: 'alice, bob',
      progress: 100,
      is_cycle: true,
      cycle_no: 2,
      cycle_date: '2026-11-10',
      due_date: '2026-11-10T17:30',
      finish_date: '2026-11-10 16:00:00',
    })

    expect(getKpiTaskKey(cycleTask)).toBe('20@2026-11-10')
    const rows = computePeopleKpi([cycleTask], {
      startStr: '2026-11-01',
      endStr: '2026-11-30',
      basis: 'final',
      directory: DIRECTORY,
      now,
    })
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.total === 1 && r.score === 100 && r.grade.code === 'A')).toBe(true)
  })

  it('computes single-task points and final due overdue status accurately', () => {
    const ontime = makeTask({ progress: 100, due_date: '2026-11-20T18:00', finish_date: '2026-11-20 12:00:00' })
    const late = makeTask({ progress: 100, due_date: '2026-11-20T18:00', finish_date: '2026-11-21 12:00:00' })
    const open = makeTask({ progress: 50, due_date: '2026-11-20T18:00' })
    const paused = makeTask({ progress: 50, paused: 1, due_date: '2026-11-20T18:00' })
    const unlimitedRec = makeTask({ recur_type: 'weekly', recur_end: '' })

    expect(getKpiTaskPoints(ontime, now)).toBe(100)
    expect(getKpiTaskPoints(late, now)).toBe(60)
    expect(getKpiTaskPoints(open, now)).toBe(0)
    expect(getKpiTaskPoints(paused, now)).toBeNull()

    expect(getTaskFinalDueInfo(open, now).isOverdue).toBe(true)
    expect(getTaskFinalDueInfo(paused, now).isOverdue).toBe(false)
    expect(getTaskFinalDueInfo(unlimitedRec, now).isUnlimited).toBe(true)
  })

  it('scopes people with IT alias & extra_depts and filters/summarizes rows', () => {
    const scoped = getScopedKpiPeople(
      { role: 'admin', dept: '資訊部', extra_depts: [] },
      DIRECTORY,
    )
    expect(scoped.map((u) => u.username)).toEqual(['alice', 'bob'])

    const rows = computePeopleKpi(
      [makeTask({ id: 1, assign_person: 'alice', progress: 100, finish_date: '2026-11-10 10:00:00' })],
      { startStr: '2026-11-01', endStr: '2026-11-30', people: DIRECTORY, directory: DIRECTORY, now },
    )
    const nonEmpty = filterAndSortPeopleKpi(rows, {
      query: '',
      dept: '',
      showEmpty: false,
      sort: 'score',
    })
    expect(nonEmpty).toHaveLength(1)
    const summary = computePeopleKpiSummary(nonEmpty)
    expect(summary.avgScore).toBe(100)
    expect(summary.completionRate).toBe(100)
  })
})
