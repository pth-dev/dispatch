import { describe, expect, it } from 'vitest'
import type { RawTask } from '@/schemas/task'
import {
  buildTaskDrilldownUrl,
  buildUserDirectoryLookup,
  computeCreatedVsResolvedSeries,
  computeDeptPeopleStatusMatrix,
  computeOverdueAgingStats,
  computePeriodAssigneeRanking,
  computePeriodFlowComparison,
  resolveAssigneeIdentity,
} from './dashboard-charts'

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
    reporter_dept: '資訊部',
    req_dept: '資訊部',
    req_depts: '資訊部',
    assign_person: 'alice',
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

describe('dashboard-charts', () => {
  it('computes period flow comparison and clearance rate against previous period', () => {
    const tasks = [
      makeTask({ id: 1, createdAt: '2026-11-10 09:00:00', progress: 30 }),
      makeTask({
        id: 2,
        createdAt: '2026-11-12 09:00:00',
        progress: 100,
        finish_date: '2026-11-15 10:00:00',
      }),
      makeTask({
        id: 3,
        createdAt: '2026-10-10 09:00:00',
        progress: 100,
        finish_date: '2026-10-12 10:00:00',
      }),
    ]
    const cmp = computePeriodFlowComparison(tasks, 'month', NOW)
    expect(cmp.current.createdTasks.length).toBe(2)
    expect(cmp.current.completedTasks.length).toBe(1)
    expect(cmp.previous.createdTasks.length).toBe(1)
    expect(cmp.previous.completedTasks.length).toBe(1)
    expect(cmp.createdDiff).toBe(1)
    expect(cmp.completedDiff).toBe(0)
    expect(cmp.clearanceRate).toBe(50)
  })

  it('computes 8-week and 6-month created vs resolved series', () => {
    const tasks = [
      makeTask({ id: 1, createdAt: '2026-11-23 08:00:00', progress: 20 }),
      makeTask({
        id: 2,
        createdAt: '2026-10-15 08:00:00',
        progress: 100,
        finish_date: '2026-11-23 10:00:00',
      }),
    ]
    const weekly = computeCreatedVsResolvedSeries(tasks, 'week', NOW)
    expect(weekly.points).toHaveLength(8)
    expect(weekly.points[7]?.created).toBe(1)
    expect(weekly.points[7]?.completed).toBe(1)
    expect(weekly.points[7]?.delta).toBe(0)

    const monthly = computeCreatedVsResolvedSeries(tasks, 'month', NOW)
    expect(monthly.points).toHaveLength(6)
    expect(monthly.points[4]?.created).toBe(1)
    expect(monthly.points[5]?.completed).toBe(1)
  })

  it('computes overdue aging buckets, excludes paused tasks, and ranks longest overdue', () => {
    const tasks = [
      makeTask({ id: 1, createdAt: '2026-11-18 09:00:00', due_date: '2026-11-21T12:00', progress: 20 }),
      makeTask({ id: 2, createdAt: '2026-11-01 09:00:00', due_date: '2026-11-05T12:00', progress: 40 }),
      makeTask({ id: 3, createdAt: '2026-11-01 09:00:00', due_date: '2026-11-05T12:00', progress: 10, paused: 1 }),
    ]
    const aging = computeOverdueAgingStats(tasks, NOW)
    expect(aging.overdueCount).toBe(2)
    expect(aging.pausedCount).toBe(1)
    expect(aging.maxOverdueDays).toBe(18)
    expect(aging.buckets.find((b) => b.key === '1_3')?.count).toBe(1)
    expect(aging.buckets.find((b) => b.key === 'over_14')?.count).toBe(1)
    expect(aging.longestTasks[0]?.task.id).toBe(2)
  })

  it('builds department member status matrix excluding paused from overdue', () => {
    const tasks = [
      makeTask({ id: 1, assign_person: 'alice', progress: 20, due_date: '2026-11-20T12:00', paused: 0 }),
      makeTask({ id: 2, assign_person: 'alice', progress: 20, due_date: '2026-11-20T12:00', paused: 1 }),
      makeTask({ id: 3, assign_person: 'alice', progress: 100, finish_date: '2026-11-22 10:00:00' }),
    ]
    const matrix = computeDeptPeopleStatusMatrix(tasks, NOW)
    expect(matrix).toHaveLength(1)
    expect(matrix[0]).toMatchObject({
      name: 'alice',
      overdue: 1,
      paused: 1,
      completed: 1,
      open: 2,
      total: 3,
    })
  })

  it('computes period assignee ranking using ontime / completed in period', () => {
    const tasks = [
      makeTask({
        id: 1,
        assign_person: 'alice',
        progress: 100,
        due_date: '2026-11-25T19:00',
        finish_date: '2026-11-20 10:00:00',
      }),
      makeTask({
        id: 2,
        assign_person: 'alice',
        progress: 100,
        due_date: '2026-11-18T19:00',
        finish_date: '2026-11-20 10:00:00',
      }),
      makeTask({
        id: 3,
        assign_person: 'bob',
        progress: 100,
        due_date: '2026-10-25T19:00',
        finish_date: '2026-10-20 10:00:00',
      }),
    ]
    const ranking = computePeriodAssigneeRanking(tasks, 'month', NOW)
    expect(ranking).toHaveLength(1)
    expect(ranking[0]).toMatchObject({
      assignee: 'alice',
      completed: 2,
      ontime: 1,
      ontimeRate: 50,
    })
  })

  it('builds consistent drilldown URLs matching useTaskListParams keys', () => {
    const url = buildTaskDrilldownUrl('/tasks', {
      scope: 'mine',
      department: '資訊部',
      status: 'incomplete',
      levelRaw: '急件',
      taskType: '系統類',
      fromDate: '2026-11-23',
      toDate: '2026-11-23',
    })
    expect(url).toContain('scope=mine')
    expect(url).toContain('department=%E8%B3%87%E8%A8%8A%E9%83%A8')
    expect(url).toContain('status=incomplete')
    expect(url).toContain('level=urgent')
    expect(url).toContain('taskType=%E7%B3%BB%E7%B5%B1%E9%A1%9E')
    expect(url).toContain('fromDate=2026-11-23')
    expect(url).toContain('toDate=2026-11-23')
  })

  it('resolves assignee full name and employee code from user directory', () => {
    const lookup = buildUserDirectoryLookup([
      { username: '15569', fullname: 'Nguyen Van A', dept: '資訊部', site: 'YS' },
    ])
    expect(resolveAssigneeIdentity('15569', lookup)).toEqual({
      name: 'Nguyen Van A',
      code: '15569',
      searchText: 'nguyen van a 15569',
    })
    expect(resolveAssigneeIdentity('unknown_id', lookup)).toEqual({
      name: 'unknown_id',
      code: null,
      searchText: 'unknown_id',
    })
  })
})
