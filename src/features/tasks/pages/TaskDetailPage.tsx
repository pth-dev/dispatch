import * as React from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  InlineError,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { LessonMarqueeBanner } from '@/components/ui/lesson-marquee-banner'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import { useLessons } from '@/hooks/use-lessons'
import { matchLessonsForTask } from '@/utils/lesson-match'
import {
  canCloneTask,
  canDeleteTask,
  canEditTask,
  canSubmitReport,
} from '@/utils/permissions'
import { parseSplitMembers, parseWorkItems } from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import { useDeleteTask, useMetaDepts, useTaskById, useTaskReports } from '../api/queries'
import { SplitGroupPanel } from '../components/SplitGroupPanel'
import { WorkItemsReadOnly } from '../components/WorkItemsReadOnly'
import { ReportComposer } from '../components/ReportComposer'
import { ReportFeed } from '../components/ReportFeed'
import { TaskDetailHeader } from '../components/TaskDetailHeader'
import { TaskDetailSidebar } from '../components/TaskDetailSidebar'

export function TaskDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const parsedId = /^\d+$/.test(id) ? Number(id) : 0
  const taskId = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : 0
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  useMetaDepts()
  const { data: lessons = [] } = useLessons()
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

  const splitMembers = parseSplitMembers(task.split_members)
  const workItems = parseWorkItems(task.work_items)
  const lessonHits = matchLessonsForTask(task, lessons)

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

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <TaskDetailHeader
        task={task}
        allowEdit={allowEdit}
        allowClone={allowClone}
        allowDelete={allowDelete}
        isDeleting={deleteTask.isPending}
        deleteError={deleteError}
        onConfirmDelete={() => void handleDelete()}
      />

      <SplitGroupPanel currentTaskId={task.id} members={splitMembers} />
      <WorkItemsReadOnly envelope={workItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <LessonMarqueeBanner hits={lessonHits} interactive />
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

        <TaskDetailSidebar task={task} />
      </div>
    </div>
  )
}

export default TaskDetailPage
