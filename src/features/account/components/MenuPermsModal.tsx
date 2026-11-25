import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import type { AdminUser } from '@/schemas/account'
import type { MenuPermKey } from '@/schemas/auth'
import { resolveApiErrorMessage } from '@/services'
import { useSaveMenuPerms } from '../api/admin-users'
import {
  MENU_PERM_ITEMS,
  buildPermDraft,
  serializePermDraft,
  type PermDraft,
} from '../utils/admin-permissions'
import type { AdminNotice } from './AdminUserFormModal'

type MenuPermsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targets: AdminUser[]
  onNotify: (notice: AdminNotice) => void
}

type MenuPermItem = (typeof MENU_PERM_ITEMS)[number]

export function MenuPermsModal({ open, onOpenChange, targets, onNotify }: MenuPermsModalProps) {
  const { t, i18n } = useTranslation()
  const saveMutation = useSaveMenuPerms()
  const single = targets.length === 1 ? targets[0] : null
  const [draft, setDraft] = React.useState<PermDraft>(() => buildPermDraft(single?.menu_perms))

  const toggleFlag = (key: MenuPermKey, level: 's' | 'r' | 'w', checked: boolean) => {
    setDraft((prev) => {
      const current = prev[key]
      const next =
        level === 'w'
          ? checked
            ? { s: true, r: true, w: true }
            : { ...current, w: false }
          : level === 'r'
            ? checked
              ? { ...current, s: true, r: true }
              : { s: current.s, r: false, w: false }
            : checked
              ? { ...current, s: true }
              : { s: false, r: false, w: false }
      return { ...prev, [key]: next }
    })
  }

  const handleSave = async (resetAll = false) => {
    const ids = targets.map((u) => u.id)
    if (ids.length === 0) return
    try {
      await saveMutation.mutateAsync({
        ids,
        perms: resetAll ? null : serializePermDraft(draft),
      })
      onNotify({ tone: 'success', text: t('account.admin.toast.permsSaved') })
      onOpenChange(false)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const columns: ColumnDef<MenuPermItem, unknown>[] = [
    {
      id: 'feature',
      header: t('account.admin.perms.featureCol'),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{t(row.original.labelKey)}</span>
      ),
    },
    {
      id: 'show',
      header: t('account.admin.perms.showCol'),
      meta: { width: '80px', align: 'center' },
      cell: ({ row }) => {
        const label = t(row.original.labelKey)
        return (
          <Checkbox
            aria-label={`${label} - ${t('account.admin.perms.showCol')}`}
            checked={draft[row.original.key].s}
            onCheckedChange={(checked) => toggleFlag(row.original.key, 's', Boolean(checked))}
          />
        )
      },
    },
    {
      id: 'read',
      header: t('account.admin.perms.readCol'),
      meta: { width: '80px', align: 'center' },
      cell: ({ row }) => {
        const label = t(row.original.labelKey)
        return (
          <Checkbox
            aria-label={`${label} - ${t('account.admin.perms.readCol')}`}
            checked={draft[row.original.key].r}
            onCheckedChange={(checked) => toggleFlag(row.original.key, 'r', Boolean(checked))}
          />
        )
      },
    },
    {
      id: 'write',
      header: t('account.admin.perms.writeCol'),
      meta: { width: '80px', align: 'center' },
      cell: ({ row }) => {
        const label = t(row.original.labelKey)
        if (!row.original.writeSupported) {
          return <span className="text-xs text-muted-foreground">—</span>
        }
        return (
          <Checkbox
            aria-label={`${label} - ${t('account.admin.perms.writeCol')}`}
            checked={draft[row.original.key].w}
            onCheckedChange={(checked) => toggleFlag(row.original.key, 'w', Boolean(checked))}
          />
        )
      },
    },
  ]

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={t('account.admin.perms.title')}
      description={
        single
          ? `${single.fullname || single.username} (${single.username})`
          : t('account.admin.perms.batchDesc', { count: targets.length })
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saveMutation.isPending}
            onClick={() => void handleSave(true)}
          >
            {t('account.admin.perms.resetFull')}
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => void handleSave(false)}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">{t('account.admin.perms.hierarchyHint')}</p>
      <div className="rounded-lg border border-border bg-card">
        <DataTable
          data={MENU_PERM_ITEMS}
          columns={columns}
          keyExtractor={(item) => item.key}
          variant="embedded"
          density="compact"
        />
      </div>
    </ResponsiveModal>
  )
}
