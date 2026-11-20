import { describe, expect, it } from 'vitest'
import type { SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import { filterAndPaginateTasks } from './queries'
import { buildDefaultTaskEditorValues, buildTaskFormData } from './build-task-form-data'

const USER: SessionUser = {
  id: 1,
  username: 'hieu',
  fullname: 'Phan Trung Hiếu',
  dept: '資訊部',
  site: 'YS',
  role: 'admin',
  auth_source: 'local',
  menu_perms: null,
  is_computer_room: false,
}

function makeTask(overrides: Partial<RawTask> & { id: number }): RawTask {
  return {
    title: `Task ${overrides.id}`,
    progress: 0,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    reporter: 'other',
    assigned_unit: '資訊部',
    assign_person: 'hieu',
    due_date: '2026-11-25T19:00',
    createdAt: '2026-11-20 08:00:00',
    ...overrides,
  }
}

describe('filterAndPaginateTasks', () => {
  const now = new Date(2026, 10, 20, 12, 0, 0)
  const tasks: RawTask[] = [
    makeTask({ id: 1, title: 'Overdue IT', assign_person: 'hieu', due_date: '2026-11-18T19:00' }),
    makeTask({ id: 2, title: 'Paused task', assign_person: 'hieu', paused: 1, progress: 40 }),
    makeTask({
      id: 3,
      title: 'Created by me',
      reporter: 'hieu',
      assign_person: 'tom',
      assigned_unit: '製造部',
      progress: 100,
      finish_date: '2026-11-20 10:00:00',
    }),
  ]

  it('computes scope counts independently of active filters and filters by status/dept', () => {
    const res = filterAndPaginateTasks(
      tasks,
      { scope: 'all', status: 'paused', page: 1, pageSize: 10 },
      USER,
      now,
    )
    expect(res.counts).toEqual({ mine: 2, created: 1, all: 3 })
    expect(res.items.map((t) => t.id)).toEqual([2])

    const byDept = filterAndPaginateTasks(
      tasks,
      { scope: 'all', department: '制造部', page: 1, pageSize: 10 },
      USER,
      now,
    )
    expect(byDept.items.map((t) => t.id)).toEqual([3])
  })

  it('sorts descending by id and paginates accurately', () => {
    const many = Array.from({ length: 15 }, (_, idx) => makeTask({ id: idx + 1 }))
    const page2 = filterAndPaginateTasks(
      many,
      { scope: 'all', page: 2, pageSize: 10 },
      USER,
      now,
    )
    expect(page2.total).toBe(15)
    expect(page2.items.map((t) => t.id)).toEqual([5, 4, 3, 2, 1])
  })
})

describe('buildTaskFormData', () => {
  it('preserves original work_items JSON verbatim on edit and attaches retainedFiles', () => {
    const originalWorkItems = '{"v":1,"rule":"sun","items":[{"id":"n1","topic":"Sub 1"}]}'
    const values = buildDefaultTaskEditorValues(USER)
    values.title = 'Updated Task'
    values.task_type = '網路類 / Mạng lưới'

    const fd = buildTaskFormData({
      mode: 'edit',
      values,
      reporter: USER.username,
      newFiles: [],
      retainedFiles: [{ name: 'a.pdf', path: '/uploads/a.pdf' }],
      preservedWorkItems: originalWorkItems,
    })

    expect(fd.get('work_items')).toBe(originalWorkItems)
    expect(fd.get('retainedFiles')).toBe(JSON.stringify([{ name: 'a.pdf', path: '/uploads/a.pdf' }]))
    expect(fd.get('clone_from')).toBeNull()
  })

  it('sets clone_from and cloneFiles on clone mode', () => {
    const values = buildDefaultTaskEditorValues(USER)
    values.title = 'Cloned Task'
    values.task_type = '網路類 / Mạng lưới'

    const fd = buildTaskFormData({
      mode: 'clone',
      values,
      reporter: USER.username,
      newFiles: [],
      retainedFiles: [{ name: 'b.png', path: '/uploads/b.png' }],
      cloneFromId: 88,
    })

    expect(fd.get('clone_from')).toBe('88')
    expect(fd.get('cloneFiles')).toBe(JSON.stringify([{ name: 'b.png', path: '/uploads/b.png' }]))
  })
})
