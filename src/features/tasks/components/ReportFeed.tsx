import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CircleAlert } from 'lucide-react'
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
import { InlineError, toErrorStatus } from '@/components/layout'
import type { SessionUser } from '@/schemas/auth'
import type { RawReport, RawTask } from '@/schemas/task'
import { resolveApiErrorMessage } from '@/services'
import { useDeleteReportAttachment, useUpdateReport } from '../api/queries'
import { ReportFeedItem } from './ReportFeedItem'

type ReportFeedProps = {
  task: RawTask
  user: SessionUser | null
  reports: RawReport[]
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
}

export function ReportFeed({
  task,
  user,
  reports,
  isLoading,
  isError = false,
  error,
  onRetry,
}: ReportFeedProps) {
  const { t, i18n } = useTranslation()
  const updateReport = useUpdateReport()
  const deleteAttachment = useDeleteReportAttachment()

  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editingContent, setEditingContent] = React.useState('')
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [pendingDeleteAtt, setPendingDeleteAtt] = React.useState<{
    reportId: number
    path: string
  } | null>(null)

  const startEdit = (report: RawReport) => {
    setActionError(null)
    setEditingId(report.id)
    setEditingContent(report.content ?? '')
  }

  const saveEdit = async (reportId: number) => {
    const trimmed = editingContent.trim()
    if (!trimmed) return
    setActionError(null)
    try {
      await updateReport.mutateAsync({ taskId: task.id, reportId, content: trimmed })
      setEditingId(null)
    } catch (err) {
      setActionError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  const handleConfirmRemoveAttachment = async () => {
    if (!pendingDeleteAtt) return
    const target = pendingDeleteAtt
    setPendingDeleteAtt(null)
    setActionError(null)
    try {
      await deleteAttachment.mutateAsync({
        taskId: task.id,
        reportId: target.reportId,
        path: target.path,
      })
    } catch (err) {
      setActionError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground"
      >
        {t('common.loading')}
      </div>
    )
  }

  if (isError) {
    return <InlineError status={toErrorStatus(error)} onRetry={onRetry} />
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
        {t('tasks.detail.noTimeline')}
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        {t('tasks.report.feedTitle', { count: reports.length })}
      </h2>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-destructive"
        >
          <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="space-y-3">
        {reports.map((report) => (
          <ReportFeedItem
            key={report.id}
            task={task}
            user={user}
            report={report}
            isEditing={editingId === report.id}
            editingContent={editingContent}
            isSavingEdit={updateReport.isPending}
            isDeletingAtt={deleteAttachment.isPending}
            onStartEdit={startEdit}
            onCancelEdit={() => setEditingId(null)}
            onEditingContentChange={setEditingContent}
            onSaveEdit={(id) => void saveEdit(id)}
            onRequestDeleteAttachment={(reportId, path) =>
              setPendingDeleteAtt({ reportId, path })
            }
          />
        ))}
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteAtt)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteAtt(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.report.deleteAttConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.report.deleteAttConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmRemoveAttachment()}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
