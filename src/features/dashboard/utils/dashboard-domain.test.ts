import { describe, expect, it } from 'vitest'
import type { RawTask } from '@/schemas/task'
import {
  computeBottleneckBreakdowns,
  computePeriodFlow,
  computeResponse1hStats,
  computeSnapshotMetrics,
  computeTodayTodoGroups,
  filterTasksByDeptSet,
} from './dashboard-domain'

const NOW = new Date(2026, 10, 23, 12, 0, 0)

function makeTask(overrides: Partial<RawTask> = {}): RawTask {
  return {
    id: 1,
    title: 'Task',
    reporter: 'admin',
    progress: 0,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    recur_type: 'once',
    assigned_unit: '資訊部',
    reporter_dept: '製造部',
    req_dept: '製造部',
    req_depts: '製造部',
    assign_person: 'staff1',
    site: 'YS',
    level: '一般件',
    task_type: '系統類',
    createdAt: '2026-11-20 09:00:00',
    due_date: '2026-11-23T19:00',
    finish_date: '',
    first_response_mins: 30,
    ...overrides,
  }
}

describe('dashboard-domain', () => {
  it('computes period flow (created vs completed) and backlog delta', () => {
    const tasks = [
      makeTask({ id: 1, createdAt: '2026-11-10 09:00:00', progress: 30, due_date: '2026-11-20T19:00' }),
      makeTask({
        id: 2,
        createdAt: '2026-10-15 09:00:00',
        progress: 100,
        due_date: '2026-11-25T19:00',
        finish_date: '2026-11-21 10:00:00',
      }),
      makeTask({
        id: 3,
        createdAt: '2026-11-18 09:00:00',
        progress: 100,
        due_date: '2026-11-19T19:00',
        finish_date: '2026-11-22 10:00:00',
      }),
    ]

    const flow = computePeriodFlow(tasks, 'month', NOW)
    expect(flow.createdTasks.map((t) => t.id)).toEqual([1, 3])
    expect(flow.completedTasks.map((t) => t.id)).toEqual([2, 3])
    expect(flow.createdOverdue).toBe(1)
    expect(flow.completedOntime).toBe(1)
    expect(flow.completedLate).toBe(1)
    expect(flow.backlogDelta).toBe(0)
  })

  it('computes snapshot metrics and excludes paused tasks from overdue/dueToday', () => {
    const tasks = [
      makeTask({ id: 1, progress: 20, due_date: '2026-11-20T19:00', paused: 0 }),
      makeTask({ id: 2, progress: 20, due_date: '2026-11-20T19:00', paused: 1 }),
      makeTask({ id: 3, progress: 50, due_date: '2026-11-23T18:00', paused: 0 }),
      makeTask({ id: 4, progress: 100, due_date: '2026-11-23T19:00', finish_date: '2026-11-23 11:00:00' }),
    ]

    const snap = computeSnapshotMetrics(tasks, NOW)
    expect(snap.open).toBe(3)
    expect(snap.paused).toBe(1)
    expect(snap.overdue).toBe(1)
    expect(snap.dueToday).toBe(1)
    expect(snap.completed).toBe(1)
    expect(snap.ontimeRate).toBe(100)
  })

  it('computes current-month 1H response stats', () => {
    const tasks = [
      makeTask({ id: 1, createdAt: '2026-11-05 08:00:00', first_response_mins: 45 }),
      makeTask({ id: 2, createdAt: '2026-11-06 08:00:00', first_response_mins: 95 }),
      makeTask({ id: 3, createdAt: '2026-11-07 08:00:00', first_response_mins: null }),
      makeTask({ id: 4, createdAt: '2026-10-20 08:00:00', first_response_mins: 10 }),
    ]
    const stats = computeResponse1hStats(tasks, NOW)
    expect(stats.passTasks.map((t) => t.id)).toEqual([1])
    expect(stats.failTasks.map((t) => t.id)).toEqual([2])
    expect(stats.noResponseTasks.map((t) => t.id)).toEqual([3])
    expect(stats.passRate).toBe(50)
  })

  it('groups today todo tasks, deduplicates allUnique, and excludes paused tasks', () => {
    const tasks = [
      makeTask({ id: 1, due_date: '2026-11-23T18:00', recur_type: 'weekly', assign_person: 'staff1' }),
      makeTask({ id: 2, due_date: '2026-11-20T18:00', assign_person: 'staff1' }),
      makeTask({ id: 3, due_date: '2026-11-20T18:00', paused: 1, assign_person: 'staff1' }),
      makeTask({ id: 4, due_date: '2026-11-23T18:00', assign_person: 'other' }),
    ]
    const groups = computeTodayTodoGroups(tasks, new Set([1]), { username: 'staff1' }, false, NOW)
    expect(groups.sched.map((t) => t.id)).toEqual([1])
    expect(groups.recur.map((t) => t.id)).toEqual([1])
    expect(groups.overdue.map((t) => t.id)).toEqual([2])
    expect(groups.allUnique.map((t) => t.id)).toEqual([1, 2])
  })

  it('sorts bottleneck breakdowns by overdue desc then open desc and counts multi-site tasks', () => {
    const tasks = [
      makeTask({ id: 1, assigned_unit: '電腦室', site: 'YS,YA', due_date: '2026-11-20T19:00' }),
      makeTask({ id: 2, assigned_unit: '資訊部', site: 'YA', due_date: '2026-11-28T19:00' }),
      makeTask({ id: 3, assigned_unit: '製造部', site: 'CT', progress: 100, finish_date: '2026-11-22 10:00:00' }),
    ]
    const breakdowns = computeBottleneckBreakdowns(tasks, 'Unassigned', NOW)
    expect(breakdowns.dept[0]?.total).toBe(2)
    expect(breakdowns.dept[0]?.overdue).toBe(1)
    expect(breakdowns.site[0]?.label).toBe('YA')
    expect(breakdowns.site[0]?.total).toBe(2)
  })

  it('filters tasks belonging to a department set across assigned_unit, reporter_dept, and req_depts', () => {
    const tasks = [
      makeTask({ id: 1, assigned_unit: '电脑室', reporter_dept: '業務部', req_depts: '業務部' }),
      makeTask({ id: 2, assigned_unit: '製造部', reporter_dept: '業務部', req_depts: '品質部|資訊部' }),
      makeTask({ id: 3, assigned_unit: '製造部', reporter_dept: '業務部', req_depts: '業務部' }),
    ]
    const filtered = filterTasksByDeptSet(tasks, ['資訊部'])
    expect(filtered.map((t) => t.id)).toEqual([1, 2])
  })
})
