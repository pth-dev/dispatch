import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useAppStore } from '@/app/store'
import { Button } from '@/components/ui/button'
import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import { useLessons } from '@/hooks/use-lessons'
import type { SessionUser } from '@/schemas/auth'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils'
import { buildTaskLessonHitsMap } from '@/utils/lesson-match'
import { useDeptNameResolver } from '../hooks/use-dept-name-resolver'
import { useSiteNameResolver } from '../hooks/use-site-name-resolver'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'
import { mapTaskToCardViewModel, type TaskCardResolvers } from '../utils/task-card-mapper'
import { groupTasksByType, type TaskGroup } from '../utils/task-display'
import { TaskCard } from './TaskCard'

type TaskCardTypeGroupProps = {
  group: TaskGroup
  variant: 'incomplete' | 'completed'
  resolvers: TaskCardResolvers
  currentUser: SessionUser | null
  lessonHitsByTaskId?: ReadonlyMap<number, LessonMarqueeHit[]>
}

function TaskCardTypeGroup({
  group,
  variant,
  resolvers,
  currentUser,
  lessonHitsByTaskId,
}: TaskCardTypeGroupProps) {
  const { t } = useTranslation()
  const isIncomplete = variant === 'incomplete'

  return (
    <div
      className={cn(
        isIncomplete
          ? 'rounded-xl border border-border bg-secondary/35 p-3 space-y-2.5'
          : 'space-y-2 opacity-90',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          isIncomplete ? 'border-l-2 border-primary pl-2.5' : 'border-b border-border pb-1.5',
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

      <div
        data-testid="task-card-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-3"
      >
        {group.tasks.map((task) => {
          const vm = mapTaskToCardViewModel(task, resolvers, undefined, currentUser)
          const hits = lessonHitsByTaskId?.get(task.id)
          return (
            <TaskCard
              key={task.id}
              vm={hits && hits.length > 0 ? { ...vm, lessonHits: hits } : vm}
            />
          )
        })}
      </div>
    </div>
  )
}

type TaskCardSectionProps = {
  variant: 'incomplete' | 'completed'
  tasks: RawTask[]
  limit: number
  onShowMore: () => void
}

export function TaskCardSection({
  variant,
  tasks,
  limit,
  onShowMore,
}: TaskCardSectionProps) {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)
  const { data: lessons = [] } = useLessons()
  const resolveDeptName = useDeptNameResolver()
  const resolveSiteName = useSiteNameResolver()
  const { resolveUser, resolveUserDept, resolveAssignees } = useUserDisplayResolver()
  const [expanded, setExpanded] = React.useState(true)

  const isIncomplete = variant === 'incomplete'
  const title = isIncomplete
    ? t('tasks.card.incompleteSection')
    : t('tasks.card.completedSection')

  const visibleTasks = tasks.slice(0, limit)
  const lessonHitsByTaskId = buildTaskLessonHitsMap(visibleTasks, lessons)
  const groups = groupTasksByType(visibleTasks, tasks, t('tasks.card.uncategorized'))
  const resolvers = {
    resolveDeptName,
    resolveSiteName,
    resolveUser,
    resolveUserDept,
    resolveAssignees,
  }

  return (
    <section className="space-y-2.5" aria-label={title}>
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
        <div className="space-y-3">
          {groups.map((group) => (
            <TaskCardTypeGroup
              key={group.typeLabel}
              group={group}
              variant={variant}
              resolvers={resolvers}
              currentUser={user}
              lessonHitsByTaskId={lessonHitsByTaskId}
            />
          ))}

          {visibleTasks.length < tasks.length && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onShowMore}
                className="h-11 lg:h-10 px-4 text-xs"
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
