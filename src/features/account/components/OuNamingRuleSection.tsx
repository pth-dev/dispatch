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
import type { OuRulePlanItem, OuRuleResponse } from '@/schemas/account-system'
import { resolveApiErrorMessage } from '@/services'
import { useRunOuRule } from '../api/admin-system'
import type { AdminNotice } from './AdminUserFormModal'

type OuNamingRuleSectionProps = {
  onNotify: (notice: AdminNotice) => void
}

function OuRulePlanRow({ item }: { item: OuRulePlanItem }) {
  return (
    <tr>
      <td className="px-3 py-1.5 font-medium text-foreground">
        {item.fullname ? `${item.fullname} (${item.username})` : item.username}
      </td>
      <td className="px-3 py-1.5 text-muted-foreground">{item.from_label || '—'}</td>
      <td className="px-3 py-1.5 font-medium text-destructive">{item.to || '—'}</td>
      <td className="px-3 py-1.5 text-muted-foreground">{item.path || '—'}</td>
    </tr>
  )
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
            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary text-left font-semibold text-primary">
                    <th className="px-3 py-2">{t('account.admin.fields.username')}</th>
                    <th className="px-3 py-2">{t('account.system.ouRule.fromCol')}</th>
                    <th className="px-3 py-2">{t('account.system.ouRule.toCol')}</th>
                    <th className="px-3 py-2">{t('account.system.ouRule.pathCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {changedItems.slice(0, 200).map((item) => (
                    <OuRulePlanRow key={item.username} item={item} />
                  ))}
                </tbody>
              </table>
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
