import { describe, expect, it } from 'vitest'
import type { RawTask } from '@/schemas/task'
import {
  buildPeriodBuckets,
  buildPeriodicKpiDataset,
  buildUserLookup,
  getIsoWeekInfo,
  getIsoWeekStart,
  resolvePeriodicKpiRange,
} from './periodic-kpi-domain'

function makeTask(overrides: Partial<RawTask>): RawTask {
  return {
    id: 1,
    title: 'Sample Task',
    title_vn: '',
    content: '',
    precautions: '',
    level: '',
    risk_status: '',
    task_type: '系統',
    req_depts: '',
    req_contact: '',
    site: 'YS',
    assigned_unit: '資訊部',
    assign_person: 'staff1',
    reporter: 'boss',
    due_date: '2026-11-20T17:00',
    finish_date: '',
    progress: 0,
    paused: 0,
    pause_reason: '',
    confidential: 0,
    readers: '',
    cross_dept: 0,
    cross_viewers: '',
    recur_type: 'once',
    recur_weekdays: '',
    recur_monthdays: '',
    recur_time: '',
    recur_end: '',
    recur_cycle_date: '',
    recur_cycle_no: 0,
    cost_estimate: '',
    km_link: '',
    attachments: '[]',
    all_reports: '',
    last_report: '',
    last_report_meta: null,
    work_items: null,
    split_members: '',
    split_parent_id: 0,
    first_response_mins: null,
    createdAt: '2026-11-10 08:00:00',
    updatedAt: '',
    dispatch_date: '',
    kpi_at: '',
    kpi_key: '',
    ...overrides,
  } as RawTask
}

describe('periodic-kpi-domain', () => {
  it('computes ISO week ranges and dynamic trend buckets accurately', () => {
    const iso = getIsoWeekInfo(new Date(2026, 10, 25)) // 2026-11-25 (Wed)
    expect(iso.year).toBe(2026)
    expect(iso.week).toBe(48)

    const mon = getIsoWeekStart(2026, 48)
    expect(mon.getFullYear()).toBe(2026)
    expect(mon.getMonth()).toBe(10)
    expect(mon.getDate()).toBe(23)

    const monthRange = resolvePeriodicKpiRange({
      type: 'month',
      year: 2026,
      week: 48,
      month: 11,
      quarter: 4,
      customStart: '',
      customEnd: '',
    })
    expect(monthRange?.startStr).toBe('2026-11-01')
    expect(monthRange?.endStr).toBe('2026-11-30')
    expect(monthRange?.gran).toBe('week')
    expect(buildPeriodBuckets(monthRange!.start, monthRange!.end, 'week').length).toBeGreaterThanOrEqual(5)
  })

  it('separates created vs finished in Flow A and computes weighted V16.11.0-r8 KPI score in Flow B', () => {
    const range = resolvePeriodicKpiRange({
      type: 'month',
      year: 2026,
      week: 48,
      month: 11,
      quarter: 4,
      customStart: '',
      customEnd: '',
    })!

    const tasks: RawTask[] = [
      // Created in Oct, finished on-time in Nov -> counts in finished (not created), counts in Flow B (basis=final)
      makeTask({
        id: 1,
        assign_person: 'staff1',
        createdAt: '2026-10-20 08:00:00',
        due_date: '2026-11-10T17:00',
        finish_date: '2026-11-05 10:00:00',
        progress: 100,
        first_response_mins: 30,
      }),
      // Created in Nov, finished late in Nov (2 assignees -> each gets 1 task in Flow B)
      makeTask({
        id: 2,
        assign_person: 'staff1,staff2',
        createdAt: '2026-11-02 08:00:00',
        due_date: '2026-11-05T17:00',
        finish_date: '2026-11-08 08:00:00',
        progress: 100,
        first_response_mins: 90,
      }),
      // Created in Nov, paused -> excluded from Flow B denominator
      makeTask({
        id: 3,
        assign_person: 'staff1',
        createdAt: '2026-11-03 08:00:00',
        due_date: '2026-11-15T17:00',
        progress: 40,
        paused: 1,
      }),
    ]

    const userMap = buildUserLookup([
      { username: 'staff1', fullname: 'Nguyễn A', dept: '資訊部' },
      { username: 'staff2', fullname: 'Trần B', dept: '資訊部' },
    ])

    const dataset = buildPeriodicKpiDataset({
      flowTasks: tasks,
      kpiTasks: tasks,
      range,
      unit: '',
      userMap,
      now: new Date(2026, 10, 25, 12, 0, 0),
    })

    // Flow A: only tasks #2 and #3 were created in Nov; #1 and #2 finished in Nov
    expect(dataset.created.map((t) => t.id)).toEqual([2, 3])
    expect(dataset.finished.map((t) => t.id)).toEqual([1, 2])
    expect(dataset.totalAgg.total).toBe(2)
    expect(dataset.finAgg.total).toBe(2)
    expect(dataset.totalAgg.late).toBe(1)
    expect(dataset.totalAgg.responded).toBe(1)
    expect(dataset.totalAgg.oneHr).toBe(0)

    // Flow B (basis=final):
    // staff1: #1 (ontime=100) + #2 (late=60) + #3 (paused, excluded) -> total=2, completed=2, ontime=1 -> score = 1*60 + 0.5*40 = 80 (B)
    // staff2: #2 (late=60) -> total=1, completed=1, ontime=0 -> score = 1*60 + 0*40 = 60 (C)
    // Weighted overall: total=3, completed=3, ontime=1 -> 100%*60 + 33.33%*40 = 73.3 (C)
    const s1 = dataset.kpiRows.find((r) => r.username === 'staff1')
    const s2 = dataset.kpiRows.find((r) => r.username === 'staff2')
    expect(s1).toMatchObject({ total: 2, paused: 1, completed: 2, ontime: 1, score: 80 })
    expect(s1?.grade.code).toBe('B')
    expect(s2).toMatchObject({ total: 1, completed: 1, ontime: 0, score: 60 })
    expect(s2?.grade.code).toBe('C')
    expect(dataset.kpiSummary.total).toBe(3)
    expect(dataset.kpiSummary.score).toBe(73.3)
    expect(dataset.kpiSummary.grade.code).toBe('C')
  })
})
