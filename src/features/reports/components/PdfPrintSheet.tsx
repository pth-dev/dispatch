import { useTranslation } from 'react-i18next'
import { StatusText } from '@/components/ui/status-text'
import type { RawReport, RawTask } from '@/schemas/task'
import { splitTextWithLinks } from '@/utils/linkify'
import {
  deriveTaskStatus,
  getSafeExternalUrl,
  parseAttachments,
  parseLinks,
  parseReqDepts,
  parseSites,
  parseWorkItems,
  resolveFileUrl,
} from '@/utils/task-domain'

export type PdfPrintEntry = {
  task: RawTask
  reports: RawReport[]
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i
const SAFE_MEDIA_URL_RE = /^(https?:\/\/|\/(?!\/))/i

function isImageAttachment(name: string, path: string): boolean {
  return IMAGE_EXT_RE.test(name) || IMAGE_EXT_RE.test(path)
}

function isSafeMediaUrl(url: string): boolean {
  return SAFE_MEDIA_URL_RE.test(url)
}

function LinkedText({ text }: { text: string }) {
  const segments = splitTextWithLinks(text)
  return (
    <>
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
    </>
  )
}

function PrintAttachmentList({ raw }: { raw: RawTask['attachments'] | RawReport['attachments'] }) {
  const { t } = useTranslation()
  const files = parseAttachments(raw)
  if (files.length === 0) return null

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex flex-wrap gap-2">
        {files.map((file, idx) => {
          const url = resolveFileUrl(file.path)
          if (!url || !isSafeMediaUrl(url)) return null
          if (isImageAttachment(file.name, file.path)) {
            return (
              <img
                key={`${file.path}-${idx}`}
                src={url}
                alt={file.name || t('reports.pdf.attachmentAlt')}
                className="max-h-40 rounded border border-border object-contain"
              />
            )
          }
          return (
            <span
              key={`${file.path}-${idx}`}
              className="rounded border border-border bg-secondary px-2 py-0.5 text-[11px] text-foreground"
            >
              {file.name || file.path}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function PrintTaskArticle({ entry }: { entry: PdfPrintEntry }) {
  const { t } = useTranslation()
  const { task, reports } = entry
  const status = deriveTaskStatus(task)
  const sites = parseSites(task.site).join(', ') || '—'
  const reqDepts = parseReqDepts(task.req_depts, task.req_dept).join(', ') || '—'
  const links = parseLinks(task.km_link)
  const workItems = parseWorkItems(task.work_items)?.items ?? []

  return (
    <article className="break-inside-avoid rounded-lg border border-border p-4 space-y-2.5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          #{task.id} — {task.title}
        </h3>
        {task.title_vn && <p className="text-xs text-muted-foreground">{task.title_vn}</p>}
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-1 rounded border border-border bg-secondary/40 p-2 text-[11px]">
        <div>
          <span className="text-muted-foreground">{t('reports.pdf.fields.site')}: </span>
          <strong className="text-foreground">{sites}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('reports.pdf.fields.taskType')}: </span>
          <strong className="text-foreground">{task.task_type || '—'}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('worklog.progress')}: </span>
          <strong className={task.progress === 100 ? 'text-success' : 'text-primary'}>
            {task.progress}%
          </strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('reports.pdf.fields.reqDept')}: </span>
          <strong className="text-foreground">{reqDepts}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('common.assignee')}: </span>
          <strong className="text-foreground">
            {[task.assigned_unit, task.assign_person].filter(Boolean).join(' · ') || '—'}
          </strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('reports.pdf.fields.riskStatus')}: </span>
          <strong className="text-foreground">{task.risk_status || '—'}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('reports.pdf.fields.level')}: </span>
          <strong className="text-foreground">{task.level || '—'}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('common.createdAt')}: </span>
          <strong className="text-foreground">{task.createdAt || '—'}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">{t('common.dueDate')}: </span>
          <strong className="text-foreground">{task.due_date || '—'}</strong>{' '}
          <StatusText status={status} />
        </div>
        {task.cost_estimate && (
          <div className="col-span-3">
            <span className="text-muted-foreground">{t('reports.pdf.fields.costEstimate')}: </span>
            <strong className="text-foreground">{task.cost_estimate}</strong>
          </div>
        )}
        {workItems.length > 0 && (
          <div className="col-span-3">
            <span className="text-muted-foreground">{t('reports.pdf.fields.workItems')}: </span>
            <strong className="text-foreground">
              {workItems.map((w) => w.topic).filter(Boolean).join(' · ')}
            </strong>
          </div>
        )}
      </div>

      {links.length > 0 && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {links.map((rawUrl, idx) => {
            const safe = getSafeExternalUrl(rawUrl)
            return safe ? (
              <a
                key={idx}
                href={safe}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline break-all"
              >
                {rawUrl}
              </a>
            ) : null
          })}
        </div>
      )}

      {task.precautions && (
        <div className="rounded border border-destructive/40 bg-card p-2 text-xs">
          <div className="font-semibold text-destructive">
            {t('reports.pdf.fields.precautions')}
          </div>
          <p className="whitespace-pre-wrap text-foreground">
            <LinkedText text={task.precautions} />
          </p>
        </div>
      )}

      {task.content && (
        <div className="text-xs">
          <div className="font-semibold text-foreground">{t('reports.pdf.fields.content')}</div>
          <p className="whitespace-pre-wrap text-foreground">
            <LinkedText text={task.content} />
          </p>
        </div>
      )}

      <PrintAttachmentList raw={task.attachments} />

      <div className="space-y-1.5 border-t border-border pt-2">
        <div className="text-xs font-semibold text-foreground">
          {t('reports.pdf.historyTitle')} ({reports.length})
        </div>
        {reports.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('reports.pdf.noHistory')}</p>
        ) : (
          reports.map((rep) => {
            const repLinks = parseLinks(rep.km_link)
            return (
              <div
                key={rep.id}
                className="rounded border border-border bg-secondary/20 p-2 text-xs space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <strong className="text-foreground">
                    {rep.fullname || rep.username} · {rep.progress}%
                  </strong>
                  <span>{rep.createdAt}</span>
                </div>
                <p className="whitespace-pre-wrap text-foreground">
                  <LinkedText text={rep.content || ''} />
                </p>
                {repLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {repLinks.map((u, i) => {
                      const safe = getSafeExternalUrl(u)
                      return safe ? (
                        <a
                          key={i}
                          href={safe}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline break-all"
                        >
                          {u}
                        </a>
                      ) : null
                    })}
                  </div>
                )}
                <PrintAttachmentList raw={rep.attachments} />
              </div>
            )
          })
        )}
      </div>
    </article>
  )
}

export function PdfPrintSheet({
  entries,
  author,
  rangeLabel,
}: {
  entries: readonly PdfPrintEntry[]
  author: string
  rangeLabel: string
}) {
  const { t } = useTranslation()
  if (entries.length === 0) return null

  return (
    <div className="hidden print:block space-y-4">
      <header className="border-b-2 border-foreground pb-2 text-center space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t('reports.pdf.printTitle')}</h2>
        <div className="text-xs text-muted-foreground">
          {rangeLabel} · {author} · {entries.length} {t('nav.tasks')} ·{' '}
          {new Date().toLocaleString()}
        </div>
      </header>
      {entries.map((entry) => (
        <PrintTaskArticle key={entry.task.id} entry={entry} />
      ))}
    </div>
  )
}
