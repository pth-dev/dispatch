import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Paperclip, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { SessionUser } from '@/schemas/auth'
import type { RawReport, RawTask } from '@/schemas/task'
import { canDeleteReportAttachment } from '@/utils/permissions'
import { parseAttachments, parseLinks, resolveFileUrl } from '@/utils/task-domain'
import { useDeleteReportAttachment, useUpdateReport } from '../api/queries'

interface ReportFeedProps {
  task: RawTask
  user: SessionUser | null
  reports: RawReport[]
  isLoading: boolean
}

export function ReportFeed({ task, user, reports, isLoading }: ReportFeedProps) {
  const { t } = useTranslation()
  const updateReport = useUpdateReport()
  const deleteAttachment = useDeleteReportAttachment()

  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editingContent, setEditingContent] = React.useState('')

  const startEdit = (report: RawReport) => {
    setEditingId(report.id)
    setEditingContent(report.content ?? '')
  }

  const saveEdit = async (reportId: number) => {
    await updateReport.mutateAsync({
      taskId: task.id,
      reportId,
      content: editingContent.trim(),
    })
    setEditingId(null)
  }

  const handleRemoveAttachment = async (reportId: number, path: string) => {
    await deleteAttachment.mutateAsync({
      taskId: task.id,
      reportId,
      path,
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        {t('common.loading')}
      </div>
    )
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

      <div className="space-y-3">
        {reports.map((report) => {
          const attachments = parseAttachments(report.attachments)
          const links = parseLinks(report.km_link)
          const isAuthor =
            Boolean(user) &&
            report.username.trim().toLowerCase() === user?.username.trim().toLowerCase()
          const canDeleteAtt = canDeleteReportAttachment(user, task, report)
          const isEditing = editingId === report.id

          return (
            <article
              key={report.id}
              className="rounded-lg border border-border bg-card p-3.5 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {report.fullname || report.username}
                  </span>
                  {report.split_assignee && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-primary">
                      {report.split_assignee}
                    </span>
                  )}
                  {typeof report.progress === 'number' && (
                    <span className="font-medium text-primary">{report.progress}%</span>
                  )}
                  {report.pause_action && (
                    <span className="text-warning font-medium">{report.pause_action}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{report.createdAt}</span>
                  {isAuthor && !isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => startEdit(report)}
                      aria-label={t('common.edit')}
                    >
                      <Pencil className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={updateReport.isPending}
                      onClick={() => void saveEdit(report.id)}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                report.content && (
                  <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {report.content}
                  </p>
                )
              )}

              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {links.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span className="truncate max-w-[260px]">{url}</span>
                    </a>
                  ))}
                </div>
              )}

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachments.map((att) => {
                    const href = resolveFileUrl(att.path)
                    return (
                      <div
                        key={att.path}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1"
                      >
                        <Paperclip className="size-3 text-muted-foreground" aria-hidden="true" />
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[200px]"
                        >
                          {att.name}
                        </a>
                        {canDeleteAtt && (
                          <button
                            type="button"
                            onClick={() => void handleRemoveAttachment(report.id, att.path)}
                            className="text-destructive hover:opacity-80 cursor-pointer"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="size-3" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
