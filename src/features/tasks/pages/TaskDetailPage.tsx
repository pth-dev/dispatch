import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Lock,
  Paperclip,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusText } from '@/components/ui/status-text'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  InlineError,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import {
  canCloneTask,
  canDeleteTask,
  canEditTask,
  canSubmitReport,
} from '@/utils/permissions'
import {
  deriveTaskStatus,
  isRecurringTask,
  isTaskPaused,
  isUrgentLevel,
  parseAttachments,
  parseLinks,
  parseRecurInts,
  parseReqDepts,
  parseSites,
  parseSplitMembers,
  parseWorkItems,
  resolveFileUrl,
  sameDept,
} from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import { getDeptDisplayName } from '../api/meta'
import { useDeleteTask, useMetaDepts, useTaskById, useTaskReports } from '../api/queries'
import { formatTaskDueDate } from '../hooks/use-task-columns'
import { SplitGroupPanel } from '../components/SplitGroupPanel'
import { WorkItemsReadOnly } from '../components/WorkItemsReadOnly'
import { ReportComposer } from '../components/ReportComposer'
import { ReportFeed } from '../components/ReportFeed'

export function TaskDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const parsedId = /^\d+$/.test(id) ? Number(id) : 0
  const taskId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : 0
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  const { data: metaDepts } = useMetaDepts()
  const { data: task, isLoading, isError, error, refetch } = useTaskById(taskId)
  const {
    data: reports = [],
    isLoading: reportsLoading,
    isError: reportsError,
    error: reportsErrorObj,
    refetch: refetchReports,
  } = useTaskReports(taskId)
  const deleteTask = useDeleteTask()
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  if (taskId <= 0) {
    throwFullPageError('404')
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-28 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (isError) {
    const errorStatus = toErrorStatus(error)
    if (isFullPageError(errorStatus)) {
      throwFullPageError(errorStatus)
    }
    return <InlineError status={errorStatus} onRetry={() => void refetch()} />
  }

  if (!task) {
    throwFullPageError('404')
  }

  const derivedStatus = deriveTaskStatus(task)
  const paused = isTaskPaused(task)
  const urgent = isUrgentLevel(task.level)
  const attachments = parseAttachments(task.attachments)
  const links = parseLinks(task.km_link)
  const splitMembers = parseSplitMembers(task.split_members)
  const workItems = parseWorkItems(task.work_items)
  const reqDepts = parseReqDepts(task.req_depts, task.req_dept)
  const sites = parseSites(task.site)

  const allowEdit = canEditTask(user, task)
  const allowClone = canCloneTask(user, task)
  const allowDelete = canDeleteTask(user, task)
  const allowReport = canSubmitReport(user, task)

  const handleDelete = async () => {
    setDeleteError(null)
    try {
      await deleteTask.mutateAsync(task.id)
      navigate(APP_ROUTES.TASKS, { replace: true })
    } catch (err) {
      setDeleteError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  const resolveDeptLabel = (rawDept: string | null | undefined): string => {
    if (!rawDept) return '-'
    const catalog = metaDepts?.allDepts ?? metaDepts?.depts ?? []
    const match = catalog.find((d) => sameDept(d.value, rawDept))
    return match ? getDeptDisplayName(match, i18n.language) : rawDept
  }

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

  const infoItems: ReadonlyArray<{ label: string; value: string }> = [
    { label: t('tasks.detail.creator'), value: task.reporter_name || task.reporter || '-' },
    {
      label: t('tasks.fields.reqDepts'),
      value: reqDepts.map((d) => resolveDeptLabel(d)).join(', ') || '-',
    },
    { label: t('tasks.fields.reqContact'), value: task.req_contact || '-' },
    { label: t('common.department'), value: resolveDeptLabel(task.assigned_unit) },
    { label: t('common.assignee'), value: task.assign_person || '-' },
    { label: t('tasks.fields.site'), value: sites.join(', ') || '-' },
    { label: t('tasks.fields.taskType'), value: task.task_type || '-' },
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
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        <Link
          to={APP_ROUTES.TASKS}
          className="flex items-center gap-1 hover:text-foreground font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t('tasks.detail.backToList')}</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-primary">#{task.id}</span>
      </div>

      {/* Header Card */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-primary">
                #{task.id}
              </span>
              <StatusText status={derivedStatus} />
              {paused && <StatusText status="paused" />}
              {urgent && <StatusText status="urgent" />}
              {task.confidential > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                  <Lock className="size-3.5" aria-hidden="true" />
                  <span>{t(`tasks.confidential.lv${task.confidential}`)}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-foreground break-words">
              {task.title}
            </h1>
            {paused && task.pause_reason && (
              <p className="text-xs text-warning">
                {t('tasks.report.pauseReason')}: {task.pause_reason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {allowEdit && (
              <Button asChild variant="outline" size="sm">
                <Link to={APP_ROUTES.TASK_EDIT(task.id)}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                  <span>{t('tasks.detail.edit')}</span>
                </Link>
              </Button>
            )}
            {allowClone && (
              <Button asChild variant="outline" size="sm">
                <Link to={`${APP_ROUTES.TASK_NEW}?clone=${task.id}`}>
                  <Copy className="size-3.5" aria-hidden="true" />
                  <span>{t('tasks.detail.clone')}</span>
                </Link>
              </Button>
            )}
            {allowDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deleteTask.isPending}>
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span>{t('common.delete')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('tasks.detail.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('tasks.detail.deleteConfirmDesc', { id: String(task.id) })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleDelete()}>
                      {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
      </section>

      <SplitGroupPanel currentTaskId={task.id} members={splitMembers} />
      <WorkItemsReadOnly envelope={workItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          {/* Description & Precautions */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3 text-xs">
            <h2 className="text-sm font-semibold text-foreground">
              {t('tasks.detail.description')}
            </h2>
            <p className="whitespace-pre-wrap text-foreground leading-relaxed">
              {task.content || t('tasks.detail.noDescription')}
            </p>
            {task.precautions && (
              <div className="pt-2 border-t border-border space-y-1">
                <h3 className="font-semibold text-muted-foreground">
                  {t('tasks.fields.precautions')}
                </h3>
                <p className="whitespace-pre-wrap text-foreground">{task.precautions}</p>
              </div>
            )}
          </section>

          {allowReport && user && (
            <ReportComposer key={task.id} task={task} user={user} splitMembers={splitMembers} />
          )}

          <ReportFeed
            key={`feed-${task.id}`}
            task={task}
            user={user}
            reports={reports}
            isLoading={reportsLoading}
            isError={reportsError}
            error={reportsErrorObj}
            onRetry={() => void refetchReports()}
          />
        </div>

        {/* Right Column: Progress + Metadata + Attachments */}
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                {t('tasks.detail.progressLabel')}
              </span>
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
                  <dd className="text-right font-medium text-foreground break-words">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 space-y-2.5 text-xs">
            <h2 className="text-sm font-semibold text-foreground">
              {t('tasks.detail.attachments')}
            </h2>
            {attachments.length === 0 ? (
              <p className="text-muted-foreground">{t('tasks.detail.noAttachments')}</p>
            ) : (
              <ul className="space-y-1.5">
                {attachments.map((att) => {
                  const href = resolveFileUrl(att.path)
                  return (
                    <li key={att.path} className="flex items-center gap-1.5">
                      <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
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
      </div>
    </div>
  )
}

export default TaskDetailPage
