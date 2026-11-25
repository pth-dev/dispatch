import * as React from 'react'
import { CheckCheck, GitBranch, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import type { OuRulePlanItem, OuRuleResponse } from '@/schemas/account-system'
import { resolveApiErrorMessage } from '@/services'
import { useRunOuRule } from '../api/admin-system'
import type { AdminNotice } from './AdminUserFormModal'

type OuNamingRuleSectionProps = {
  onNotify: (notice: AdminNotice) => void
}

export function OuNamingRuleSection({ onNotify }: OuNamingRuleSectionProps) {
  const { t, i18n } = useTranslation()
  const ruleMutation = useRunOuRule()
  const [preview, setPreview] = React.useState<OuRuleResponse | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const handlePreview = async () => {
    try {
      const res = await ruleMutation.mutateAsync(true)
      setPreview(res)
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const handleApply = async () => {
    try {
      const res = await ruleMutation.mutateAsync(false)
      setConfirmOpen(false)
      onNotify({
        tone: 'success',
        text: t('account.system.ouRule.applied', { applied: res.applied, failed: res.failed }),
      })
      try {
        const refreshed = await ruleMutation.mutateAsync(true)
        setPreview(refreshed)
      } catch {
        // Post-apply preview refresh is best-effort; keep apply success notice intact.
      }
    } catch (error) {
      onNotify({ tone: 'error', text: resolveApiErrorMessage(error, t, i18n.language) })
    }
  }

  const changedItems = (preview?.plan ?? []).filter((item) => !item.unchanged)
  const columns: ColumnDef<OuRulePlanItem, unknown>[] = [
    {
      id: 'username',
      header: t('account.admin.fields.username'),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.fullname
            ? `${row.original.fullname} (${row.original.username})`
            : row.original.username}
        </span>
      ),
    },
    {
      id: 'from',
      header: t('account.system.ouRule.fromCol'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.from_label || '—'}</span>
      ),
    },
    {
      id: 'to',
      header: t('account.system.ouRule.toCol'),
      cell: ({ row }) => (
        <span className="font-medium text-destructive">{row.original.to || '—'}</span>
      ),
    },
    {
      id: 'path',
      header: t('account.system.ouRule.pathCol'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.path || '—'}</span>,
    },
  ]

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <GitBranch className="size-4 text-primary" aria-hidden="true" />
            <span>{t('account.system.ouRule.title')}</span>
          </h3>
          <p className="text-xs text-muted-foreground">{t('account.system.ouRule.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={ruleMutation.isPending}
            onClick={() => void handlePreview()}
          >
            <Search className="size-4" aria-hidden="true" />
            <span>{t('account.system.ouRule.previewBtn')}</span>
          </Button>
          <Button
            type="button"
            disabled={ruleMutation.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            <span>{t('account.system.ouRule.applyBtn')}</span>
          </Button>
        </div>
      </div>

      {preview && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">
            {t('account.system.ouRule.summary', {
              total: preview.total,
              changes: preview.changes,
            })}
          </p>
          {changedItems.length === 0 ? (
            <p className="text-xs text-success">{t('account.system.ouRule.allMatched')}</p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-lg border border-border bg-card">
              <DataTable
                data={changedItems.slice(0, 200)}
                columns={columns}
                keyExtractor={(item) => item.username}
                variant="embedded"
                density="compact"
              />
            </div>
          )}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('account.system.ouRule.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('account.system.ouRule.confirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={ruleMutation.isPending} onClick={() => void handleApply()}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
