import * as React from 'react'
import { Eye, ListChecks } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import type { AccountDeptNode, AdminUser } from '@/schemas/account'
import { useAdminUsers } from '../api/admin-users'
import { canManageAdminUser, canWriteAccountAdmin } from '../utils/admin-permissions'
import { AdminNoticeBanner } from './AdminNoticeBanner'
import type { AdminNotice } from './AdminUserFormModal'
import { ViewDeptsModal } from './ViewDeptsModal'

type AdminOuViewTabProps = {
  orgItems: AccountDeptNode[]
}

export function AdminOuViewTab({ orgItems }: AdminOuViewTabProps) {
  const { t } = useTranslation()
  const actor = useAppStore((s) => s.user)
  const canWrite = canWriteAccountAdmin(actor)
  const usersQuery = useAdminUsers(true)

  const [notice, setNotice] = React.useState<AdminNotice | null>(null)
  const [search, setSearch] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set())
  const [editTargets, setEditTargets] = React.useState<AdminUser[] | null>(null)

  const users = usersQuery.data ?? []
  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullname.toLowerCase().includes(q) ||
      u.dept.toLowerCase().includes(q)
    )
  })

  const selectedUsers = users.filter((u) => selectedIds.has(u.id) && canManageAdminUser(actor, u))

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const columns: ColumnDef<AdminUser, unknown>[] = [
    ...(canWrite
      ? [
          {
            id: 'select',
            header: '',
            meta: { width: '5%', align: 'center' as const },
            cell: ({ row }: { row: { original: AdminUser } }) => (
              <Checkbox
                aria-label={row.original.username}
                disabled={!canManageAdminUser(actor, row.original)}
                checked={selectedIds.has(row.original.id)}
                onCheckedChange={() => toggleSelect(row.original.id)}
              />
            ),
          },
        ]
      : []),
    {
      accessorKey: 'username',
      header: t('account.admin.fields.username'),
      meta: { width: '18%' },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-primary">{row.original.username}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.fullname || '—'}</div>
        </div>
      ),
    },
    {
      accessorKey: 'dept',
      header: t('common.department'),
      meta: { width: '20%' },
      cell: ({ row }) => <span className="text-foreground">{row.original.dept || '—'}</span>,
    },
    {
      id: 'view_depts',
      header: t('account.fields.viewDepts'),
      meta: { width: '45%' },
      cell: ({ row }) =>
        row.original.view_depts.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.original.view_depts.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-foreground"
              >
                {dept}
              </span>
            ))}
          </div>
        ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      meta: { width: '12%', align: 'right' },
      cell: ({ row }) =>
        canWrite && canManageAdminUser(actor, row.original) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditTargets([row.original])}
          >
            <Eye className="size-3.5" aria-hidden="true" />
            <span>{t('common.edit')}</span>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ]

  if (usersQuery.isError) {
    return (
      <InlineError
        status={toErrorStatus(usersQuery.error)}
        onRetry={() => void usersQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-3">
      <AdminNoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-base font-semibold text-foreground">{t('account.ouView.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('account.ouView.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="search"
              aria-label={t('account.admin.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('account.admin.searchPlaceholder')}
              className="w-full sm:w-60"
            />
            {canWrite && (
              <Button
                type="button"
                variant="outline"
                disabled={selectedUsers.length === 0}
                onClick={() => setEditTargets(selectedUsers)}
              >
                <ListChecks className="size-4" aria-hidden="true" />
                <span>{t('account.ouView.batchBtn', { count: selectedUsers.length })}</span>
              </Button>
            )}
          </div>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          isLoading={usersQuery.isLoading}
          density="compact"
          enablePagination
          keyExtractor={(row) => String(row.id)}
          emptyMessage={t('common.empty')}
        />
      </div>

      {editTargets && (
        <ViewDeptsModal
          key={editTargets.map((u) => u.id).join(',')}
          open={Boolean(editTargets)}
          onOpenChange={(open) => {
            if (!open) setEditTargets(null)
          }}
          targets={editTargets}
          orgItems={orgItems}
          onNotify={setNotice}
          onSaved={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  )
}
