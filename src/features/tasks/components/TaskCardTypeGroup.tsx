import { useTranslation } from 'react-i18next'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils'
import type { TaskGroup } from '../utils/task-display'
import { TaskCard } from './TaskCard'

type TaskCardTypeGroupProps = {
  group: TaskGroup
  variant: 'incomplete' | 'completed'
  showRoleTags: boolean
  resolveDeptName: (rawDept: string | null | undefined) => string
  onSelectTask: (task: RawTask) => void
}

export function TaskCardTypeGroup({
  group,
  variant,
  showRoleTags,
  resolveDeptName,
  onSelectTask,
}: TaskCardTypeGroupProps) {
  const { t } = useTranslation()
  const isIncomplete = variant === 'incomplete'

  return (
    <div
      className={cn(
        isIncomplete
          ? 'rounded-xl border border-border bg-secondary/35 p-3.5 space-y-3'
          : 'space-y-2.5 opacity-90',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          isIncomplete
            ? 'border-l-2 border-primary pl-2.5'
            : 'border-b border-border pb-1.5',
        )}
      >
        <h3
          className={cn(
            'text-sm font-semibold truncate',
            isIncomplete ? 'text-foreground' : 'text-success',
          )}
        >
          {group.typeLabel}
        </h3>
        <span className="shrink-0 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {t('tasks.card.groupCount', { count: group.totalInType })}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {group.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            resolveDeptName={resolveDeptName}
            showRoleTags={showRoleTags}
            onSelect={onSelectTask}
          />
        ))}
      </div>
    </div>
  )
}
