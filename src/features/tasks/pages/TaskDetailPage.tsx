import * as React from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  PageHeader,
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
import { ProjectWorkItemsPanel } from '../components/ProjectWorkItemsPanel'
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
  const [activeTopicFilter, setActiveTopicFilter] = React.useState('')
  const selectTopicRef = React.useRef<((topicId: string) => void) | null>(null)

  const handleQuickReportTopic = (topicId: string) => {
    selectTopicRef.current?.(topicId)
    document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleFilterTopic = (topicId: string) => {
    setActiveTopicFilter(topicId)
    if (topicId) {
      document.getElementById('report-feed')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  if (taskId <= 0) {
    throwFullPageError('404')
  }

  const errorStatus = toErrorStatus(error)
  if (isError && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  if (!isLoading && !isError && !task) {
    throwFullPageError('404')
  }

  const splitMembers = task ? parseSplitMembers(task.split_members) : []
  const workItems = task ? parseWorkItems(task.work_items) : null
  const lessonHits = task ? matchLessonsForTask(task, lessons) : []

  const allowEdit = task ? canEditTask(user, task) : false
  const allowClone = task ? canCloneTask(user, task) : false
  const allowDelete = task ? canDeleteTask(user, task) : false
  const allowReport = task ? canSubmitReport(user, task) : false

  const handleDelete = async () => {
    if (!task) return
    setDeleteError(null)
    try {
      await deleteTask.mutateAsync(task.id)
      navigate(APP_ROUTES.TASKS, { replace: true })
    } catch (err) {
      setDeleteError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  return (
    <PageContainer>
      {task && !isLoading && !isError ? (
        <div className="shrink-0 space-y-3">
          <TaskDetailHeader
            task={task}
            allowEdit={allowEdit}
            allowClone={allowClone}
            allowDelete={allowDelete}
            isDeleting={deleteTask.isPending}
            deleteError={deleteError}
            onConfirmDelete={() => void handleDelete()}
          />
        </div>
      ) : (
        <PageHeader title={t('tasks.detail.title')} />
      )}

      <PageContainerBody className="space-y-4">
        {isLoading ? (
          <div role="status" className="space-y-4 animate-pulse">
            <span className="sr-only">{t('common.loading')}</span>
            <div className="h-4 bg-muted rounded w-48" />
            <div className="h-28 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        ) : isError ? (
          <InlineError status={errorStatus} onRetry={() => void refetch()} />
        ) : task ? (
          <>
            <SplitGroupPanel currentTaskId={task.id} members={splitMembers} />
            <ProjectWorkItemsPanel
              envelope={workItems}
              taskTitle={task.title}
              isTaskFinished={task.progress >= 100}
              reports={reports}
              currentUsername={user?.username}
              canReport={allowReport}
              activeFilterTopicId={activeTopicFilter}
              onReportTopic={handleQuickReportTopic}
              onFilterTopic={handleFilterTopic}
            />

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
                  <ReportComposer
                    key={task.id}
                    task={task}
                    user={user}
                    splitMembers={splitMembers}
                    workItems={workItems}
                    reports={reports}
                    selectTopicRef={selectTopicRef}
                  />
                )}

                <ReportFeed
                  key={`feed-${task.id}`}
                  task={task}
                  user={user}
                  reports={reports}
                  workItems={workItems}
                  activeTopicFilter={activeTopicFilter}
                  onTopicFilterChange={setActiveTopicFilter}
                  isLoading={reportsLoading}
                  isError={reportsError}
                  error={reportsErrorObj}
                  onRetry={() => void refetchReports()}
                />
              </div>

              <TaskDetailSidebar task={task} />
            </div>
          </>
        ) : null}
      </PageContainerBody>
    </PageContainer>
  )
}

export default TaskDetailPage
