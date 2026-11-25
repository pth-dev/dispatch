import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import type { AccountDeptNode, AdminUser } from '@/schemas/account'
import { resolveApiErrorMessage } from '@/services'
import { sameDept } from '@/utils/task-domain'
import { useSaveUserExtraDepts } from '../api/admin-users'
import type { AdminNotice } from './AdminUserFormModal'

type ExtraDeptsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targets: AdminUser[]
  orgItems: AccountDeptNode[]
  onNotify: (notice: AdminNotice) => void
}

function ExtraDeptOptionRow({
  node,
  checked,
  isPrimary,
  onToggle,
}: {
  node: AccountDeptNode
  checked: boolean
  isPrimary: boolean
  onToggle: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-secondary/50">
      <Checkbox
        checked={checked}
        disabled={isPrimary}
        onCheckedChange={() => onToggle(node.value)}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">
          {node.label || node.value}
          {isPrimary && (
            <span className="ml-2 text-xs text-primary">
              ({t('account.admin.extraDepts.primary')})
            </span>
          )}
        </div>
        {node.path && <div className="truncate text-xs text-muted-foreground">{node.path}</div>}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {t('account.orgTree.membersCount', { count: node.members })}
      </span>
    </label>
  )
}

const BATCH_MODE_LABELS = {
  set: 'account.admin.batchModes.replace',
  add: 'account.admin.batchModes.add',
  remove: 'account.admin.batchModes.remove',
} as const

export function ExtraDeptsModal({
  open,
  onOpenChange,
  targets,
  orgItems,
  onNotify,
}: ExtraDeptsModalProps) {
  const { t, i18n } = useTranslation()
  const saveMutation = useSaveUserExtraDepts()
  const single = targets.length === 1 ? targets[0] : null

  const [query, setQuery] = React.useState('')
  const [mode, setMode] = React.useState<'set' | 'add' | 'remove'>('set')
  const [picked, setPicked] = React.useState<Set<string>>(
    () => new Set(single?.extra_depts ?? []),
  )

  const filtered = orgItems.filter((node) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      node.value.toLowerCase().includes(q) ||
      node.label.toLowerCase().includes(q) ||
      node.path.toLowerCase().includes(q)
    )
  })

  const toggleDept = (value: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const handleSave = async () => {
    const depts = Array.from(picked)
    const ous = orgItems
      .filter((node) => node.ou_dn && picked.has(node.value))
      .map((node) => node.ou_dn)

    try {
      await saveMutation.mutateAsync(
        single
          ? { singleId: single.id, depts, ous }
          : { ids: targets.map((u) => u.id), depts, ous, mode },
      )
      onNotify({ tone: 'success', text: t('account.admin.toast.extraDeptsSaved') })
      onOpenChange(false)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title={t('account.admin.extraDepts.title')}
      description={
        single
          ? `${single.fullname || single.username} (${single.username})`
          : t('account.admin.extraDepts.batchDesc', { count: targets.length })
      }
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t('account.admin.extraDepts.selectedCount', { count: picked.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => void handleSave()}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {!single && (
          <div className="flex flex-wrap items-center gap-2">
            {(['set', 'add', 'remove'] as const).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                aria-pressed={mode === m}
                variant={mode === m ? 'default' : 'outline'}
                onClick={() => setMode(m)}
              >
                {t(BATCH_MODE_LABELS[m])}
              </Button>
            ))}
          </div>
        )}

        <Input
          type="search"
          aria-label={t('account.orgTree.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('account.orgTree.searchPlaceholder')}
        />

        <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-lg border border-border">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {t('account.orgTree.empty')}
            </p>
          ) : (
            filtered.map((node) => {
              const isPrimary = Boolean(single && sameDept(single.dept, node.value))
              return (
                <ExtraDeptOptionRow
                  key={`${node.source}-${node.value}-${node.ou_dn}`}
                  node={node}
                  checked={isPrimary || picked.has(node.value)}
                  isPrimary={isPrimary}
                  onToggle={toggleDept}
                />
              )
            })
          )}
        </div>
      </div>
    </ResponsiveModal>
  )
}
