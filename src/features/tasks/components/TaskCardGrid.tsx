import { useTranslation } from 'react-i18next'
import type { RawTask } from '@/schemas/task'
import { useDeptNameResolver } from '../hooks/use-dept-name-resolver'
import { TaskCard } from './TaskCard'

type TaskCardGridProps = {
  tasks: RawTask[]
  isLoading: boolean
  emptyMessage?: string
  onSelectTask: (task: RawTask) => void
}

const SKELETON_INDICES = [0, 1, 2, 3, 4, 5] as const

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
  emptyMessage,
  onSelectTask,
}: TaskCardGridProps) {
  const { t } = useTranslation()
  const resolveDeptName = useDeptNameResolver()

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

  return (
    <div className="flex-1 min-h-0 overflow-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            deptLabel={resolveDeptName(task.assigned_unit)}
            onSelect={onSelectTask}
          />
        ))}
      </div>
    </div>
  )
}
