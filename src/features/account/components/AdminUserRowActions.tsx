import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  KeyRound,
  LogOut,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/ui/button'
import type { AdminUser } from '@/schemas/account'
import { isSuperLike } from '@/utils/permissions'
import {
  canDeleteAdminUser,
  canEditMenuPermsForTarget,
  canManageAdminUser,
  canWriteAccountAdmin,
} from '../utils/admin-permissions'

type AdminUserRowActionsProps = {
  user: AdminUser
  onApprove: (user: AdminUser) => void
  onEdit: (user: AdminUser) => void
  onEditPerms: (user: AdminUser) => void
  onEditExtraDepts: (user: AdminUser) => void
  onForceLogout: (user: AdminUser) => void
  onAdvanced: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}

export function AdminUserRowActions({
  user,
  onApprove,
  onEdit,
  onEditPerms,
  onEditExtraDepts,
  onForceLogout,
  onAdvanced,
  onDelete,
}: AdminUserRowActionsProps) {
  const { t } = useTranslation()
  const actor = useAppStore((s) => s.user)

  if (!canWriteAccountAdmin(actor) || !canManageAdminUser(actor, user)) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const canPerms = canEditMenuPermsForTarget(actor, user)
  const canDelete = canDeleteAdminUser(actor, user)
  const canAdvanced = isSuperLike(actor)
  const canExtraDepts = user.extra_depts_editable !== false

  return (
    <div className="flex items-center justify-end gap-0.5">
      {user.status === 'Pending' && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-success hover:text-success"
          title={t('account.admin.actions.approve')}
          aria-label={t('account.admin.actions.approve')}
          onClick={() => onApprove(user)}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        title={t('common.edit')}
        aria-label={t('common.edit')}
        onClick={() => onEdit(user)}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      {canPerms && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-primary hover:text-primary"
          title={t('account.admin.actions.menuPerms')}
          aria-label={t('account.admin.actions.menuPerms')}
          onClick={() => onEditPerms(user)}
        >
          <KeyRound className="size-4" aria-hidden="true" />
        </Button>
      )}
      {canExtraDepts && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          title={t('account.admin.actions.extraDepts')}
          aria-label={t('account.admin.actions.extraDepts')}
          onClick={() => onEditExtraDepts(user)}
        >
          <Building2 className="size-4" aria-hidden="true" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        title={t('account.admin.actions.forceLogout')}
        aria-label={t('account.admin.actions.forceLogout')}
        onClick={() => onForceLogout(user)}
      >
        <LogOut className="size-4" aria-hidden="true" />
      </Button>
      {canAdvanced && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          title={t('account.admin.actions.advanced')}
          aria-label={t('account.admin.actions.advanced')}
          onClick={() => onAdvanced(user)}
        >
          <ArrowLeftRight className="size-4" aria-hidden="true" />
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          title={t('common.delete')}
          aria-label={t('common.delete')}
          onClick={() => onDelete(user)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
