import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { RawTask } from '@/schemas/task'
import { useDeptNameResolver } from '../hooks/use-dept-name-resolver'
import { useSiteNameResolver } from '../hooks/use-site-name-resolver'
import { mapTaskToCardViewModel } from '../utils/task-card-mapper'
import { TaskCard } from './TaskCard'
import { TaskCardSkeleton } from './TaskCardSkeleton'

type TaskCardGridProps = {
  tasks: RawTask[]
  isLoading: boolean
  resetKey: string
  emptyMessage?: string
  renderCard?: (task: RawTask) => React.ReactNode
}

const SKELETON_INDICES = [0, 1, 2, 3, 4, 5] as const
const CARD_BATCH_SIZE = 24

export function TaskCardGrid({
  tasks,
  isLoading,
  resetKey,
  emptyMessage,
  renderCard,
}: TaskCardGridProps) {
  const { t } = useTranslation()
  const resolveDeptName = useDeptNameResolver()
  const resolveSiteName = useSiteNameResolver()
  const [prevResetKey, setPrevResetKey] = React.useState(resetKey)
  const [limit, setLimit] = React.useState(CARD_BATCH_SIZE)

  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey)
    setLimit(CARD_BATCH_SIZE)
  }

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 overflow-auto p-4" role="status" aria-live="polite">
        <span className="sr-only">{t('common.loading')}</span>
        <div className="grid grid-cols-task-cards auto-rows-fr gap-4">
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

  const visibleTasks = tasks.slice(0, limit)

  return (
    <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
      <div data-testid="task-card-grid" className="grid grid-cols-task-cards auto-rows-fr gap-4">
        {visibleTasks.map((task) =>
          renderCard ? (
            <React.Fragment key={task.id}>{renderCard(task)}</React.Fragment>
          ) : (
            <TaskCard
              key={task.id}
              vm={mapTaskToCardViewModel(task, { resolveDeptName, resolveSiteName })}
            />
          ),
        )}
      </div>

      {visibleTasks.length < tasks.length && (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLimit((n) => n + CARD_BATCH_SIZE)}
            className="h-11 lg:h-10 px-4 text-xs"
          >
            {t('tasks.card.showMore', { shown: visibleTasks.length, total: tasks.length })}
          </Button>
        </div>
      )}
    </div>
  )
}
