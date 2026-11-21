import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils'
import { useDeptNameResolver } from '../hooks/use-dept-name-resolver'
import { groupTasksByType } from '../utils/task-display'
import { TaskCardTypeGroup } from './TaskCardTypeGroup'

type TaskCardSectionProps = {
  variant: 'incomplete' | 'completed'
  tasks: RawTask[]
  limit: number
  showRoleTags: boolean
  onShowMore: () => void
  onSelectTask: (task: RawTask) => void
}

export function TaskCardSection({
  variant,
  tasks,
  limit,
  showRoleTags,
  onShowMore,
  onSelectTask,
}: TaskCardSectionProps) {
  const { t } = useTranslation()
  const resolveDeptName = useDeptNameResolver()
  const [expanded, setExpanded] = React.useState(true)

  const isIncomplete = variant === 'incomplete'
  const title = isIncomplete
    ? t('tasks.card.incompleteSection')
    : t('tasks.card.completedSection')

  const visibleTasks = tasks.slice(0, limit)
  const groups = groupTasksByType(visibleTasks, tasks, t('tasks.card.uncategorized'))

  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="flex items-center">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-2 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
          {isIncomplete ? (
            <Clock className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          )}
          <span
            className={cn(
              'text-sm font-semibold',
              isIncomplete ? 'text-primary' : 'text-success',
            )}
          >
            {title}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
            {tasks.length}
          </span>
        </button>
      </h2>

      {expanded && (
        <div className="space-y-4">
          {groups.map((group) => (
            <TaskCardTypeGroup
              key={group.typeLabel}
              group={group}
              variant={variant}
              showRoleTags={showRoleTags}
              resolveDeptName={resolveDeptName}
              onSelectTask={onSelectTask}
            />
          ))}

          {visibleTasks.length < tasks.length && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onShowMore}
                className="h-9 px-4 text-xs"
              >
                {t('tasks.card.showMore', {
                  shown: visibleTasks.length,
                  total: tasks.length,
                })}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
