import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { RawTask, TaskStatusFilter } from '@/schemas/task'
import { TaskCardSection } from './TaskCardSection'

type TaskCardGridProps = {
  tasks: RawTask[]
  isLoading: boolean
  statusFilter?: TaskStatusFilter
  showRoleTags: boolean
  resetKey: string
  emptyMessage?: string
  onSelectTask: (task: RawTask) => void
}

const SKELETON_INDICES = [0, 1, 2, 3, 4, 5] as const
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

function TaskCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
      <div className="h-5 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-1.5 w-full rounded-full bg-muted" />
    </div>
  )
}

export function TaskCardGrid({
  tasks,
  isLoading,
  statusFilter,
  showRoleTags,
  resetKey,
  emptyMessage,
  onSelectTask,
}: TaskCardGridProps) {
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
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {SKELETON_INDICES.map((index) => (
            <TaskCardSkeleton key={`task_card_skel_${index}`} />
          ))}
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
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
    <div className="flex-1 min-h-0 overflow-auto p-4 space-y-6">
      {showIncomplete && (
        <TaskCardSection
          variant="incomplete"
          tasks={incompleteTasks}
          limit={incompleteLimit}
          showRoleTags={showRoleTags}
          onShowMore={() => setIncompleteLimit((n) => n + INCOMPLETE_BATCH_SIZE)}
          onSelectTask={onSelectTask}
        />
      )}

      {showCompleted && (
        <TaskCardSection
          variant="completed"
          tasks={completedTasks}
          limit={completedLimit}
          showRoleTags={showRoleTags}
          onShowMore={() => setCompletedLimit((n) => n + COMPLETED_BATCH_SIZE)}
          onSelectTask={onSelectTask}
        />
      )}
    </div>
  )
}
