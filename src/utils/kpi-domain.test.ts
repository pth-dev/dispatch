import { describe, expect, it } from 'vitest'
import {
  computeAssigneeRanking,
  computeDeptTaskSummary,
  computeKpiMetrics,
  getKpiGrade,
} from './kpi-domain'

const NOW = new Date(2026, 10, 23, 12, 0, 0)

describe('kpi-domain', () => {
  it('grades scores using V16.11.0-r8 thresholds', () => {
    expect(getKpiGrade(null)).toEqual({ code: '-', tone: 'muted' })
    expect(getKpiGrade(95)).toEqual({ code: 'A', tone: 'success' })
    expect(getKpiGrade(90)).toEqual({ code: 'A', tone: 'success' })
    expect(getKpiGrade(80)).toEqual({ code: 'B', tone: 'primary' })
    expect(getKpiGrade(60)).toEqual({ code: 'C', tone: 'warning' })
    expect(getKpiGrade(59)).toEqual({ code: 'D', tone: 'destructive' })
  })

  it('computes KPI score (60% completion + 40% on-time) and excludes paused tasks', () => {
    const metrics = computeKpiMetrics(
      [
        // Completed on time (100)
        {
          progress: 100,
          due_date: '2026-11-23T19:00',
          finish_date: '2026-11-23 10:00:00',
          paused: 0,
          assign_person: 'alice',
          first_response_mins: 20,
        },
        // Late completed (60)
        {
          progress: 100,
          due_date: '2026-11-20T19:00',
          finish_date: '2026-11-21 09:00:00',
          paused: 0,
          assign_person: 'alice',
          first_response_mins: 90,
        },
        // Overdue pending (0)
        {
          progress: 40,
          due_date: '2026-11-22T19:00',
          finish_date: '',
          paused: 0,
          assign_person: 'alice',
          first_response_mins: null,
        },
        // Paused (excluded from denominator)
        {
          progress: 20,
          due_date: '2026-11-20T19:00',
          finish_date: '',
          paused: 1,
          assign_person: 'alice',
          first_response_mins: 10,
        },
      ],
      NOW,
    )

    expect(metrics.total).toBe(3)
    expect(metrics.paused).toBe(1)
    expect(metrics.completed).toBe(2)
    expect(metrics.ontime).toBe(1)
    expect(metrics.late).toBe(1)
    expect(metrics.overdue).toBe(1)
    expect(metrics.completionRate).toBe(66.7)
    expect(metrics.ontimeRate).toBe(33.3)
    expect(metrics.score).toBe(53)
    expect(metrics.grade.code).toBe('D')
    expect(metrics.response1hRate).toBe(50)
  })

  it('returns null score when no eligible tasks exist', () => {
    const metrics = computeKpiMetrics(
      [
        {
          progress: 10,
          due_date: '2026-11-23T19:00',
          finish_date: '',
          paused: 1,
          assign_person: 'bob',
        },
      ],
      NOW,
    )

    expect(metrics.total).toBe(0)
    expect(metrics.paused).toBe(1)
    expect(metrics.score).toBeNull()
    expect(metrics.grade.code).toBe('-')
  })

  it('computes department summary and per-person open load', () => {
    const summary = computeDeptTaskSummary(
      [
        {
          progress: 100,
          due_date: '2026-11-23T19:00',
          finish_date: '2026-11-23 11:00:00',
          paused: 0,
          assign_person: 'alice',
          recur_type: 'weekly',
          confidential: 1,
        },
        {
          progress: 30,
          due_date: '2026-11-23T18:00',
          finish_date: '',
          paused: 0,
          assign_person: 'alice, bob',
          recur_type: 'once',
          confidential: 0,
        },
        {
          progress: 0,
          due_date: '2026-11-20T19:00',
          finish_date: '',
          paused: 0,
          assign_person: 'bob',
        },
      ],
      NOW,
    )

    expect(summary.total).toBe(3)
    expect(summary.completed).toBe(1)
    expect(summary.open).toBe(2)
    expect(summary.dueToday).toBe(1)
    expect(summary.delayed).toBe(1)
    expect(summary.recur).toBe(1)
    expect(summary.secret).toBe(1)
    expect(summary.people[0]).toEqual({ name: 'bob', total: 2, open: 2, delayed: 1, done: 0 })
    expect(summary.people[1]).toEqual({ name: 'alice', total: 2, open: 1, delayed: 0, done: 1 })
  })

  it('ranks assignees by on-time rate then volume', () => {
    const ranking = computeAssigneeRanking(
      [
        {
          progress: 100,
          due_date: '2026-11-23T19:00',
          finish_date: '2026-11-23 10:00:00',
          paused: 0,
          assign_person: 'bob',
        },
        {
          progress: 100,
          due_date: '2026-11-23T19:00',
          finish_date: '2026-11-23 10:00:00',
          paused: 0,
          assign_person: 'alice',
        },
        {
          progress: 50,
          due_date: '2026-11-20T19:00',
          finish_date: '',
          paused: 0,
          assign_person: 'alice',
        },
      ],
      NOW,
    )

    expect(ranking[0]?.assignee).toBe('bob')
    expect(ranking[0]?.ontimeRate).toBe(100)
    expect(ranking[1]?.assignee).toBe('alice')
    expect(ranking[1]?.ontimeRate).toBe(50)
  })
})
