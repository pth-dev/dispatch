import { describe, expect, it } from 'vitest'
import { RawTaskSchema, type RawTask } from '@/schemas/task'
import {
  buildTodoCsvContent,
  getMyUnfinishedTasks,
  isValidIsoDate,
  matchesTodoQuery,
  sortTimelineTasks,
  splitTodoTasks,
} from './todo-domain'

function makeTask(overrides: Partial<RawTask> & { id: number; title: string }): RawTask {
  return RawTaskSchema.parse({
    progress: 20,
    reporter: '15965',
    assign_person: '20160',
    assigned_unit: '資訊部',
    site: 'YS',
    level: '一般件',
    req_dept: '資訊部',
    ...overrides,
  })
}

describe('todo-domain', () => {
  const user = { username: '20160', fullname: 'Phan Trung Hiếu' }

  it('filters unfinished tasks assigned to current user', () => {
    const tasks = [
      makeTask({ id: 1, title: 'Mine open', assign_person: '20160', progress: 40 }),
      makeTask({ id: 2, title: 'Mine done', assign_person: '20160', progress: 100 }),
      makeTask({ id: 3, title: 'Other open', assign_person: '99999', progress: 10 }),
      makeTask({ id: 4, title: 'By fullname', assign_person: 'Phan Trung Hiếu', progress: 0 }),
    ]

    const result = getMyUnfinishedTasks(tasks, user)
    expect(result.map((t) => t.id)).toEqual([1, 4])
  })

  it('splits saved todos in order and sorts available tasks by due date', () => {
    const t1 = makeTask({ id: 10, title: 'Later due', due_date: '2026-11-25T17:00' })
    const t2 = makeTask({ id: 11, title: 'Earlier due', due_date: '2026-11-22T09:00' })
    const t3 = makeTask({ id: 12, title: 'No due', due_date: null })
    const t4 = makeTask({ id: 13, title: 'Scheduled first', due_date: '2026-11-24T12:00' })

    const { selected, available } = splitTodoTasks(
      [t1, t2, t3, t4],
      [
        { id: 13, start_time: '09:00' },
        { id: 999, start_time: '10:00' }, // stale or completed task ignored
      ],
    )

    expect(selected.map((s) => ({ id: s.task.id, startTime: s.startTime }))).toEqual([
      { id: 13, startTime: '09:00' },
    ])
    expect(available.map((t) => t.id)).toEqual([11, 10, 12])
  })

  it('matches query by id, #id, title, and title_vn', () => {
    const task = makeTask({ id: 456, title: 'Fix VPN gateway', title_vn: 'Sửa cổng VPN' })
    expect(matchesTodoQuery(task, '#456')).toBe(true)
    expect(matchesTodoQuery(task, 'vpn')).toBe(true)
    expect(matchesTodoQuery(task, 'sửa cổng')).toBe(true)
    expect(matchesTodoQuery(task, 'printer')).toBe(false)
  })

  it('sorts timeline tasks with overdue first, then earliest due date, then no due date', () => {
    const now = new Date(2026, 10, 21, 12, 0, 0)
    const overdue = makeTask({ id: 1, title: 'Overdue', due_date: '2026-11-20T18:00' })
    const upcomingSoon = makeTask({ id: 2, title: 'Soon', due_date: '2026-11-21T17:00' })
    const upcomingLater = makeTask({ id: 3, title: 'Later', due_date: '2026-11-24T10:00' })
    const noDue = makeTask({ id: 4, title: 'No due', due_date: null })

    const sorted = sortTimelineTasks([noDue, upcomingLater, overdue, upcomingSoon], now)
    expect(sorted.map((t) => t.id)).toEqual([1, 2, 3, 4])
  })

  it('builds UTF-8 BOM CSV sorted by start_time and guards against formula injection', () => {
    const t1 = makeTask({ id: 101, title: 'Morning "A"', site: 'YS', progress: 50 })
    const t2 = makeTask({ id: 102, title: '=CMD|calc', site: 'LK', progress: 10 })

    const csv = buildTodoCsvContent(
      [
        { task: t2, startTime: '' },
        { task: t1, startTime: '08:30' },
      ],
      {
        startTime: 'Start',
        taskId: 'ID',
        title: 'Title',
        titleVn: 'TitleVN',
        site: 'Site',
        level: 'Level',
        progress: 'Progress',
        dueDate: 'Due',
        reqDept: 'ReqDept',
      },
      { timeUnset: 'Unset', noDueDate: 'None' },
    )

    expect(csv.startsWith('\uFEFF')).toBe(true)
    const lines = csv.slice(1).split('\r\n')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain('08:30,101,"Morning ""A"""')
    expect(lines[2]).toContain("Unset,102,'=CMD|calc")
  })

  it('rejects impossible calendar dates', () => {
    expect(isValidIsoDate('2026-11-21')).toBe(true)
    expect(isValidIsoDate('2026-02-31')).toBe(false)
    expect(isValidIsoDate('2026-13-01')).toBe(false)
    expect(isValidIsoDate('not-a-date')).toBe(false)
  })
})
