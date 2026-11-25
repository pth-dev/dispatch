import * as React from 'react'
import { AlertCircle, CheckCircle2, Plus, TriangleAlert, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { ACCOUNT_STATUSES, type AccountDeptNode, type AdminUser } from '@/schemas/account'
import { USER_ROLES } from '@/schemas/auth'
import { resolveApiErrorMessage } from '@/services'
import {
  useAdminUsers,
  useDeleteAdminUser,
  useForceLogoutUser,
  useUpdateAdminUser,
} from '../api/admin-users'
import {
  canEditMenuPermsForTarget,
  canManageAdminUser,
  canWriteAccountAdmin,
} from '../utils/admin-permissions'
import { AdminUserAdvancedModal } from './AdminUserAdvancedModal'
import { AdminUserBatchBar } from './AdminUserBatchBar'
import { AdminUserFormModal, type AdminNotice } from './AdminUserFormModal'
import { AdminUserRowActions } from './AdminUserRowActions'
import { ExtraDeptsModal } from './ExtraDeptsModal'
import { MenuPermsModal } from './MenuPermsModal'

type AdminUsersTabProps = {
  orgItems: AccountDeptNode[]
}

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

function statusTextClass(status: string): string {
  if (status === 'Approved') return 'text-success'
  if (status === 'Pending') return 'text-warning'
  return 'text-destructive'
}

export function AdminUsersTab({ orgItems }: AdminUsersTabProps) {
  const { t, i18n } = useTranslation()
  const actor = useAppStore((s) => s.user)
  const canWrite = canWriteAccountAdmin(actor)

  const usersQuery = useAdminUsers(true)
  const updateMutation = useUpdateAdminUser()
  const deleteMutation = useDeleteAdminUser()
  const forceLogoutMutation = useForceLogoutUser()

  const [notice, setNotice] = React.useState<AdminNotice | null>(null)
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set())

  const [formState, setFormState] = React.useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  })
  const [permTargets, setPermTargets] = React.useState<AdminUser[] | null>(null)
  const [extraDeptTargets, setExtraDeptTargets] = React.useState<AdminUser[] | null>(null)
  const [advancedTarget, setAdvancedTarget] = React.useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null)

  const users = usersQuery.data ?? []
  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false
    if (statusFilter && u.status !== statusFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullname.toLowerCase().includes(q) ||
      u.dept.toLowerCase().includes(q) ||
      u.site.toLowerCase().includes(q)
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

  const handleApprove = async (user: AdminUser) => {
    try {
      await updateMutation.mutateAsync({ id: user.id, data: { status: 'Approved' } })
      setNotice({ tone: 'success', text: t('account.admin.toast.userApproved') })
    } catch (error) {
      setNotice({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleForceLogout = async (user: AdminUser) => {
    try {
      await forceLogoutMutation.mutateAsync(user.id)
      setNotice({ tone: 'success', text: t('account.admin.toast.forceLoggedOut') })
    } catch (error) {
      setNotice({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setNotice({ tone: 'success', text: t('account.admin.toast.userDeleted') })
      setDeleteTarget(null)
    } catch (error) {
      setNotice({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const columns: ColumnDef<AdminUser, unknown>[] = [
    ...(canWrite
      ? [
          {
            id: 'select',
            header: '',
            meta: { width: '4%', align: 'center' as const },
            cell: ({ row }: { row: { original: AdminUser } }) => {
              const manageable = canManageAdminUser(actor, row.original)
              return (
                <Checkbox
                  aria-label={row.original.username}
                  disabled={!manageable}
                  checked={selectedIds.has(row.original.id)}
                  onCheckedChange={() => toggleSelect(row.original.id)}
                />
              )
            },
          },
        ]
      : []),
    {
      accessorKey: 'username',
      header: t('account.admin.fields.username'),
      meta: { width: '16%' },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-primary">{row.original.username}</div>
          <div className="text-xs text-muted-foreground uppercase">{row.original.auth_source}</div>
        </div>
      ),
    },
    {
      accessorKey: 'fullname',
      header: t('account.admin.fields.fullname'),
      meta: { width: '18%' },
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.fullname || '—'}</span>
      ),
    },
    {
      accessorKey: 'dept',
      header: t('common.department'),
      meta: { width: '18%' },
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate text-foreground">{row.original.dept || '—'}</div>
          {row.original.extra_depts.length > 0 && (
            <div className="truncate text-xs text-muted-foreground">
              +{row.original.extra_depts.length} ({t('account.fields.extraDepts')})
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'site',
      header: t('account.admin.fields.site'),
      meta: { width: '10%' },
      cell: ({ row }) => <span>{row.original.site || '—'}</span>,
    },
    {
      accessorKey: 'role',
      header: t('account.admin.fields.role'),
      meta: { width: '12%' },
      cell: ({ row }) => <span>{t(`role.${row.original.role}`)}</span>,
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      meta: { width: '10%' },
      cell: ({ row }) => (
        <span className={`font-medium ${statusTextClass(row.original.status)}`}>
          {t(`account.admin.statuses.${row.original.status}`, {
            defaultValue: row.original.status,
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      meta: { width: '12%', align: 'right' },
      cell: ({ row }) => (
        <AdminUserRowActions
          user={row.original}
          onApprove={(u) => void handleApprove(u)}
          onEdit={(u) => setFormState({ open: true, user: u })}
          onEditPerms={(u) => setPermTargets([u])}
          onEditExtraDepts={(u) => setExtraDeptTargets([u])}
          onForceLogout={(u) => void handleForceLogout(u)}
          onAdvanced={(u) => setAdvancedTarget(u)}
          onDelete={(u) => setDeleteTarget(u)}
        />
      ),
    },
  ]

  const handleOpenBatchPerms = () => {
    const eligible = selectedUsers.filter((u) => canEditMenuPermsForTarget(actor, u))
    if (eligible.length === 0) {
      setNotice({ tone: 'warning', text: t('account.admin.perms.noEligible') })
      return
    }
    setPermTargets(eligible)
  }

  const handleOpenBatchExtraDepts = () => {
    const eligible = selectedUsers.filter((u) => u.extra_depts_editable !== false)
    if (eligible.length === 0) {
      setNotice({ tone: 'warning', text: t('account.admin.perms.noEligible') })
      return
    }
    setExtraDeptTargets(eligible)
  }

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
      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {notice.tone === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
          ) : notice.tone === 'warning' ? (
            <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
          )}
          <span className="flex-1">{notice.text}</span>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setNotice(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              type="search"
              aria-label={t('account.admin.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('account.admin.searchPlaceholder')}
            />
            <select
              aria-label={t('account.admin.fields.role')}
              className={SELECT_CLS}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">{t('account.admin.allRoles')}</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`role.${role}`)}
                </option>
              ))}
            </select>
            <select
              aria-label={t('common.status')}
              className={SELECT_CLS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('status.all')}</option>
              {ACCOUNT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`account.admin.statuses.${st}`)}
                </option>
              ))}
            </select>
          </div>

          {canWrite && (
            <Button type="button" onClick={() => setFormState({ open: true, user: null })}>
              <Plus className="size-4" aria-hidden="true" />
              <span>{t('account.admin.actions.createUser')}</span>
            </Button>
          )}
        </div>

        {canWrite && (
          <AdminUserBatchBar
            selectedUsers={selectedUsers}
            onClear={() => setSelectedIds(new Set())}
            onNotify={setNotice}
            onOpenBatchPerms={handleOpenBatchPerms}
            onOpenBatchExtraDepts={handleOpenBatchExtraDepts}
          />
        )}

        <DataTable
          data={filteredUsers}
          columns={columns}
          isLoading={usersQuery.isLoading}
          density="compact"
          enablePagination
          keyExtractor={(row) => String(row.id)}
          emptyMessage={t('common.empty')}
        />
      </div>

      {formState.open && (
        <AdminUserFormModal
          key={formState.user ? `edit-${formState.user.id}` : 'create'}
          open={formState.open}
          onOpenChange={(open) => setFormState((prev) => ({ ...prev, open }))}
          editingUser={formState.user}
          onNotify={setNotice}
        />
      )}

      {permTargets && (
        <MenuPermsModal
          key={permTargets.map((u) => u.id).join(',')}
          open={Boolean(permTargets)}
          onOpenChange={(open) => {
            if (!open) setPermTargets(null)
          }}
          targets={permTargets}
          onNotify={setNotice}
        />
      )}

      {extraDeptTargets && (
        <ExtraDeptsModal
          key={extraDeptTargets.map((u) => u.id).join(',')}
          open={Boolean(extraDeptTargets)}
          onOpenChange={(open) => {
            if (!open) setExtraDeptTargets(null)
          }}
          targets={extraDeptTargets}
          orgItems={orgItems}
          onNotify={setNotice}
        />
      )}

      {advancedTarget && (
        <AdminUserAdvancedModal
          key={advancedTarget.id}
          open={Boolean(advancedTarget)}
          onOpenChange={(open) => {
            if (!open) setAdvancedTarget(null)
          }}
          target={advancedTarget}
          onNotify={setNotice}
        />
      )}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('account.admin.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('account.admin.deleteConfirm.desc', {
                username: deleteTarget?.username ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => void handleConfirmDelete()}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
