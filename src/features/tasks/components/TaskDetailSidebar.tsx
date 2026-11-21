import { useTranslation } from 'react-i18next'
import { ExternalLink, Paperclip } from 'lucide-react'
import type { RawTask } from '@/schemas/task'
import {
  isRecurringTask,
  parseAttachments,
  parseLinks,
  parseRecurInts,
  parseReqDepts,
  parseSites,
  resolveFileUrl,
} from '@/utils/task-domain'
import { formatBilingualOption } from '../api/task-catalog'
import { useDeptNameResolver } from '../hooks/use-dept-name-resolver'
import { useSiteNameResolver } from '../hooks/use-site-name-resolver'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'
import { formatTaskDueDate } from '../utils/task-display'

interface TaskDetailSidebarProps {
  task: RawTask
}

export function TaskDetailSidebar({ task }: TaskDetailSidebarProps) {
  const { t, i18n } = useTranslation()
  const resolveDept = useDeptNameResolver()
  const resolveSite = useSiteNameResolver()
  const { resolveUser, resolveAssignees } = useUserDisplayResolver()

  const attachments = parseAttachments(task.attachments)
  const links = parseLinks(task.km_link)
  const reqDepts = parseReqDepts(task.req_depts, task.req_dept)
  const sites = parseSites(task.site)

  const recurrenceSummary = (() => {
    if (!isRecurringTask(task)) return null
    const base =
      task.recur_type === 'weekly'
        ? t('tasks.fields.recurWeekly')
        : t('tasks.fields.recurMonthly')
    const days =
      task.recur_type === 'weekly'
        ? parseRecurInts(task.recur_weekdays, 1, 7)
            .map((d) => t(`tasks.weekdays.d${d}`))
            .join(', ')
        : parseRecurInts(task.recur_monthdays, 1, 31).join(', ')
    const parts = [base, days, task.recur_time].filter(Boolean)
    if (task.recur_end) parts.push(`→ ${task.recur_end.slice(0, 10)}`)
    return parts.join(' • ')
  })()

  const levelDisplay = task.level ? formatBilingualOption(task.level, i18n.language) : ''
  const riskDisplay = task.risk_status ? formatBilingualOption(task.risk_status, i18n.language) : ''
  const taskTypeDisplay = task.task_type
    ? formatBilingualOption(task.task_type, i18n.language)
    : '-'

  const infoItems: ReadonlyArray<{ label: string; value: string }> = [
    {
      label: t('tasks.detail.creator'),
      value: resolveUser(task.reporter, task.reporter_name) || '-',
    },
    {
      label: t('tasks.fields.reqDepts'),
      value: reqDepts.map((d) => resolveDept(d)).join(', ') || '-',
    },
    {
      label: t('tasks.fields.reqContact'),
      value: resolveUser(task.req_contact) || '-',
    },
    {
      label: t('common.department'),
      value: resolveDept(task.assigned_unit),
    },
    {
      label: t('common.assignee'),
      value: resolveAssignees(task.assign_person) || '-',
    },
    {
      label: t('tasks.fields.site'),
      value: sites.map((s) => resolveSite(s)).join(', ') || '-',
    },
    {
      label: t('tasks.fields.taskType'),
      value: taskTypeDisplay,
    },
    ...(levelDisplay ? [{ label: t('tasks.columns.level'), value: levelDisplay }] : []),
    ...(riskDisplay ? [{ label: t('tasks.fields.riskStatus'), value: riskDisplay }] : []),
    ...(recurrenceSummary
      ? [{ label: t('tasks.fields.recurType'), value: recurrenceSummary }]
      : []),
    {
      label: t('tasks.confidential.label'),
      value: t(`tasks.confidential.lv${task.confidential}`),
    },
    { label: t('common.dueDate'), value: formatTaskDueDate(task.due_date) },
    { label: t('common.createdAt'), value: task.createdAt || '-' },
  ]

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">{t('tasks.detail.progressLabel')}</span>
          <span className="font-semibold text-primary">{task.progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">{t('tasks.detail.info')}</h2>
        <dl className="space-y-2 text-xs">
          {infoItems.map((item) => (
            <div key={item.label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground shrink-0">{item.label}</dt>
              <dd className="text-right font-medium text-foreground break-words">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-2.5 text-xs">
        <h2 className="text-sm font-semibold text-foreground">{t('tasks.detail.attachments')}</h2>
        {attachments.length === 0 ? (
          <p className="text-muted-foreground">{t('tasks.detail.noAttachments')}</p>
        ) : (
          <ul className="space-y-1.5">
            {attachments.map((att) => {
              const href = resolveFileUrl(att.path)
              return (
                <li key={att.path} className="flex items-center gap-1.5">
                  <Paperclip
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {att.name}
                    </a>
                  ) : (
                    <span className="text-muted-foreground truncate">{att.name}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {links.length > 0 && (
          <div className="pt-2 border-t border-border space-y-1.5">
            <h3 className="font-semibold text-muted-foreground">{t('tasks.report.kmLink')}</h3>
            {links.map((url, idx) => (
              <a
                key={`${url}-${idx}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline truncate"
              >
                <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
