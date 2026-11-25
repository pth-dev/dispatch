import { CalendarDays, Clock, Paperclip, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import type { WorkRecord } from '@/schemas/worklog'
import { splitTextWithLinks } from '@/utils/linkify'
import { resolveFileUrl } from '@/utils/task-domain'
import type { WorklogDayBucket } from '../utils/worklog-domain'

function WorklogRecordCard({ record }: { record: WorkRecord }) {
  const { t } = useTranslation()
  const timePart = record.createdAt.split(/[ T]/)[1]?.slice(0, 8) ?? ''
  const segments = splitTextWithLinks(record.content)

  return (
    <article className="rounded-lg border border-border bg-card p-4 space-y-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <Link
            to={APP_ROUTES.TASK_DETAIL(record.task_id)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t('worklog.taskBadge', { id: record.task_id })}
          </Link>
          <h4 className="text-sm font-semibold text-foreground break-words">
            <Link to={APP_ROUTES.TASK_DETAIL(record.task_id)} className="hover:text-primary">
              {record.title || `#${record.task_id}`}
            </Link>
          </h4>
          {record.title_vn && (
            <p className="text-xs text-muted-foreground line-clamp-2">{record.title_vn}</p>
          )}
        </div>

        {timePart && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            <Clock className="size-3" aria-hidden="true" />
            <span>{timePart}</span>
          </span>
        )}
      </div>

      <p className="whitespace-pre-wrap break-words border-t border-border pt-2.5 text-sm text-foreground">
        {segments.map((seg, idx) =>
          seg.type === 'link' ? (
            <a
              key={idx}
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline break-all"
            >
              {seg.value}
            </a>
          ) : (
            <span key={idx}>{seg.value}</span>
          ),
        )}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <User className="size-3.5" aria-hidden="true" />
          <span>
            {t('worklog.reporter')}:{' '}
            <strong className="font-medium text-foreground">
              {record.fullname || record.username}
            </strong>
          </span>
        </span>
        <span>
          {t('worklog.progress')}:{' '}
          <strong className="font-semibold text-primary">{record.progress}%</strong>
        </span>
      </div>

      {record.attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2 text-xs">
          <Paperclip className="size-3.5 text-muted-foreground" aria-hidden="true" />
          {record.attachments.map((file, idx) => {
            const safeHref = resolveFileUrl(file.path)
            const isSafe =
              safeHref.startsWith('/') && !safeHref.startsWith('//')
                ? true
                : safeHref.startsWith('http://') || safeHref.startsWith('https://')
            if (!isSafe) {
              return (
                <span
                  key={`${file.path}-${idx}`}
                  className="rounded border border-border bg-secondary px-2 py-0.5 text-muted-foreground"
                >
                  {file.name || file.path}
                </span>
              )
            }
            return (
              <a
                key={`${file.path}-${idx}`}
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-border bg-secondary px-2 py-0.5 text-primary hover:underline"
              >
                {file.name || file.path}
              </a>
            )
          })}
        </div>
      )}
    </article>
  )
}

export function WorklogDayGroup({ bucket }: { bucket: WorklogDayBucket }) {
  const { t } = useTranslation()
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          <span>{bucket.date}</span>
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          {t('worklog.dayCount', { count: bucket.records.length })}
        </span>
      </div>
      <div className="space-y-3 p-4">
        {bucket.records.map((record, idx) => (
          <WorklogRecordCard key={`${record.id}-${record.task_id}-${idx}`} record={record} />
        ))}
      </div>
    </section>
  )
}
