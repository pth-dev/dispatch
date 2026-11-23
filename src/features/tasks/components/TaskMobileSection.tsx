import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ChevronDown, ChevronRight, Clock } from 'lucide-react'
import type { LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useLessons } from '@/hooks/use-lessons'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils'
import { buildTaskLessonHitsMap } from '@/utils/lesson-match'
import { useDeptNameResolver } from '../hooks/use-dept-name-resolver'
import { useInfiniteSentinel } from '../hooks/use-infinite-sentinel'
import { useSiteNameResolver } from '../hooks/use-site-name-resolver'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'
import { mapTaskToCardViewModel, type TaskCardResolvers } from '../utils/task-card-mapper'
import { groupTasksByType, type TaskGroup } from '../utils/task-display'
import { TaskMobileRow } from './TaskMobileRow'

type TaskMobileTypeGroupProps = {
  group: TaskGroup
  variant: 'incomplete' | 'completed'
  resolvers: TaskCardResolvers
  lessonHitsByTaskId?: ReadonlyMap<number, LessonMarqueeHit[]>
}

function TaskMobileTypeGroup({
  group,
  variant,
  resolvers,
  lessonHitsByTaskId,
}: TaskMobileTypeGroupProps) {
  const { t } = useTranslation()
  const isIncomplete = variant === 'incomplete'
  const items = group.tasks.map((task) => {
    const vm = mapTaskToCardViewModel(task, resolvers)
    const hits = lessonHitsByTaskId?.get(task.id)
    return hits && hits.length > 0 ? { ...vm, lessonHits: hits } : vm
  })

  return (
    <div className={cn('group mt-2 first:mt-0', !isIncomplete && 'opacity-90')}>
      <div className="flex items-center justify-between gap-2 border-y border-border group-first:border-t-0 bg-secondary px-4 py-2">
        <h3
          className={cn(
            'truncate text-xs font-semibold',
            isIncomplete ? 'border-l-2 border-primary pl-2 text-foreground' : 'text-success',
          )}
        >
          {group.typeLabel}
        </h3>
        <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
          {t('tasks.card.groupCount', { count: group.totalInType })}
        </span>
      </div>

      <div className="divide-y divide-border border-b border-border">
        {items.map((vm) => (
          <TaskMobileRow key={vm.id} vm={vm} />
        ))}
      </div>
    </div>
  )
}

type TaskMobileSectionProps = {
  variant: 'incomplete' | 'completed'
  tasks: RawTask[]
  limit: number
  onShowMore: () => void
}

export function TaskMobileSection({
  variant,
  tasks,
  limit,
  onShowMore,
}: TaskMobileSectionProps) {
  const { t } = useTranslation()
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
  const hasMore = visibleTasks.length < tasks.length
  const sentinelRef = useInfiniteSentinel({
    enabled: expanded && hasMore,
    onLoadMore: onShowMore,
    reobserveKey: visibleTasks.length,
  })
  const lessonHitsByTaskId = buildTaskLessonHitsMap(visibleTasks, lessons)
  const groups = groupTasksByType(visibleTasks, tasks, t('tasks.card.uncategorized'))
  const resolvers: TaskCardResolvers = {
    resolveDeptName,
    resolveSiteName,
    resolveUser,
    resolveUserDept,
    resolveAssignees,
  }

  return (
    <section aria-label={title}>
      <h2 className="border-b border-border bg-card">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
          <span className={cn('text-sm font-semibold', isIncomplete ? 'text-primary' : 'text-success')}>
            {title}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground tabular-nums">
            {tasks.length}
          </span>
        </button>
      </h2>

      {expanded && (
        <div>
          {groups.map((group) => (
            <TaskMobileTypeGroup
              key={group.typeLabel}
              group={group}
              variant={variant}
              resolvers={resolvers}
              lessonHitsByTaskId={lessonHitsByTaskId}
            />
          ))}

          {hasMore && (
            <LoadingSpinner
              ref={sentinelRef}
              size="sm"
              label={t('tasks.mobile.loadingMore')}
              data-testid={`infinite-sentinel-${variant}`}
              className="bg-card px-4 py-3.5"
            />
          )}
        </div>
      )}
    </section>
  )
}
