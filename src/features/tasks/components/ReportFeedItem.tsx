import { CheckCircle2, ExternalLink, Paperclip, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { SessionUser } from '@/schemas/auth'
import type { RawReport, RawTask, WorkItemsEnvelope } from '@/schemas/task'
import { canDeleteReportAttachment } from '@/utils/permissions'
import { parseAttachments, parseLinks, resolveFileUrl } from '@/utils/task-domain'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'
import { parseReportWorkTopics } from '../utils/work-items-domain'

type ReportFeedItemProps = {
  task: RawTask
  user: SessionUser | null
  report: RawReport
  workItems?: WorkItemsEnvelope | null
  isEditing: boolean
  editingContent: string
  isSavingEdit: boolean
  isDeletingAtt: boolean
  onStartEdit: (report: RawReport) => void
  onCancelEdit: () => void
  onEditingContentChange: (value: string) => void
  onSaveEdit: (reportId: number) => void
  onRequestDeleteAttachment: (reportId: number, path: string) => void
}

export function ReportFeedItem({
  task,
  user,
  report,
  workItems = null,
  isEditing,
  editingContent,
  isSavingEdit,
  isDeletingAtt,
  onStartEdit,
  onCancelEdit,
  onEditingContentChange,
  onSaveEdit,
  onRequestDeleteAttachment,
}: ReportFeedItemProps) {
  const { t } = useTranslation()
  const { resolveUser, resolveAssignees } = useUserDisplayResolver()
  const attachments = parseAttachments(report.attachments)
  const links = parseLinks(report.km_link)
  const reportTopics = parseReportWorkTopics(report)
  const isAuthor =
    Boolean(user) &&
    report.username.trim().toLowerCase() === user?.username.trim().toLowerCase()
  const canDeleteAtt = canDeleteReportAttachment(user, task, report)

  return (
    <article className="rounded-lg border border-border bg-card p-3.5 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">
            {resolveUser(report.username, report.fullname)}
          </span>
          {report.split_assignee && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-primary">
              {resolveAssignees(report.split_assignee)}
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
              className="size-9 lg:size-7"
              onClick={() => onStartEdit(report)}
              aria-label={t('common.edit')}
            >
              <Pencil className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {reportTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reportTopics.map((entry) => {
            const idx = workItems?.items.findIndex((it) => it.id === entry.id) ?? -1
            const matchedItem = idx >= 0 ? workItems?.items[idx] : undefined
            const label = matchedItem ? `${idx + 1}. ${matchedItem.topic}` : entry.topic || entry.id
            return (
              <span
                key={entry.id}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                <span className="truncate max-w-[200px]">{label}</span>
                {entry.progress !== null && entry.progress !== undefined && (
                  <span className="font-semibold tabular-nums">{entry.progress}%</span>
                )}
                {entry.early && (
                  <CheckCircle2 className="size-3 text-success shrink-0" aria-hidden="true" />
                )}
              </span>
            )
          })}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            rows={3}
            aria-label={t('tasks.report.contentLabel')}
            value={editingContent}
            onChange={(e) => onEditingContentChange(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSavingEdit || editingContent.trim().length === 0}
              onClick={() => onSaveEdit(report.id)}
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
          {links.map((url, idx) => (
            <a
              key={`${url}-${idx}`}
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
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[200px]"
                  >
                    {att.name}
                  </a>
                ) : (
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {att.name}
                  </span>
                )}
                {canDeleteAtt && (
                  <button
                    type="button"
                    disabled={isDeletingAtt}
                    onClick={() => onRequestDeleteAttachment(report.id, att.path)}
                    className="inline-flex min-h-9 min-w-9 lg:min-h-7 lg:min-w-7 items-center justify-center rounded text-destructive hover:opacity-80 disabled:opacity-40 cursor-pointer"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
