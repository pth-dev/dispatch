import * as React from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface TodoTaskRowProps {
  task: RawTask
  variant: 'available' | 'selected'
  canWrite: boolean
  startTime?: string
  index?: number
  totalCount?: number
  lessonHits?: readonly LessonMarqueeHit[]
  onAdd?: (taskId: number) => void
  onRemove?: (taskId: number) => void
  onReorder?: (taskId: number, delta: -1 | 1) => void
  onStartTimeChange?: (taskId: number, startTime: string) => void
  onDragStartTask?: (taskId: number) => void
  onDragEndTask?: () => void
}

export function TodoTaskRow({
  task,
  variant,
  canWrite,
  startTime = '',
  index = 0,
  totalCount = 0,
  lessonHits = [],
  onAdd,
  onRemove,
  onReorder,
  onStartTimeChange,
  onDragStartTask,
  onDragEndTask,
}: TodoTaskRowProps) {
  const { t } = useTranslation()
  const status = deriveTaskStatus(task)
  const isOverdue = status === 'delayed_pending'
  const levelCode = getTaskLevelCode(task.level)
  const sites = parseSites(task.site)
  const dueText = task.due_date
    ? formatTodoDueDate(task.due_date)
    : t('todo.noDueDate')

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canWrite) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(task.id))
    onDragStartTask?.(task.id)
  }

  return (
    <div
      draggable={canWrite}
      onDragStart={handleDragStart}
      onDragEnd={onDragEndTask}
      className={cn(
        'group rounded-xl border border-border bg-card p-3 transition-colors',
        canWrite && 'cursor-grab hover:border-primary/40 active:cursor-grabbing',
      )}
    >
      <div className="flex items-start gap-2.5">
        {canWrite && (
          <GripVertical
            className="mt-0.5 size-4 shrink-0 text-muted-foreground/60"
            aria-hidden="true"
          />
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              #{task.id}
            </span>
            <Link
              to={APP_ROUTES.TASK_DETAIL(task.id)}
              className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-primary hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={task.title}
            >
              {task.title}
            </Link>
            {lessonHits.length > 0 && <LessonRuleBadge hits={lessonHits} />}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t('todo.row.progress')}:{' '}
              <span className="font-semibold text-primary">
                {task.progress}%
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isOverdue ? t('todo.timeline.overdueLabel') : t('todo.row.due')}:{' '}
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-medium',
                  isOverdue ? 'text-destructive' : 'text-foreground',
                )}
              >
                {isOverdue && (
                  <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
                )}
                {dueText}
              </span>
            </span>
            {sites.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{sites.join(', ')}</span>
              </>
            )}
            {levelCode !== 'normal' && (
              <Badge
                variant="outline"
                className={cn(
                  'h-5 px-1.5 text-[10px]',
                  levelCode === 'critical'
                    ? 'border-destructive/30 bg-destructive/5 text-destructive'
                    : 'border-warning/30 bg-warning/5 text-warning',
                )}
              >
                {levelCode === 'critical'
                  ? t('tasks.filter.levelCritical')
                  : t('tasks.filter.levelUrgent')}
              </Badge>
            )}
          </div>

          {variant === 'selected' && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
              <label
                htmlFor={`todo-time-${task.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
              >
                <Clock className="size-3.5 text-primary" aria-hidden="true" />
                <span>{t('todo.row.startTime')}</span>
              </label>
              <Input
                id={`todo-time-${task.id}`}
                type="time"
                value={startTime}
                disabled={!canWrite}
                onChange={(e) => onStartTimeChange?.(task.id, e.target.value)}
                className="h-8 w-auto px-2 text-xs font-medium lg:h-8"
              />
              {!startTime && (
                <span className="text-[11px] font-medium text-destructive">
                  {t('todo.timeUnset')}
                </span>
              )}
            </div>
          )}
        </div>

        {canWrite && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {variant === 'selected' ? (
              <>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index <= 0}
                    onClick={() => onReorder?.(task.id, -1)}
                    aria-label={t('todo.actions.moveUp')}
                    title={t('todo.actions.moveUp')}
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={index >= totalCount - 1}
                    onClick={() => onReorder?.(task.id, 1)}
                    aria-label={t('todo.actions.moveDown')}
                    title={t('todo.actions.moveDown')}
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => onRemove?.(task.id)}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  <span>{t('todo.actions.remove')}</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAdd?.(task.id)}
                className="border-primary/30 text-primary hover:bg-primary-soft hover:text-primary"
              >
                <Plus className="size-3.5" />
                <span>{t('todo.actions.add')}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
