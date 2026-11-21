import type * as React from 'react'
import { useAppStore } from '@/app/store'
import { throwFullPageError } from '@/components/layout/error-status'
import type { MenuPermKey } from '@/schemas/auth'
import { canReadMenu, canWriteMenu } from '@/utils/permissions'

type RequireMenuPermProps = {
  perm: MenuPermKey
  level?: 'r' | 'w'
  children: React.ReactNode
}

/**
 * Route-level permission guard for `menu_perms` (docs/DEVIATIONS.md §5).
 * Throws a full-page 403 error outside the app shell when the signed-in user
 * lacks the required menu permission.
 */
export function RequireMenuPerm({ perm, level = 'r', children }: RequireMenuPermProps) {
  const user = useAppStore((s) => s.user)
  const allowed = level === 'w' ? canWriteMenu(user, perm) : canReadMenu(user, perm)
  if (!allowed) {
    throwFullPageError('403')
  }
  return children
}
