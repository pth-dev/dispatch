import { describe, expect, it } from 'vitest'
import type { RawTask } from '@/schemas/task'
import { buildUserLookup } from './periodic-kpi-domain'
import {
  buildEfficiencyDataset,
  EMPTY_DEPT_KEY,
  filterProgressTasks,
} from './excel-report-domain'
import { hardenArchivedReportHtml } from './report-domain'
import {
  buildQueueTargets,
  buildRichWebReportHtml,
  DEFAULT_WEB_REPORT_OPTIONS,
  splitPrimarySecondaryTasks,
} from './web-report-domain'

function makeTask(partial: Partial<RawTask>): RawTask {
  return {
    id: 1,
    title: 'Task mặc định',
    title_vn: '',
    content: 'Nội dung chi tiết',
    precautions: 'Lưu ý an toàn',
    site: 'YS',
    task_type: '系統 / Hệ thống',
    req_dept: '',
    req_depts: '',
    assigned_unit: '資訊部',
    assign_person: 'staff1',
    reporter: 'boss',
    risk_status: '',
    level: '高',
    due_date: '2026-11-28T17:00',
    finish_date: '2026-11-15 10:00:00',
    progress: 100,
    paused: 0,
    confidential: 0,
    createdAt: '2026-11-10 08:00:00',
    ...partial,
  } as RawTask
}

describe('excel-report-domain', () => {
  const userMap = buildUserLookup([
    { username: 'staff1', fullname: 'Nguyễn Văn A', dept: '資訊部' },
    { username: 'staff2', fullname: 'Trần Thị B', dept: '工務部' },
  ])

  const sampleTasks: RawTask[] = [
    makeTask({ id: 1, title: 'Nâng cấp server', assigned_unit: '資訊部', assign_person: 'staff1' }),
    makeTask({ id: 2, title: 'Sửa điều hòa', assigned_unit: '工務部', assign_person: 'staff2' }),
    makeTask({ id: 3, title: 'Task chưa gán bộ phận', assigned_unit: '', assign_person: '' }),
  ]

  it('filters progress tasks by ALL, DEPT (including __NONE__), and PERSON + keywords', () => {
    const all = filterProgressTasks(sampleTasks, {
      scopeType: 'ALL',
      selectedDepts: new Set(),
      selectedUsers: new Set(),
      extraKeyword: '',
      userMap,
    })
    expect(all.map((t) => t.id)).toEqual([1, 2, 3])

    const deptFiltered = filterProgressTasks(sampleTasks, {
      scopeType: 'DEPT',
      selectedDepts: new Set(['資訊部', EMPTY_DEPT_KEY]),
      selectedUsers: new Set(),
      extraKeyword: '',
      userMap,
    })
    expect(deptFiltered.map((t) => t.id)).toEqual([1, 3])

    const personFiltered = filterProgressTasks(sampleTasks, {
      scopeType: 'PERSON',
      selectedDepts: new Set(),
      selectedUsers: new Set(['staff1']),
      extraKeyword: 'điều hòa',
      userMap,
    })
    expect(personFiltered.map((t) => t.id)).toEqual([1, 2])
  })

  it('builds efficiency dataset resolving directory metadata and placing unassigned last', () => {
    const dataset = buildEfficiencyDataset(sampleTasks, 'assignee', '', userMap)
    expect(dataset.scoped).toHaveLength(3)
    expect(dataset.people).toHaveLength(3)

    const last = dataset.people[dataset.people.length - 1]
    expect(last?.info.key).toBe(EMPTY_DEPT_KEY)

    const staff1Row = dataset.people.find((p) => p.info.username === 'staff1')
    expect(staff1Row?.info.fullname).toBe('Nguyễn Văn A')
    expect(staff1Row?.info.dept).toBe('資訊部')
    expect(staff1Row?.agg.total).toBe(1)
  })
})

describe('web-report-domain', () => {
  const tasks: RawTask[] = [
    makeTask({
      id: 10,
      title: 'NV chính cá nhân',
      assigned_unit: '資訊部',
      assign_person: 'alice',
      reporter: 'bob',
      req_depts: '人資部',
    }),
    makeTask({
      id: 11,
      title: 'NV theo dõi do alice giao',
      assigned_unit: '工務部',
      assign_person: 'charlie',
      reporter: 'alice',
      req_depts: '資訊部',
    }),
    makeTask({
      id: 12,
      title: 'Bí mật <script>alert(1)</script>',
      content: 'Nội dung mật',
      precautions: 'Lưu ý mật',
      confidential: 1,
      assigned_unit: '資訊部',
      assign_person: 'alice',
      reporter: 'boss',
    }),
  ]

  it('splits primary and secondary tasks for SELF and DEPT targets', () => {
    const selfSplit = splitPrimarySecondaryTasks(
      tasks,
      { key: 'SELF', subject: 'SELF', label: 'Cá nhân tôi' },
      'alice',
      '資訊部',
    )
    expect(selfSplit.primary.map((t) => t.id)).toEqual([10, 12])
    expect(selfSplit.secondary.map((t) => t.id)).toEqual([11])

    const deptSplit = splitPrimarySecondaryTasks(
      tasks,
      { key: 'DEPT:資訊部', subject: 'DEPT', dept: '資訊部', label: 'Bộ phận: 資訊部' },
      'alice',
      '資訊部',
    )
    expect(deptSplit.primary.map((t) => t.id)).toEqual([10, 12])
    expect(deptSplit.secondary.map((t) => t.id)).toEqual([11])
  })

  it('builds multi-subject queue targets cleanly', () => {
    const queue = buildQueueTargets({
      subjects: new Set(['SELF', 'DEPT', 'PERSON']),
      selectedDepts: ['資訊部', '工務部'],
      selectedUsers: [{ username: 'alice', fullname: 'Alice Nguyen', dept: '資訊部' }],
      labels: { SELF: 'Tôi', DEPT: 'Bộ phận', FILTER: 'Lọc', PERSON: 'Nhân sự' },
      allDeptsLabel: 'Tất cả',
      currentDept: '資訊部',
    })
    expect(queue.map((q) => q.key)).toEqual(['SELF', 'DEPT:資訊部', 'DEPT:工務部', 'PERSON:alice'])
  })

  it('masks confidential details and escapes HTML when building rich web report', () => {
    const html = buildRichWebReportHtml({
      target: { key: 'SELF', subject: 'SELF', label: 'Cá nhân tôi' },
      title: 'Báo cáo <img onerror=alert(1)>',
      reportNo: 'WR-2026-11-ALICE',
      lang: 'bi',
      rangeStart: '2026-11-01',
      rangeEnd: '2026-11-30',
      author: 'alice',
      note: 'Ghi chú <b>quan trọng</b>',
      primary: tasks,
      secondary: [],
      options: { ...DEFAULT_WEB_REPORT_OPTIONS, mask: true, content: true, precautions: true },
    })

    expect(html).toContain('[Confidential #12]')
    expect(html).not.toContain('Nội dung mật')
    expect(html).not.toContain('Lưu ý mật')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img onerror=alert(1)>')

    const hardened = hardenArchivedReportHtml(html)
    expect(hardened).toContain("script-src 'none'")
  })
})
