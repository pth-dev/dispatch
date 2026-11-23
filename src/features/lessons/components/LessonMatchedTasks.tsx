import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { APP_ROUTES } from '@/constants/app-routes'
import { parseAssigneeList } from '@/utils/task-domain'
import {
  splitHighlightedText,
  type MatchedLessonTask,
} from '../utils/lesson-domain'

const DEFAULT_MAX_ITEMS = 100

type LessonMatchedTasksProps = {
  hits: readonly MatchedLessonTask[]
  maxItems?: number
  emptyMessage?: string
}

function LessonMatchedTaskRow({ hit }: { hit: MatchedLessonTask }) {
  const { t } = useTranslation()
  const { task, matchedKeywords, isCompleted } = hit
  const assignees = parseAssigneeList(task.assign_person)
  const assigneeText =
    assignees.length > 0 ? assignees.join(', ') : t('lessons.matchedTasks.unassigned')
  const segments = splitHighlightedText(task.title, matchedKeywords)

  return (
    <Link
      to={APP_ROUTES.TASK_DETAIL(task.id)}
      className={`flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-3 ${
        isCompleted ? 'border-border' : 'border-warning/35'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
        <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground sm:mt-0">
          #{task.id}
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground sm:line-clamp-none sm:truncate">
            {segments.map((seg, idx) =>
              seg.highlighted ? (
                <mark
                  key={idx}
                  className="rounded bg-warning/15 px-0.5 font-semibold text-warning"
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={idx}>{seg.text}</span>
              ),
            )}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>
              {t('lessons.matchedTasks.assignee')}: {assigneeText}
            </span>
            <span>
              {t('lessons.matchedTasks.reporter')}: {task.reporter || '-'}
            </span>
            <span className="font-medium text-warning">
              {matchedKeywords.join(', ')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pl-8 sm:shrink-0 sm:justify-end sm:pl-0">
        <Badge
          variant="outline"
          className={`shrink-0 text-[11px] ${
            isCompleted
              ? 'border-success/25 bg-success/10 text-success'
              : 'border-primary/25 bg-primary-soft text-primary'
          }`}
        >
          {isCompleted
            ? t('lessons.matchedTasks.completed')
            : t('lessons.matchedTasks.inProgress', { progress: task.progress })}
        </Badge>

        <ExternalLink
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}

export function LessonMatchedTasks({
  hits,
  maxItems = DEFAULT_MAX_ITEMS,
  emptyMessage,
}: LessonMatchedTasksProps) {
  const { t } = useTranslation()

  if (hits.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground">
        {emptyMessage ?? t('lessons.matchedTasks.empty')}
      </p>
    )
  }

  const visible = hits.slice(0, maxItems)

  return (
    <div className="space-y-2">
      {visible.map((hit) => (
        <LessonMatchedTaskRow key={hit.task.id} hit={hit} />
      ))}

      {hits.length > maxItems && (
        <p className="text-center text-xs text-muted-foreground">
          {t('lessons.matchedTasks.truncated', { count: maxItems })}
        </p>
      )}
    </div>
  )
}
