import { describe, expect, it } from 'vitest'
import {
  AdminUserSchema,
  BatchUsersResponseSchema,
  SimpleAdminMutationSchema,
} from './account'
import { AdDiagnoseResponseSchema, AdUserItemSchema } from './account-ad'
import {
  AdminSitesResponseSchema,
  ArchiveInfoResponseSchema,
  ArchiveRunResponseSchema,
  sanitizeDownloadUrl,
} from './account-system'
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

  it('tolerates null legacy SQLite strings in RawTaskSchema and RawReportSchema', () => {
    const tasks = RawTaskListSchema.parse([
      {
        id: 2001,
        title: null,
        reporter: null,
        attachments: [{ name: 'a.pdf', path: '/uploads/a.pdf', size: null }],
      },
    ])
    expect(tasks[0]?.title).toBe('')
    expect(tasks[0]?.reporter).toBe('')

    const reports = RawReportListSchema.parse([
      {
        id: 601,
        task_id: 2001,
        username: null,
        createdAt: null,
      },
    ])
    expect(reports[0]?.username).toBe('')
    expect(reports[0]?.createdAt).toBe('')
  })

  it('rejects paused status with 100% progress in TaskReportFormSchema', () => {
    const invalid = TaskReportFormSchema.safeParse({
      content: 'Pausing',
      progress: 100,
      km_link: '',
      status: 'paused',
      pause_reason: '',
    })
    expect(invalid.success).toBe(false)

    const valid = TaskReportFormSchema.safeParse({
      content: 'Pausing',
      progress: 99,
      km_link: '',
      status: 'paused',
      pause_reason: 'Chờ vật tư',
    })
    expect(valid.success).toBe(true)
  })

  it('enforces task_type, due_date (for once), and max 20 assignees in TaskEditorFormSchema', () => {
    const base = {
      title: 'Task A',
      content: '',
      precautions: '',
      level: '一般件 (指定时间内完成) / Thường (Hoàn thành trong thời gian quy định, KS nghiêm ngặt)',
      risk_status: '無 / Không',
      task_type: '網路類 / Mạng lưới',
      req_depts: ['資訊部'],
      req_contact: 'hieu',
      site: ['YS'],
      assigned_unit: '資訊部',
      assign_person: ['tom'],
      due_date: '2026-11-25T19:00',
      recur_type: 'once' as const,
      recur_weekdays: [] as number[],
      recur_monthdays: [] as number[],
      recur_time: '17:00',
      recur_end: '',
      confidential: 0 as const,
      readers: [] as string[],
      cross_dept: false,
      cross_viewers: [] as string[],
      cost_estimate: '',
      km_link: '',
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
        recur_type: 'weekly',
        recur_weekdays: [],
        due_date: '',
      }).success,
    ).toBe(false)

    expect(
      TaskEditorFormSchema.safeParse({
        ...base,
        recur_type: 'monthly',
        recur_monthdays: [1, 15],
        due_date: '',
      }).success,
    ).toBe(true)

    expect(
      TaskEditorFormSchema.safeParse({
        ...base,
        recur_type: 'monthly',
        recur_monthdays: [],
        due_date: '',
      }).success,
    ).toBe(false)

    expect(
      TaskEditorFormSchema.safeParse({
        ...base,
        assign_person: Array.from({ length: 21 }, (_, i) => `u${i}`),
      }).success,
    ).toBe(false)
  })
})

describe('account & admin legacy contract schemas', () => {
  it('parses extended AdminUser fields and object site_created payloads', () => {
    const user = AdminUserSchema.parse({
      id: 7,
      username: 'ad_u1',
      fullname: 'AD User',
      dept: '資訊部',
      site: 'YS',
      role: 'user',
      status: 'Approved',
      auth_source: 'ad',
      online: 1,
      last_seen: '2026-11-25 10:00:00',
      ad_state: 'active',
      ad_upn: 'ad_u1@corp.local',
      ad_sam: 'ad_u1',
      ad_synced_at: '2026-11-25 09:30:00',
      ad_auto_disabled: 0,
      merged_into: null,
      menu_perms_editable: true,
      view_depts_editable: false,
    })
    expect(user.online).toBe(true)
    expect(user.ad_auto_disabled).toBe(false)
    expect(user.ad_upn).toBe('ad_u1@corp.local')
    expect(user.menu_perms_editable).toBe(true)
    expect(user.view_depts_editable).toBe(false)

    const simple = SimpleAdminMutationSchema.parse({
      success: true,
      site_created: { value: 'HN', label: '河內 / Hà Nội' },
    })
    expect(simple.site_created).toEqual({ value: 'HN', label: '河內 / Hà Nội' })

    const batch = BatchUsersResponseSchema.parse({
      success: true,
      updated: 2,
      site_created: true,
    })
    expect(batch.site_created).toBe(true)
  })

  it('parses AD diagnose object steps and AD user legacy fields', () => {
    const diag = AdDiagnoseResponseSchema.parse({
      success: true,
      result: {
        domain: 'corp.local',
        baseDN: 'DC=corp,DC=local',
        bindUser: 'svc_ad',
        passwordSet: true,
        durationMs: 120,
        goodUrl: 'ldap://dc1.corp.local:389',
        dns: { srv: ['dc1.corp.local'], a: ['10.0.0.1'], errors: {} },
        tests: [
          {
            url: 'ldap://dc1.corp.local:389',
            tcp: { ok: true, ms: 8 },
            bind: { ok: true, ms: 24 },
            search: { ok: true, entries: 15 },
          },
          {
            url: 'ldap://dc2.corp.local:389',
            tcp: false,
            bind: { ok: false, error: 'TIMEOUT', message: 'Timed out' },
            search: null,
          },
        ],
        hints: ['OK'],
      },
    })
    expect(diag.result?.tests[0]?.tcp).toMatchObject({ ok: true, ms: 8 })
    expect(diag.result?.tests[0]?.search).toMatchObject({ ok: true, entries: 15 })
    expect(diag.result?.tests[1]?.tcp).toMatchObject({ ok: false })
    expect(diag.result?.dns?.srv).toEqual(['dc1.corp.local'])

    const adUser = AdUserItemSchema.parse({
      sam: 'john',
      displayName: 'John Doe',
      mail: 'john@corp.local',
      exists: true,
      linked: true,
      localSource: 'ad',
      localUsername: 'john',
      state: 'active',
      expired: false,
      locked: false,
    })
    expect(adUser.mail).toBe('john@corp.local')
    expect(adUser.linked).toBe(true)
    expect(adUser.localSource).toBe('ad')
  })

  it('normalizes AdminSite with value-only payload and parses archive counts', () => {
    const sites = AdminSitesResponseSchema.parse({
      success: true,
      sites: [
        { value: 'YS', name: '永昇', vn: 'Vĩnh Thịnh', users: 42, builtin: 1, active: 1 },
      ],
    })
    expect(sites.sites[0]).toMatchObject({
      code: 'YS',
      value: 'YS',
      users: 42,
      builtin: true,
      active: true,
    })

    const info = ArchiveInfoResponseSchema.parse({
      defaultPath: 'E:\\backups',
      history: [
        {
          name: 'arc.zip',
          sizeBytes: 1024,
          createdAt: '2026-11-25',
          downloadUrl: '/api/admin/archive/download/arc.zip',
          counts: { tasks: 10, reports: 25, messages: 3, todos: 4, files: 12, missing: 0 },
        },
      ],
    })
    expect(info.history[0]?.counts?.tasks).toBe(10)

    const run = ArchiveRunResponseSchema.parse({
      success: true,
      name: 'arc.zip',
      counts: { tasks: 10, files: 12 },
    })
    expect(run.counts?.files).toBe(12)

    expect(sanitizeDownloadUrl('/api/admin/archive/download/arc.zip')).toBe(
      '/api/admin/archive/download/arc.zip',
    )
    expect(sanitizeDownloadUrl('https://evil.example/steal.zip')).toBe('')
    expect(sanitizeDownloadUrl('//evil.example/steal.zip')).toBe('')
    expect(sanitizeDownloadUrl('javascript:alert(1)')).toBe('')
  })
})
