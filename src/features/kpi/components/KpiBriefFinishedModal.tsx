import { ExternalLink, FileText, MessagesSquare, Paperclip, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTaskReports } from '@/features/tasks/api/queries'
import type { DirectoryUser } from '@/schemas/auth'
import {
  parseAttachments,
  parseLocalDateTime,
  parseReqDepts,
  resolveFileUrl,
} from '@/utils/task-domain'
import {
  isAssigneeBriefReport,
  isSystemBriefReport,
  type BriefCaseRow,
} from '../utils/kpi-brief-domain'
import { formatShortDateTime } from '../utils/kpi-export'
import { KpiBriefStatusBadge } from './KpiBriefStatusBadge'

export interface KpiBriefFinishedModalProps {
  item: BriefCaseRow | null
  directory: readonly DirectoryUser[]
  resolveDeptLabel: (raw: string) => string
  onClose: () => void
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp)$/i

export function KpiBriefFinishedModal({
  item,
  directory,
  resolveDeptLabel,
  onClose,
}: KpiBriefFinishedModalProps) {
  const { t } = useTranslation()
  const taskId = item?.task.id ?? 0
  const reportsQuery = useTaskReports(taskId)

  if (!item) return null

  const { task } = item
  const allReports = reportsQuery.data ?? []
  const assigneeReports = allReports
    .filter((rep) => !isSystemBriefReport(rep) && isAssigneeBriefReport(rep, task, directory))
    .sort((a, b) => {
      const ta = parseLocalDateTime(a.createdAt)?.getTime() ?? 0
      const tb = parseLocalDateTime(b.createdAt)?.getTime() ?? 0
      return ta - tb || a.id - b.id
    })

  const reqDepts = parseReqDepts(task.req_depts, task.req_dept)
    .map(resolveDeptLabel)
    .join(', ')

  const metaItems = [
    { label: t('kpiBrief.cases.assignee'), value: item.names.join(', ') || '-' },
    {
      label: t('kpiBrief.modal.assignedUnit'),
      value: task.assigned_unit ? resolveDeptLabel(task.assigned_unit) : '-',
    },
    { label: t('kpiBrief.cases.reqDept'), value: reqDepts || '-' },
    { label: t('kpiBrief.modal.reporter'), value: task.reporter_name || task.reporter || '-' },
    { label: t('kpiBrief.modal.taskType'), value: task.task_type || '-' },
    { label: t('kpiBrief.cases.progress'), value: `${task.progress}%` },
    {
      label: t('kpi.detail.created'),
      value: formatShortDateTime(parseLocalDateTime(task.createdAt)) || '-',
    },
    { label: t('kpiBrief.cases.planDate'), value: formatShortDateTime(item.plan) || '-' },
    {
      label: t('kpiBrief.cases.finishDate'),
      value: formatShortDateTime(parseLocalDateTime(task.finish_date)) || '-',
    },
    { label: t('kpiBrief.cases.overdueDays'), value: String(item.lateDays ?? 0) },
  ]

  return (
    <ResponsiveModal
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      size="full"
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold tabular-nums text-success">#{task.id}</span>
          <span className="break-words">{task.title}</span>
          <KpiBriefStatusBadge status={item.status} />
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button asChild size="sm">
            <Link to={APP_ROUTES.TASK_DETAIL(task.id)}>
              <ExternalLink className="size-4" aria-hidden="true" />
              {t('kpiBrief.modal.openOriginal')}
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-5">
          {metaItems.map((meta) => (
            <div
              key={meta.label}
              className="rounded-lg border border-border bg-muted/30 p-2.5 min-w-0"
            >
              <p className="text-[11px] text-muted-foreground">{meta.label}</p>
              <p className="mt-0.5 break-words text-xs font-semibold text-foreground">
                {meta.value}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-border bg-card p-4 space-y-1.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Target className="size-4 text-destructive" aria-hidden="true" />
            {t('kpiBrief.modal.precautions')}
          </h3>
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
            {task.precautions?.trim() || t('kpiBrief.modal.emptyContent')}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 space-y-1.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            {t('kpiBrief.modal.content')}
          </h3>
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
            {task.content?.trim() || t('kpiBrief.modal.emptyContent')}
          </p>
        </section>

        <section className="rounded-xl border border-success/30 bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MessagesSquare className="size-4 text-success" aria-hidden="true" />
              {t('kpiBrief.modal.reportsTitle')}
            </h3>
            {!reportsQuery.isLoading && (
              <Badge variant="secondary" className="tabular-nums">
                {t('kpiBrief.modal.reportsCount', {
                  kept: assigneeReports.length,
                  total: allReports.length,
                  filtered: allReports.length - assigneeReports.length,
                })}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('kpiBrief.modal.reportsHint')}</p>

          {reportsQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner size="md" />
            </div>
          ) : reportsQuery.isError ? (
            <p className="text-sm text-destructive">{t('kpiBrief.modal.reportsError')}</p>
          ) : assigneeReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('kpiBrief.modal.reportsEmpty')}</p>
          ) : (
            <div className="space-y-2.5">
              {assigneeReports.map((rep, idx) => {
                const files = parseAttachments(rep.attachments)
                const images = files.filter((f) => IMAGE_EXT_RE.test(f.path) || IMAGE_EXT_RE.test(f.name))
                const docs = files.filter((f) => !IMAGE_EXT_RE.test(f.path) && !IMAGE_EXT_RE.test(f.name))
                return (
                  <div
                    key={rep.id}
                    className="rounded-lg border border-border border-l-4 border-l-success bg-muted/20 p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="secondary" className="tabular-nums">
                        #{idx + 1}
                      </Badge>
                      <span className="font-semibold text-foreground">
                        {rep.fullname || rep.username}
                      </span>
                      <span className="text-muted-foreground">({rep.username})</span>
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        {formatShortDateTime(parseLocalDateTime(rep.createdAt))}
                      </span>
                      {rep.progress != null && (
                        <Badge variant="outline" className="tabular-nums">
                          {rep.progress}%
                        </Badge>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                      {rep.content?.trim() || t('kpiBrief.modal.emptyContent')}
                    </p>
                    {images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {images.map((img) => {
                          const url = resolveFileUrl(img.path)
                          if (!url) return null
                          return (
                            <a key={img.path} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={img.name}
                                className="max-h-36 max-w-56 rounded-md border border-border object-contain"
                              />
                            </a>
                          )
                        })}
                      </div>
                    )}
                    {docs.length > 0 && (
                      <div className="flex flex-wrap gap-3 text-xs">
                        {docs.map((doc) => {
                          const url = resolveFileUrl(doc.path)
                          if (!url) return null
                          return (
                            <a
                              key={doc.path}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <Paperclip className="size-3.5" aria-hidden="true" />
                              {doc.name}
                            </a>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </ResponsiveModal>
  )
}
