import { describe, expect, it } from 'vitest'
import type { SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import {
  canCloneTask,
  canCreateTask,
  canDeleteReportAttachment,
  canDeleteTask,
  canEditLesson,
  canEditTask,
  canReadMenu,
  canSetCross,
  canSetReaders,
  canShowMenu,
  canSubmitReport,
  canWriteMenu,
  getDefaultTaskScope,
  getMenuPermFlags,
  isCrossViewer,
  isExec,
  isReaderOnly,
  isSuperLike,
} from './permissions'

function buildUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    username: 'staff1',
    fullname: 'Staff One',
    dept: '資訊部',
    site: 'YS',
    role: 'user',
    auth_source: 'local',
    menu_perms: null,
    is_computer_room: false,
    ...overrides,
  }
}

function buildTask(overrides: Partial<RawTask> = {}): RawTask {
  return {
    id: 100,
    title: 'Sample task',
    progress: 20,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
    reporter: 'creator1',
    reporter_dept: '製造部',
    req_dept: '製造部',
    req_depts: '製造部',
    assigned_unit: '資訊部',
    assign_person: 'staff1',
    readers: '',
    cross_viewers: '',
    ...overrides,
  }
}

describe('role helpers & menu_perms', () => {
  it('distinguishes exec and super-like roles', () => {
    expect(isExec(buildUser({ role: 'exec_vp' }))).toBe(true)
    expect(isExec(buildUser({ role: 'exec_assistant' }))).toBe(true)
    expect(isExec(buildUser({ role: 'superadmin' }))).toBe(false)
    expect(isSuperLike(buildUser({ role: 'superadmin' }))).toBe(true)
    expect(isSuperLike(buildUser({ role: 'admin' }))).toBe(false)
  })

  it('defaults null or missing menu_perms keys to full srw access', () => {
    const user = buildUser({ menu_perms: null })
    expect(getMenuPermFlags(user, 'list')).toEqual({ s: true, r: true, w: true })

    const partial = buildUser({ menu_perms: { dashboard: 's' } })
    expect(getMenuPermFlags(partial, 'dashboard')).toEqual({ s: true, r: false, w: false })
    expect(getMenuPermFlags(partial, 'list')).toEqual({ s: true, r: true, w: true })
  })

  it('enforces w => r => s hierarchy and unrestricted superadmin/exec/protected admin', () => {
    const restricted = buildUser({
      menu_perms: { list: 'w', messages: 'r', todo: '' },
    })
    expect(getMenuPermFlags(restricted, 'list')).toEqual({ s: true, r: true, w: true })
    expect(canReadMenu(restricted, 'messages')).toBe(true)
    expect(canWriteMenu(restricted, 'messages')).toBe(false)
    expect(canShowMenu(restricted, 'todo')).toBe(false)

    const superUser = buildUser({ role: 'superadmin', menu_perms: { list: '' } })
    expect(canWriteMenu(superUser, 'list')).toBe(true)

    const protectedAdmin = buildUser({ username: 'admin', role: 'admin', menu_perms: { list: '' } })
    expect(canWriteMenu(protectedAdmin, 'list')).toBe(true)
  })
})

describe('task-level permission helpers', () => {
  it('evaluates canEditTask and canDeleteTask (dept admin assigned_unit difference)', () => {
    const task = buildTask({
      reporter: 'creator1',
      reporter_dept: '製造部',
      req_depts: '製造部',
      assigned_unit: '資訊部',
    })

    // Dept admin of assigned_unit ('资讯部' == '資訊部') can EDIT, but CANNOT DELETE
    const itAdmin = buildUser({ username: 'itadmin', role: 'admin', dept: '资讯部' })
    expect(canEditTask(itAdmin, task)).toBe(true)
    expect(canDeleteTask(itAdmin, task)).toBe(false)

    // Dept admin of req_depts/reporter_dept can both EDIT and DELETE
    const mfgAdmin = buildUser({ username: 'mfgadmin', role: 'admin', dept: '制造部' })
    expect(canEditTask(mfgAdmin, task)).toBe(true)
    expect(canDeleteTask(mfgAdmin, task)).toBe(true)

    // Task creator can edit, delete, and clone
    const creator = buildUser({ username: 'creator1', role: 'user', dept: '業務部' })
    expect(canEditTask(creator, task)).toBe(true)
    expect(canDeleteTask(creator, task)).toBe(true)
    expect(canCloneTask(creator, task)).toBe(true)
    expect(canCloneTask(itAdmin, task)).toBe(false)
  })

  it('evaluates canSetReaders and canSetCross (superadmin excluded from cross)', () => {
    expect(canSetReaders(buildUser({ role: 'user' }))).toBe(false)
    expect(canSetReaders(buildUser({ role: 'admin' }))).toBe(true)
    expect(canSetReaders(buildUser({ role: 'superadmin' }))).toBe(true)

    expect(canSetCross(buildUser({ role: 'user' }))).toBe(false)
    expect(canSetCross(buildUser({ role: 'admin' }))).toBe(true)
    expect(canSetCross(buildUser({ role: 'superadmin' }))).toBe(false)
    expect(canSetCross(buildUser({ role: 'exec_assistant' }))).toBe(true)
  })

  it('distinguishes reader-only vs cross-viewer and report submission rights', () => {
    const task = buildTask({
      readers: 'viewer1',
      cross_dept: 1,
      cross_viewers: 'cross1',
      confidential: 1,
    })

    const viewer = buildUser({ username: 'viewer1', dept: '業務部' })
    expect(isReaderOnly(viewer, task)).toBe(true)
    expect(canSubmitReport(viewer, task)).toBe(false)
    expect(canEditTask(viewer, task)).toBe(false)

    const cross = buildUser({ username: 'cross1', dept: '業務部' })
    expect(isCrossViewer(cross, task)).toBe(true)
    expect(isReaderOnly(cross, task)).toBe(false)
    expect(canSubmitReport(cross, task)).toBe(true)

    // Cross-viewer blocked when confidential >= 2
    expect(isCrossViewer(cross, { ...task, confidential: 2 })).toBe(false)
  })

  it('evaluates canDeleteReportAttachment (superadmin excluded unless author/creator)', () => {
    const task = buildTask({ reporter: 'creator1', assigned_unit: '資訊部' })
    const report = { username: 'staff1' }

    expect(
      canDeleteReportAttachment(buildUser({ username: 'staff1' }), task, report),
    ).toBe(true)
    expect(
      canDeleteReportAttachment(buildUser({ username: 'creator1', dept: '業務部' }), task, report),
    ).toBe(true)
    expect(
      canDeleteReportAttachment(buildUser({ username: 'sup', role: 'superadmin', dept: '業務部' }), task, report),
    ).toBe(false)
    expect(
      canDeleteReportAttachment(buildUser({ username: 'vp', role: 'exec_vp', dept: '業務部' }), task, report),
    ).toBe(true)
    expect(
      canDeleteReportAttachment(buildUser({ username: 'itadmin', role: 'admin', dept: '資訊部' }), task, report),
    ).toBe(true)
  })

  it('enforces menu_perms.dashboard write flag for create/edit/delete/clone and D3 default scope', () => {
    const task = buildTask({ reporter: 'creator1', reporter_dept: '製造部', req_depts: '製造部' })
    const readOnlyCreator = buildUser({
      username: 'creator1',
      role: 'user',
      menu_perms: { dashboard: 'sr', list: 'srw' },
    })

    expect(canCreateTask(readOnlyCreator)).toBe(false)
    expect(canEditTask(readOnlyCreator, task)).toBe(false)
    expect(canDeleteTask(readOnlyCreator, task)).toBe(false)
    expect(canCloneTask(readOnlyCreator, task)).toBe(false)

    expect(getDefaultTaskScope(buildUser({ role: 'user' }))).toBe('all')
    expect(getDefaultTaskScope(buildUser({ role: 'admin' }))).toBe('all')
    expect(getDefaultTaskScope(buildUser({ role: 'exec_vp' }))).toBe('all')
  })

  it('evaluates canEditLesson for superadmin, exec, creator, same-dept admin, and menu perm', () => {
    const lesson = { created_by: '20160', dept: '資訊部' }

    expect(canEditLesson(buildUser({ username: '20160', role: 'user' }), lesson)).toBe(true)
    expect(canEditLesson(buildUser({ username: '18001', role: 'user' }), lesson)).toBe(false)
    expect(
      canEditLesson(buildUser({ username: 'admin1', role: 'admin', dept: '資訊部' }), lesson),
    ).toBe(true)
    expect(
      canEditLesson(buildUser({ username: 'admin2', role: 'admin', dept: 'HR' }), lesson),
    ).toBe(false)
    expect(
      canEditLesson(buildUser({ username: 'vp1', role: 'exec_vp', dept: 'HQ' }), lesson),
    ).toBe(true)
    expect(
      canEditLesson(
        buildUser({ username: '20160', role: 'user', menu_perms: { learnknow: 'sr' } }),
        lesson,
      ),
    ).toBe(false)
  })
})
