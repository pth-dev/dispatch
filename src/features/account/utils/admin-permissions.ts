import type { AdminUser } from '@/schemas/account'
import type { BackendUserRole, MenuPermKey, SessionUser } from '@/schemas/auth'
import {
  PROTECTED_USERNAME,
  canReadMenu,
  canWriteMenu,
  getUserDepts,
  isSuperLike,
} from '@/utils/permissions'
import { sameDept } from '@/utils/task-domain'

export type MenuPermDescriptor = {
  key: MenuPermKey
  labelKey: string
  writeSupported: boolean
}

export const MENU_PERM_ITEMS: readonly MenuPermDescriptor[] = [
  { key: 'dashboard', labelKey: 'account.admin.permKeys.dashboard', writeSupported: true },
  { key: 'dash_total', labelKey: 'account.admin.permKeys.dash_total', writeSupported: false },
  { key: 'dash_dept', labelKey: 'account.admin.permKeys.dash_dept', writeSupported: false },
  { key: 'list', labelKey: 'account.admin.permKeys.list', writeSupported: true },
  { key: 'todo', labelKey: 'account.admin.permKeys.todo', writeSupported: true },
  { key: 'messages', labelKey: 'account.admin.permKeys.messages', writeSupported: true },
  { key: 'learnknow', labelKey: 'account.admin.permKeys.learnknow', writeSupported: true },
  { key: 'language', labelKey: 'account.admin.permKeys.language', writeSupported: true },
  { key: 'worklog', labelKey: 'account.admin.permKeys.worklog', writeSupported: false },
  { key: 'report_pdf', labelKey: 'account.admin.permKeys.report_pdf', writeSupported: false },
  { key: 'kpi_report', labelKey: 'account.admin.permKeys.kpi_report', writeSupported: false },
  { key: 'excel_report', labelKey: 'account.admin.permKeys.excel_report', writeSupported: true },
  { key: 'kpi_people', labelKey: 'account.admin.permKeys.kpi_people', writeSupported: false },
  { key: 'kpi_brief', labelKey: 'account.admin.permKeys.kpi_brief', writeSupported: false },
  { key: 'account', labelKey: 'account.admin.permKeys.account', writeSupported: true },
  { key: 'ad', labelKey: 'account.admin.permKeys.ad', writeSupported: true },
] as const

export function isAnyAdmin(user: Pick<SessionUser, 'role'> | null | undefined): boolean {
  if (!user) return false
  return user.role === 'admin' || isSuperLike(user)
}

export function canAccessAccountAdminTab(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
): boolean {
  if (!isAnyAdmin(user)) return false
  return canReadMenu(user, 'account')
}

export function canAccessAdTab(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
): boolean {
  if (!isAnyAdmin(user)) return false
  return canReadMenu(user, 'ad')
}

export function canWriteAd(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
): boolean {
  if (!isAnyAdmin(user)) return false
  return canWriteMenu(user, 'ad')
}

export function canWriteAccountAdmin(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
): boolean {
  if (!isAnyAdmin(user)) return false
  return canWriteMenu(user, 'account')
}

export function canManageAdminUser(
  actor: Pick<SessionUser, 'username' | 'role' | 'dept' | 'extra_depts'> | null | undefined,
  target: Pick<AdminUser, 'username' | 'role' | 'dept'>,
): boolean {
  if (!actor) return false
  if (target.username.trim().toLowerCase() === PROTECTED_USERNAME) return false
  if (isSuperLike(actor)) return true
  if (actor.role === 'admin') {
    if (target.role !== 'user') return false
    return getUserDepts(actor).some((dept) => sameDept(dept, target.dept))
  }
  return false
}

export function canDeleteAdminUser(
  actor: Pick<SessionUser, 'username' | 'role' | 'dept' | 'extra_depts'> | null | undefined,
  target: Pick<AdminUser, 'username' | 'role' | 'dept'>,
): boolean {
  if (!actor) return false
  if (actor.username.trim().toLowerCase() === target.username.trim().toLowerCase()) return false
  return canManageAdminUser(actor, target)
}

export function canEditMenuPermsForTarget(
  actor: Pick<SessionUser, 'username' | 'role' | 'dept' | 'extra_depts'> | null | undefined,
  target: Pick<AdminUser, 'username' | 'role' | 'dept'>,
): boolean {
  if (!canManageAdminUser(actor, target)) return false
  return target.role === 'user' || target.role === 'admin'
}

export function getAssignableRoles(
  actor: Pick<SessionUser, 'role'> | null | undefined,
): BackendUserRole[] {
  if (isSuperLike(actor)) {
    return ['user', 'admin', 'superadmin', 'exec_assistant', 'exec_vp']
  }
  return ['user']
}

export type PermDraft = Record<MenuPermKey, { s: boolean; r: boolean; w: boolean }>

export function buildPermDraft(perms: Record<string, string> | null | undefined): PermDraft {
  const draft = {} as PermDraft
  for (const item of MENU_PERM_ITEMS) {
    if (!perms || !(item.key in perms)) {
      draft[item.key] = { s: true, r: true, w: item.writeSupported }
    } else {
      const raw = (perms[item.key] ?? '').toLowerCase()
      const w = item.writeSupported && raw.includes('w')
      const r = w || raw.includes('r')
      const s = r || raw.includes('s')
      draft[item.key] = { s, r, w }
    }
  }
  return draft
}

export function serializePermDraft(draft: PermDraft): Record<string, string> | null {
  const record: Record<string, string> = {}
  let allFull = true
  for (const item of MENU_PERM_ITEMS) {
    const entry = draft[item.key]
    const w = item.writeSupported && entry.w
    const r = w || entry.r
    const s = r || entry.s
    const value = `${s ? 's' : ''}${r ? 'r' : ''}${w ? 'w' : ''}`
    const full = item.writeSupported ? 'srw' : 'sr'
    if (value !== full) allFull = false
    record[item.key] = value
  }
  return allFull ? null : record
}
