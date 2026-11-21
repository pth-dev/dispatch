import type { MenuPermKey, SessionUser } from '@/schemas/auth'
import type { RawReport, RawTask } from '@/schemas/task'
import { parseAssigneeList, parseReqDepts, sameDept } from './task-domain'

export const PROTECTED_USERNAME = 'admin'
export const READERS_MAX = 100
export const CROSS_VIEWERS_MAX = 100

export type MenuPermFlags = {
  s: boolean
  r: boolean
  w: boolean
}

type UserIdentity = Pick<SessionUser, 'username' | 'role' | 'dept' | 'menu_perms'>

type TaskPermissionTarget = Pick<
  RawTask,
  | 'reporter'
  | 'reporter_dept'
  | 'req_dept'
  | 'req_depts'
  | 'assigned_unit'
  | 'assign_person'
  | 'readers'
  | 'cross_dept'
  | 'cross_viewers'
  | 'confidential'
>

function includesUser(list: string[], username: string): boolean {
  const target = username.trim().toLowerCase()
  if (!target) return false
  return list.some((item) => item.trim().toLowerCase() === target)
}

export function isExec(user: Pick<SessionUser, 'role'> | null | undefined): boolean {
  if (!user) return false
  return user.role === 'exec_assistant' || user.role === 'exec_vp'
}

export function isSuperLike(user: Pick<SessionUser, 'role'> | null | undefined): boolean {
  if (!user) return false
  return user.role === 'superadmin' || isExec(user)
}

/**
 * Evaluates per-account `menu_perms` (s/r/w hierarchy: w => r => s).
 * - `superadmin`, `exec_*`, and protected `'admin'` account are unrestricted.
 * - `menu_perms === null` or missing key defaults to full access (`srw`).
 */
export function getMenuPermFlags(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
  key: MenuPermKey,
): MenuPermFlags {
  if (!user) {
    return { s: false, r: false, w: false }
  }
  if (isSuperLike(user) || user.username === PROTECTED_USERNAME) {
    return { s: true, r: true, w: true }
  }

  const perms = user.menu_perms
  if (!perms || !(key in perms)) {
    return { s: true, r: true, w: true }
  }

  const raw = (perms[key] ?? '').toLowerCase()
  const w = raw.includes('w')
  const r = w || raw.includes('r')
  const s = r || raw.includes('s')
  return { s, r, w }
}

export function canShowMenu(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
  key: MenuPermKey,
): boolean {
  return getMenuPermFlags(user, key).s
}

export function canReadMenu(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
  key: MenuPermKey,
): boolean {
  return getMenuPermFlags(user, key).r
}

export function canWriteMenu(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
  key: MenuPermKey,
): boolean {
  return getMenuPermFlags(user, key).w
}

export function isCrossViewer(
  user: UserIdentity | null | undefined,
  task: Pick<TaskPermissionTarget, 'cross_dept' | 'confidential' | 'cross_viewers'>,
): boolean {
  if (!user) return false
  if (Number(task.cross_dept ?? 0) !== 1) return false
  if (Number(task.confidential ?? 0) > 1) return false
  const viewers = parseAssigneeList(task.cross_viewers, CROSS_VIEWERS_MAX)
  return includesUser(viewers, user.username)
}

function userMatchesAnyTaskDept(userDept: string, task: TaskPermissionTarget): boolean {
  if (!userDept) return false
  if (sameDept(userDept, task.assigned_unit)) return true
  if (sameDept(userDept, task.reporter_dept)) return true
  const reqDepts = parseReqDepts(task.req_depts, task.req_dept)
  return reqDepts.some((dept) => sameDept(userDept, dept))
}

function sameUser(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = (a ?? '').trim().toLowerCase()
  const nb = (b ?? '').trim().toLowerCase()
  return na.length > 0 && na === nb
}

/**
 * Default task list scope: matches legacy (`scopeChip = 'all'`),
 * defaulting all roles to `all`.
 */
export function getDefaultTaskScope(
  user?: Pick<SessionUser, 'role'> | null,
): 'all' {
  void user
  return 'all'
}

export function canCreateTask(user: UserIdentity | null | undefined): boolean {
  if (!user) return false
  return canWriteMenu(user, 'dashboard')
}

/**
 * True when user is listed in `readers` and has no elevated relationship
 * (not creator, assignee, cross-viewer, super-like, or same-dept).
 */
export function isReaderOnly(
  user: UserIdentity | null | undefined,
  task: TaskPermissionTarget,
): boolean {
  if (!user) return false
  const readers = parseAssigneeList(task.readers, READERS_MAX)
  if (!includesUser(readers, user.username)) return false

  if (isSuperLike(user)) return false
  if (sameUser(task.reporter, user.username)) return false
  if (includesUser(parseAssigneeList(task.assign_person), user.username)) return false
  if (isCrossViewer(user, task)) return false
  if (userMatchesAnyTaskDept(user.dept, task)) return false

  return true
}

export function canEditTask(
  user: UserIdentity | null | undefined,
  task: TaskPermissionTarget,
): boolean {
  if (!user) return false
  if (!canWriteMenu(user, 'dashboard')) return false
  if (isReaderOnly(user, task)) return false
  if (isSuperLike(user)) return true
  if (sameUser(task.reporter, user.username)) return true

  if (user.role === 'admin') {
    return userMatchesAnyTaskDept(user.dept, task)
  }

  return false
}

/**
 * Matches legacy `DU_canDeleteTask`:
 * Unlike `canEditTask`, department `admin` only matches `reporter_dept` or `req_depts`
 * (NOT `assigned_unit`).
 */
export function canDeleteTask(
  user: UserIdentity | null | undefined,
  task: Pick<TaskPermissionTarget, 'reporter' | 'reporter_dept' | 'req_dept' | 'req_depts'>,
): boolean {
  if (!user) return false
  if (!canWriteMenu(user, 'dashboard')) return false
  if (isSuperLike(user)) return true
  if (sameUser(task.reporter, user.username)) return true

  if (user.role === 'admin' && user.dept) {
    if (sameDept(user.dept, task.reporter_dept)) return true
    const reqDepts = parseReqDepts(task.req_depts, task.req_dept)
    return reqDepts.some((dept) => sameDept(user.dept, dept))
  }

  return false
}

export function canSetReaders(user: Pick<SessionUser, 'role'> | null | undefined): boolean {
  if (!user) return false
  return isSuperLike(user) || user.role === 'admin'
}

/**
 * Matches legacy `DU_canSetCross`: `exec_*` and `admin` only (`superadmin` excluded in FE).
 */
export function canSetCross(user: Pick<SessionUser, 'role'> | null | undefined): boolean {
  if (!user) return false
  return isExec(user) || user.role === 'admin'
}

/**
 * Matches legacy `DU_canDeleteReportAtt`:
 * `exec_*`, report author, task creator, or same-dept `admin` (`superadmin` excluded unless author/creator).
 */
export function canDeleteReportAttachment(
  user: UserIdentity | null | undefined,
  task: TaskPermissionTarget,
  report: Pick<RawReport, 'username'>,
): boolean {
  if (!user) return false
  if (isExec(user)) return true
  if (sameUser(report.username, user.username)) return true
  if (sameUser(task.reporter, user.username)) return true

  if (user.role === 'admin') {
    return userMatchesAnyTaskDept(user.dept, task)
  }

  return false
}

export function canCloneTask(
  user: UserIdentity | null | undefined,
  task: Pick<RawTask, 'reporter'>,
): boolean {
  if (!user) return false
  if (!canWriteMenu(user, 'dashboard')) return false
  return sameUser(task.reporter, user.username)
}

export function canSubmitReport(
  user: UserIdentity | null | undefined,
  task: TaskPermissionTarget,
): boolean {
  if (!user) return false
  return canWriteMenu(user, 'list') && !isReaderOnly(user, task)
}

const COMPUTER_ROOM_PATTERN = /电脑|電腦/

/**
 * Matches legacy `DU_isComputerRoom`: checks backend `is_computer_room` flag
 * or whether `dept` / `dept_ou_dn` / `ad_dn` contains "电脑" / "電腦".
 */
export function isComputerRoomUser(
  user: Pick<SessionUser, 'is_computer_room' | 'dept' | 'dept_ou_dn' | 'ad_dn'> | null | undefined,
): boolean {
  if (!user) return false
  if (user.is_computer_room === true) return true
  return [user.dept, user.dept_ou_dn, user.ad_dn].some(
    (value) => typeof value === 'string' && COMPUTER_ROOM_PATTERN.test(value),
  )
}
