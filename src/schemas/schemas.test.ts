import { describe, expect, it } from 'vitest'
import {
  SessionUserSchema,
  SessionVerifyResponseSchema,
  UpdatePasswordFormSchema,
} from './auth'
import { MetaDeptsResponseSchema, MetaSitesResponseSchema } from './meta'
import {
  RawReportListSchema,
  RawTaskListSchema,
  TaskEditorFormSchema,
  TaskReportFormSchema,
} from './task'

describe('auth schemas', () => {
  it('parses live-probe /api/session/verify shape including stringified or null menu_perms', () => {
    const parsed = SessionVerifyResponseSchema.parse({
      success: true,
      user: {
        id: 12,
        username: 'hieu',
        fullname: 'Phan Trung Hiếu',
        dept: '資訊部',
        site: 'YS',
        role: 'admin',
        status: 'Approved',
        auth_source: 'ad',
        email: 'hieu@example.com',
        title: 'IT Lead',
        dept_source: 'ad_ou',
        dept_ou_dn: 'OU=IT,DC=corp',
        ad_dn: 'CN=hieu,OU=IT,DC=corp',
        menu_perms: '{"dashboard":"srw","list":"sr"}',
        is_computer_room: 1,
      },
    })

    expect(parsed.user.menu_perms).toEqual({ dashboard: 'srw', list: 'sr' })
    expect(parsed.user.is_computer_room).toBe(true)

    const withNull = SessionUserSchema.parse({
      username: 'u1',
      role: 'superadmin',
      menu_perms: null,
    })
    expect(withNull.menu_perms).toBeNull()
    expect(withNull.auth_source).toBe('local')
  })

  it('validates UpdatePasswordFormSchema matching passwords', () => {
    const fail = UpdatePasswordFormSchema.safeParse({
      oldPassword: 'old',
      newPassword: 'newpassword',
      confirmPassword: 'different',
    })
    expect(fail.success).toBe(false)

    const ok = UpdatePasswordFormSchema.safeParse({
      oldPassword: 'old',
      newPassword: 'newpassword',
      confirmPassword: 'newpassword',
    })
    expect(ok.success).toBe(true)
  })
})

describe('meta schemas', () => {
  it('parses /api/meta/depts and /api/meta/sites envelopes', () => {
    const depts = MetaDeptsResponseSchema.parse({
      depts: [{ value: '資訊部', zh: '资讯部', vn: 'Bộ phận IT', label: '資訊部 / IT' }],
      allDepts: [{ value: '資訊部' }],
      secrecy_order: [0, 1, 3, 2],
      otherValue: '__OTHER__',
    })
    expect(depts.depts[0]?.value).toBe('資訊部')

    const sites = MetaSitesResponseSchema.parse({
      sites: [{ value: 'YS', name: '永昇', vn: 'YS', active: 1, builtin: true }],
      otherValue: '__OTHER__',
    })
    expect(sites.sites[0]?.value).toBe('YS')
  })
})

describe('task & report schemas', () => {
  it('parses bare arrays from /api/tasks and /api/tasks/:id/reports', () => {
    const tasks = RawTaskListSchema.parse([
      {
        id: 1024,
        title: 'Nâng cấp API',
        progress: 60,
        paused: 0,
        confidential: 1,
        due_date: '2026-11-25T19:00',
        createdAt: '2026-11-20 08:00:00',
        attachments: '[{"name":"spec.pdf","path":"/uploads/spec.pdf"}]',
        req_depts: '資訊部|製造部',
        assign_person: 'tom,mary',
        site: 'YS,YA',
        reporter: 'hieu',
      },
    ])
    expect(tasks[0]?.id).toBe(1024)
    expect(tasks[0]?.confidential).toBe(1)

    const reports = RawReportListSchema.parse([
      {
        id: 501,
        task_id: 1024,
        username: 'tom',
        fullname: 'Tom',
        content: 'Done 60%',
        progress: 60,
        attachments: '[]',
        createdAt: '2026-11-20 10:00:00',
        pause_action: '',
      },
    ])
    expect(reports[0]?.task_id).toBe(1024)
  })

  it('rejects paused status with 100% progress in TaskReportFormSchema', () => {
    const invalid = TaskReportFormSchema.safeParse({
      content: 'Pausing',
      progress: 100,
      status: 'paused',
    })
    expect(invalid.success).toBe(false)

    const valid = TaskReportFormSchema.safeParse({
      content: 'Pausing',
      progress: 99,
      status: 'paused',
      pause_reason: 'Chờ vật tư',
    })
    expect(valid.success).toBe(true)
  })

  it('enforces task_type, due_date (for once), and max 20 assignees in TaskEditorFormSchema', () => {
    const base = {
      title: 'Task A',
      task_type: '網路類 / Mạng lưới',
      req_depts: ['資訊部'],
      req_contact: 'hieu',
      site: ['YS'],
      assigned_unit: '資訊部',
      assign_person: ['tom'],
      due_date: '2026-11-25T19:00',
      recur_type: 'once' as const,
    }

    expect(TaskEditorFormSchema.safeParse(base).success).toBe(true)

    expect(
      TaskEditorFormSchema.safeParse({ ...base, task_type: '未分類 / Chưa phân loại' }).success,
    ).toBe(false)

    expect(TaskEditorFormSchema.safeParse({ ...base, due_date: '' }).success).toBe(false)

    expect(
      TaskEditorFormSchema.safeParse({
        ...base,
        recur_type: 'weekly',
        recur_weekdays: [1, 3, 5],
        due_date: '',
      }).success,
    ).toBe(true)

    expect(
      TaskEditorFormSchema.safeParse({
        ...base,
        assign_person: Array.from({ length: 21 }, (_, i) => `u${i}`),
      }).success,
    ).toBe(false)
  })
})
