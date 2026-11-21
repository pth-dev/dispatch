import { Link } from 'react-router'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  LessonRuleBadge,
  type LessonMarqueeHit,
} from '@/components/ui/lesson-marquee-banner'
import { APP_ROUTES } from '@/constants/app-routes'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import {
  deriveTaskStatus,
  getTaskLevelCode,
  parseSites,
} from '@/utils/task-domain'
import { formatTodoDueDate } from '../utils/todo-domain'

interface TodoTimelineSectionProps {
  tasks: readonly RawTask[]
  lessonHitsByTaskId: ReadonlyMap<number, LessonMarqueeHit[]>
}

function getLastReportText(raw: RawTask['last_report']): string {
  if (typeof raw === 'string') return raw.trim()
  if (raw && typeof raw === 'object' && 'content' in raw) {
    return typeof raw.content === 'string' ? raw.content.trim() : ''
  }
  return ''
}

interface TodoTimelineItemProps {
  task: RawTask
  hits: readonly LessonMarqueeHit[]
}

function TodoTimelineItem({ task, hits }: TodoTimelineItemProps) {
  const { t } = useTranslation()
  const status = deriveTaskStatus(task)
  const isOverdue = status === 'delayed_pending'
  const levelCode = getTaskLevelCode(task.level)
  const sites = parseSites(task.site)
  const dueText = task.due_date
    ? formatTodoDueDate(task.due_date)
    : t('todo.noDueDate')
  const clampedProgress = Math.min(100, Math.max(0, task.progress))

  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className={cn(
          'absolute -left-[31px] top-4 size-3.5 rounded-full border-2 border-card',
          isOverdue
            ? 'bg-destructive'
            : task.due_date
              ? 'bg-primary'
              : 'bg-muted-foreground',
        )}
      />

      <article className="rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/40">
        <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                #{task.id}
              </span>
              <Link
                to={APP_ROUTES.TASK_DETAIL(task.id)}
                className="text-sm font-semibold text-foreground hover:text-primary hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {task.title}
              </Link>
              {hits.length > 0 && <LessonRuleBadge hits={hits} />}
            </div>

            {task.title_vn && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {task.title_vn}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                {sites.length > 0 ? sites.join(', ') : '-'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {levelCode === 'critical'
                  ? t('tasks.filter.levelCritical')
                  : levelCode === 'urgent'
                    ? t('tasks.filter.levelUrgent')
                    : t('tasks.filter.levelNormal')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1.5 md:items-end">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
                isOverdue
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : 'border-border bg-secondary text-foreground',
              )}
            >
              <Clock className="size-3" aria-hidden="true" />
              <span>
                {isOverdue
                  ? t('todo.timeline.overdueLabel')
                  : t('todo.row.due')}
                : {dueText}
              </span>
            </span>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>
                {t('todo.row.progress')}:{' '}
                <strong className="text-primary">{clampedProgress}%</strong>
              </span>
              <div
                role="progressbar"
                aria-valuenow={clampedProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${t('todo.row.progress')}: ${clampedProgress}%`}
                className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary"
              >
                <div
                  className="h-full bg-primary"
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              <span>{t('todo.timeline.precautions')}</span>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
              {task.precautions?.trim() || t('todo.timeline.noPrecautions')}
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary-soft/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              <span>{t('todo.timeline.lastReport')}</span>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
              {getLastReportText(task.last_report) ||
                t('todo.timeline.noLastReport')}
            </p>
          </div>
        </div>
      </article>
    </li>
  )
}

export function TodoTimelineSection({
  tasks,
  lessonHitsByTaskId,
}: TodoTimelineSectionProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="todo-timeline-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"
          aria-hidden="true"
        >
          <CalendarClock className="size-5" />
        </span>
        <div>
          <h2
            id="todo-timeline-heading"
            className="text-base font-semibold text-foreground"
          >
            {t('todo.timeline.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('todo.timeline.subtitle', { count: tasks.length })}
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="size-7 text-success" aria-hidden="true" />
          <p className="font-medium text-foreground">
            {t('todo.timeline.empty')}
          </p>
        </div>
      ) : (
        <ol className="relative ml-2.5 space-y-5 border-l-2 border-border pl-6">
          {tasks.map((task) => (
            <TodoTimelineItem
              key={task.id}
              task={task}
              hits={lessonHitsByTaskId.get(task.id) ?? []}
            />
          ))}
        </ol>
      )}
    </section>
  )
}
