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
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { SessionUser } from '@/schemas/auth'
import type { RawReport, RawTask, WorkItemsEnvelope } from '@/schemas/task'
import { resolveApiErrorMessage } from '@/services'
import { cn } from '@/utils/cn'
import { useDeleteReportAttachment, useUpdateReport } from '../api/queries'
import {
  computeWorkItemReportStats,
  parseReportWorkTopics,
} from '../utils/work-items-domain'
import { ReportFeedItem } from './ReportFeedItem'

type ReportFeedProps = {
  task: RawTask
  user: SessionUser | null
  reports: RawReport[]
  workItems?: WorkItemsEnvelope | null
  activeTopicFilter?: string
  onTopicFilterChange?: (topicId: string) => void
  isLoading: boolean
  isError?: boolean
  error?: unknown
  onRetry?: () => void
}

export function ReportFeed({
  task,
  user,
  reports,
  workItems = null,
  activeTopicFilter = '',
  onTopicFilterChange,
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
    return <LoadingSpinner size="md" className="rounded-xl border border-border bg-card p-6" />
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

  const workItemsList = workItems?.items ?? []
  const reportStats = workItemsList.length > 0 ? computeWorkItemReportStats(reports) : {}
  const generalCount =
    workItemsList.length > 0
      ? reports.filter((r) => parseReportWorkTopics(r).length === 0).length
      : 0

  const filteredReports =
    !activeTopicFilter || workItemsList.length === 0
      ? reports
      : reports.filter((r) => {
          const ids = parseReportWorkTopics(r).map((x) => x.id)
          return activeTopicFilter === '_none' ? ids.length === 0 : ids.includes(activeTopicFilter)
        })

  const chipClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
    )

  return (
    <section id="report-feed" className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        {t('tasks.report.feedTitle', { count: filteredReports.length })}
      </h2>

      {workItemsList.length > 0 && onTopicFilterChange && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-border">
          <button
            type="button"
            onClick={() => onTopicFilterChange('')}
            className={chipClass(activeTopicFilter === '')}
          >
            <span>{t('common.all')}</span>
            <span className="tabular-nums opacity-80">{reports.length}</span>
          </button>
          {workItemsList.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTopicFilterChange(activeTopicFilter === item.id ? '' : item.id)}
              className={chipClass(activeTopicFilter === item.id)}
            >
              <span className="max-w-[160px] truncate">
                {idx + 1}. {item.topic}
              </span>
              <span className="tabular-nums opacity-80">{reportStats[item.id]?.count ?? 0}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onTopicFilterChange(activeTopicFilter === '_none' ? '' : '_none')}
            className={chipClass(activeTopicFilter === '_none')}
          >
            <span>{t('tasks.project.generalReportMode')}</span>
            <span className="tabular-nums opacity-80">{generalCount}</span>
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-destructive"
        >
          <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {filteredReports.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t('tasks.detail.noTimeline')}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <ReportFeedItem
              key={report.id}
              task={task}
              user={user}
              report={report}
              workItems={workItems}
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
      )}

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
            <AlertDialogAction
              onClick={() => void handleConfirmRemoveAttachment()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
