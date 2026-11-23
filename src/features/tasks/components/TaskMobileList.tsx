import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { RawTask, TaskStatusFilter } from '@/schemas/task'
import { TaskMobileSection } from './TaskMobileSection'

type TaskMobileListProps = {
  tasks: RawTask[]
  isLoading: boolean
  statusFilter?: TaskStatusFilter
  resetKey: string
  emptyMessage?: string
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5] as const
const INCOMPLETE_BATCH_SIZE = 18
const COMPLETED_BATCH_SIZE = 12

const COMPLETED_ONLY_FILTERS = new Set<TaskStatusFilter>([
  'completed',
  'completed_ontime',
  'late_completed',
])

const INCOMPLETE_ONLY_FILTERS = new Set<TaskStatusFilter>([
  'incomplete',
  'not_started',
  'in_progress',
  'delayed_pending',
  'paused',
])

function TaskMobileRowSkeleton() {
  return (
    <div className="bg-card px-4 py-2.5 animate-pulse space-y-2" aria-hidden="true">
      <div className="flex items-center justify-between gap-2">
        <div className="h-3.5 w-32 rounded bg-secondary" />
        <div className="h-3.5 w-20 rounded bg-secondary" />
      </div>
      <div className="h-4 w-4/5 rounded bg-secondary" />
      <div className="flex items-center justify-between gap-2">
        <div className="h-3.5 w-44 rounded bg-secondary" />
        <div className="h-6 w-16 rounded bg-secondary" />
      </div>
    </div>
  )
}

export function TaskMobileList({
  tasks,
  isLoading,
  statusFilter,
  resetKey,
  emptyMessage,
}: TaskMobileListProps) {
  const { t } = useTranslation()
  const [prevResetKey, setPrevResetKey] = React.useState(resetKey)
  const [incompleteLimit, setIncompleteLimit] = React.useState(INCOMPLETE_BATCH_SIZE)
  const [completedLimit, setCompletedLimit] = React.useState(COMPLETED_BATCH_SIZE)

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey)
    setIncompleteLimit(INCOMPLETE_BATCH_SIZE)
    setCompletedLimit(COMPLETED_BATCH_SIZE)
  }

  if (isLoading) {
    return (
      <div className="divide-y divide-border" role="status" aria-live="polite">
        <span className="sr-only">{t('common.loading')}</span>
        {SKELETON_ROWS.map((index) => (
          <TaskMobileRowSkeleton key={`task_mobile_skel_${index}`} />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-12 text-sm text-muted-foreground">
        {emptyMessage || t('common.empty')}
      </div>
    )
  }

  const incompleteTasks = tasks.filter((task) => task.progress < 100)
  const completedTasks = tasks.filter((task) => task.progress >= 100)

  const showIncomplete =
    (!statusFilter || !COMPLETED_ONLY_FILTERS.has(statusFilter)) && incompleteTasks.length > 0
  const showCompleted =
    (!statusFilter || !INCOMPLETE_ONLY_FILTERS.has(statusFilter)) && completedTasks.length > 0

  return (
    <div data-testid="task-mobile-list" className="flex flex-col">
      {showIncomplete && (
        <TaskMobileSection
          variant="incomplete"
          tasks={incompleteTasks}
          limit={incompleteLimit}
          onShowMore={() => setIncompleteLimit((n) => n + INCOMPLETE_BATCH_SIZE)}
        />
      )}

      {showCompleted && (
        <TaskMobileSection
          variant="completed"
          tasks={completedTasks}
          limit={completedLimit}
          onShowMore={() => setCompletedLimit((n) => n + COMPLETED_BATCH_SIZE)}
        />
      )}
    </div>
  )
}
