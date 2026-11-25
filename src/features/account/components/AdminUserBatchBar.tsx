import * as React from 'react'
import { Building2, CheckCheck, KeyRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/ui/button'
import { getDeptDisplayName, getSiteDisplayName, useMetaDepts, useMetaSites } from '@/hooks/use-meta'
import { ACCOUNT_STATUSES, type AdminUser } from '@/schemas/account'
import { resolveApiErrorMessage } from '@/services'
import { useBatchUpdateUsers } from '../api/admin-users'
import { getAssignableRoles } from '../utils/admin-permissions'
import type { AdminNotice } from './AdminUserFormModal'

type AdminUserBatchBarProps = {
  selectedUsers: AdminUser[]
  onClear: () => void
  onOpenBatchPerms: () => void
  onOpenBatchExtraDepts: () => void
  onNotify: (notice: AdminNotice) => void
}

const SELECT_CLS =
  'h-9 rounded-md border border-border bg-card px-2.5 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

export function AdminUserBatchBar({
  selectedUsers,
  onClear,
  onOpenBatchPerms,
  onOpenBatchExtraDepts,
  onNotify,
}: AdminUserBatchBarProps) {
  const { t, i18n } = useTranslation()
  const actor = useAppStore((s) => s.user)
  const deptsQuery = useMetaDepts()
  const sitesQuery = useMetaSites()
  const batchMutation = useBatchUpdateUsers()

  const [dept, setDept] = React.useState('')
  const [site, setSite] = React.useState('')
  const [role, setRole] = React.useState('')
  const [status, setStatus] = React.useState('')

  if (selectedUsers.length === 0) return null

  const assignableRoles = getAssignableRoles(actor)

  const handleApply = async () => {
    const changes: Partial<{ dept: string; site: string; role: string; status: string }> = {}
    if (dept) changes.dept = dept
    if (site) changes.site = site
    if (role) changes.role = role
    if (status) changes.status = status
    if (Object.keys(changes).length === 0) {
      onNotify({ tone: 'warning', text: t('account.admin.batch.emptyChange') })
      return
    }
    try {
      const res = await batchMutation.mutateAsync({
        ids: selectedUsers.map((u) => u.id),
        changes,
      })
      onNotify({
        tone: 'success',
        text: t('account.admin.toast.batchUpdated', { count: res.updated }),
      })
      setDept('')
      setSite('')
      setRole('')
      setStatus('')
      onClear()
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary-soft p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-primary">
          {t('account.admin.batch.selected', { count: selectedUsers.length })}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onOpenBatchPerms}>
            <KeyRound className="size-3.5" aria-hidden="true" />
            <span>{t('account.admin.batch.menuPerms')}</span>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onOpenBatchExtraDepts}>
            <Building2 className="size-3.5" aria-hidden="true" />
            <span>{t('account.admin.batch.extraDepts')}</span>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>
            <X className="size-3.5" aria-hidden="true" />
            <span>{t('common.reset')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <select
          aria-label={t('common.department')}
          className={SELECT_CLS}
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          <option value="">{t('account.admin.batch.keepDept')}</option>
          {(deptsQuery.data?.depts ?? []).map((d) => (
            <option key={d.value} value={d.value}>
              {getDeptDisplayName(d, i18n.language)}
            </option>
          ))}
        </select>

        <select
          aria-label={t('account.admin.fields.site')}
          className={SELECT_CLS}
          value={site}
          onChange={(e) => setSite(e.target.value)}
        >
          <option value="">{t('account.admin.batch.keepSite')}</option>
          {(sitesQuery.data?.sites ?? []).map((s) => (
            <option key={s.value} value={s.value}>
              {getSiteDisplayName(s, i18n.language)}
            </option>
          ))}
        </select>

        <select
          aria-label={t('account.admin.fields.role')}
          className={SELECT_CLS}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">{t('account.admin.batch.keepRole')}</option>
          {assignableRoles.map((r) => (
            <option key={r} value={r}>
              {t(`role.${r}`)}
            </option>
          ))}
        </select>

        <select
          aria-label={t('common.status')}
          className={SELECT_CLS}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{t('account.admin.batch.keepStatus')}</option>
          {ACCOUNT_STATUSES.map((st) => (
            <option key={st} value={st}>
              {t(`account.admin.statuses.${st}`)}
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="sm"
          disabled={batchMutation.isPending}
          onClick={() => void handleApply()}
        >
          <CheckCheck className="size-4" aria-hidden="true" />
          <span>{t('common.apply')}</span>
        </Button>
      </div>
    </div>
  )
}
