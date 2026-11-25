import * as React from 'react'
import { Archive, Download, ExternalLink, FileSpreadsheet, FileText, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import type { WebReportItem } from '@/schemas/report'
import { resolveApiErrorMessage } from '@/services'
import {
  fetchArchivedWebReportHtml,
  useDeleteWebReport,
  useWebReports,
} from '../api/queries'
import { hardenArchivedReportHtml, triggerTextFileDownload } from '../utils/report-domain'
import { downloadWebReportAsWord, exportArchivedHtmlAsExcel } from '../utils/web-report-domain'

function formatKb(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

type ArchiveActionMode = 'open' | 'html' | 'word' | 'excel'

export function WebReportArchiveList({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const archiveQuery = useWebReports(true)
  const deleteMutation = useDeleteWebReport()
  const [pendingDelete, setPendingDelete] = React.useState<WebReportItem | null>(null)
  const [busyId, setBusyId] = React.useState<number | null>(null)

  const handleAction = async (item: WebReportItem, action: ArchiveActionMode) => {
    setBusyId(item.id)
    try {
      const html = await fetchArchivedWebReportHtml(item.id)
      const safeHtml = hardenArchivedReportHtml(html)
      const fileBase = item.file_base || `Dispatch_Report_${item.id}`
      if (action === 'html') {
        triggerTextFileDownload(safeHtml, `${fileBase}.html`, 'text/html;charset=utf-8')
      } else if (action === 'word') {
        downloadWebReportAsWord(safeHtml, fileBase, item.title || fileBase)
      } else if (action === 'excel') {
        await exportArchivedHtmlAsExcel(safeHtml, fileBase)
      } else {
        const blob = new Blob([safeHtml], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank', 'noopener,noreferrer')
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
    setBusyId((current) => (current === item.id ? null : current))
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      onNotify(t('reports.web.deletedSuccess'))
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
    setPendingDelete(null)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Archive className="size-4 text-primary" aria-hidden="true" />
        <span>
          {t('reports.web.archiveTitle')} ({archiveQuery.data?.length ?? 0})
        </span>
      </h3>

      {archiveQuery.isLoading ? (
        <div role="status" className="h-24 motion-safe:animate-pulse rounded-lg border border-border bg-secondary">
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : archiveQuery.isError ? (
        <InlineError
          status={toErrorStatus(archiveQuery.error)}
          onRetry={() => void archiveQuery.refetch()}
        />
      ) : (archiveQuery.data?.length ?? 0) === 0 ? (
        <p className="text-xs text-muted-foreground">{t('reports.web.archiveEmpty')}</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {(archiveQuery.data ?? []).map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground">
                  {[
                    item.report_no,
                    `${item.range_start} ~ ${item.range_end}`,
                    item.subject_label,
                    item.createdAt,
                    formatKb(item.size_bytes),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void handleAction(item, 'open')}
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span>{t('reports.web.open')}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void handleAction(item, 'html')}
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  <span>{t('reports.web.download')}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void handleAction(item, 'word')}
                >
                  <FileText className="size-3.5" aria-hidden="true" />
                  <span>Word</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void handleAction(item, 'excel')}
                >
                  <FileSpreadsheet className="size-3.5" aria-hidden="true" />
                  <span>Excel</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => setPendingDelete(item)}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>{t('reports.web.delete')}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reports.web.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('reports.web.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmDelete()}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
