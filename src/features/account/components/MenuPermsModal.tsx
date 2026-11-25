import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

function MenuPermRow({
  item,
  val,
  onToggle,
}: {
  item: (typeof MENU_PERM_ITEMS)[number]
  val: { s: boolean; r: boolean; w: boolean }
  onToggle: (key: MenuPermKey, level: 's' | 'r' | 'w', checked: boolean) => void
}) {
  const { t } = useTranslation()
  const label = t(item.labelKey)
  return (
    <tr className="hover:bg-secondary/50">
      <td className="px-3 py-2 font-medium text-foreground">{label}</td>
      <td className="px-3 py-2 text-center">
        <Checkbox
          aria-label={`${label} - ${t('account.admin.perms.showCol')}`}
          checked={val.s}
          onCheckedChange={(checked) => onToggle(item.key, 's', Boolean(checked))}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <Checkbox
          aria-label={`${label} - ${t('account.admin.perms.readCol')}`}
          checked={val.r}
          onCheckedChange={(checked) => onToggle(item.key, 'r', Boolean(checked))}
        />
      </td>
      <td className="px-3 py-2 text-center">
        {item.writeSupported ? (
          <Checkbox
            aria-label={`${label} - ${t('account.admin.perms.writeCol')}`}
            checked={val.w}
            onCheckedChange={(checked) => onToggle(item.key, 'w', Boolean(checked))}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  )
}

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
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-xs font-semibold text-primary">
              <th className="px-3 py-2.5">{t('account.admin.perms.featureCol')}</th>
              <th className="w-20 px-3 py-2.5 text-center">{t('account.admin.perms.showCol')}</th>
              <th className="w-20 px-3 py-2.5 text-center">{t('account.admin.perms.readCol')}</th>
              <th className="w-20 px-3 py-2.5 text-center">{t('account.admin.perms.writeCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {MENU_PERM_ITEMS.map((item) => (
              <MenuPermRow
                key={item.key}
                item={item}
                val={draft[item.key]}
                onToggle={toggleFlag}
              />
            ))}
          </tbody>
        </table>
      </div>
    </ResponsiveModal>
  )
}
