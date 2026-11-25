import { describe, expect, it } from 'vitest'
import {
  buildPermDraft,
  canDeleteAdminUser,
  canEditMenuPermsForTarget,
  canManageAdminUser,
  getAssignableRoles,
  serializePermDraft,
} from './admin-permissions'

describe('admin-permissions', () => {
  const superAdmin = { username: 'boss', role: 'superadmin' as const, dept: '資訊部' }
  const deptAdmin = {
    username: 'it_lead',
    role: 'admin' as const,
    dept: '資訊部',
    extra_depts: ['品質部'],
  }
  const regularUser = { username: 'staff1', role: 'user' as const, dept: '資訊部' }

  it('protects the built-in admin account from management and deletion', () => {
    const protectedTarget = { username: 'admin', role: 'superadmin' as const, dept: '資訊部' }
    expect(canManageAdminUser(superAdmin, protectedTarget)).toBe(false)
    expect(canDeleteAdminUser(superAdmin, protectedTarget)).toBe(false)
  })

  it('restricts dept admin to regular users within primary or extra_depts', () => {
    expect(canManageAdminUser(deptAdmin, regularUser)).toBe(true)
    expect(
      canManageAdminUser(deptAdmin, { username: 'qa1', role: 'user', dept: '品質部' }),
    ).toBe(true)
    expect(
      canManageAdminUser(deptAdmin, { username: 'mfg1', role: 'user', dept: '製造部' }),
    ).toBe(false)
    expect(
      canManageAdminUser(deptAdmin, { username: 'other_admin', role: 'admin', dept: '資訊部' }),
    ).toBe(false)
  })

  it('blocks self-deletion even for superadmin', () => {
    expect(canDeleteAdminUser(superAdmin, superAdmin)).toBe(false)
    expect(canDeleteAdminUser(superAdmin, regularUser)).toBe(true)
  })

  it('limits menu_perms editing to user and admin targets only', () => {
    expect(canEditMenuPermsForTarget(superAdmin, regularUser)).toBe(true)
    expect(canEditMenuPermsForTarget(superAdmin, deptAdmin)).toBe(true)
    expect(
      canEditMenuPermsForTarget(superAdmin, { username: 'vp1', role: 'exec_vp', dept: '資訊部' }),
    ).toBe(false)
  })

  it('returns assignable roles per actor tier', () => {
    expect(getAssignableRoles(deptAdmin)).toEqual(['user'])
    expect(getAssignableRoles(superAdmin)).toContain('exec_vp')
  })

  it('round-trips full menu permissions to null and preserves restricted flags', () => {
    const full = buildPermDraft(null)
    expect(serializePermDraft(full)).toBeNull()

    const restricted = buildPermDraft({ dashboard: 'sr', list: '' })
    expect(restricted.dashboard).toEqual({ s: true, r: true, w: false })
    expect(restricted.list).toEqual({ s: false, r: false, w: false })
    const serialized = serializePermDraft(restricted)
    expect(serialized?.dashboard).toBe('sr')
    expect(serialized?.list).toBe('')
  })
})
