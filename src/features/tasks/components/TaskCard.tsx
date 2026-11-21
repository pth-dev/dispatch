import { useTranslation } from 'react-i18next'
import { CalendarDays, FolderKanban, Lock, Repeat, User } from 'lucide-react'
import { StatusText } from '@/components/ui/status-text'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils'
import {
  deriveTaskStatus,
  getTaskLevelCode,
  isRecurringTask,
  isTaskPaused,
  parseSites,
} from '@/utils/task-domain'
import { formatTaskDueDate, getWorkItemsSummary } from '../utils/task-display'

type TaskCardBadgesProps = {
  task: RawTask
}

function TaskCardBadges({ task }: TaskCardBadgesProps) {
  const { t } = useTranslation()
  const levelCode = getTaskLevelCode(task.level)
  const recurring = isRecurringTask(task)
  const workItems = getWorkItemsSummary(task)

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-semibold text-primary">#{task.id}</span>
      {levelCode !== 'normal' && (
        <span
          className={cn(
            'text-xs font-semibold',
            levelCode === 'critical' ? 'text-status-urgent' : 'text-warning',
          )}
        >
          {levelCode === 'critical'
            ? t('tasks.filter.levelCritical')
            : t('tasks.filter.levelUrgent')}
        </span>
      )}
      {task.confidential > 0 && (
        <span className="inline-flex items-center" title={t('tasks.confidential.label')}>
          <Lock className="size-3.5 text-warning" aria-hidden="true" />
          <span className="sr-only">{t('tasks.confidential.label')}</span>
        </span>
      )}
      {recurring && (
        <span className="inline-flex items-center" title={t('tasks.filter.flagRecurring')}>
          <Repeat className="size-3.5 text-primary" aria-hidden="true" />
          <span className="sr-only">{t('tasks.filter.flagRecurring')}</span>
        </span>
      )}
      {workItems && (
        <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          <FolderKanban className="size-3" aria-hidden="true" />
          {t('tasks.card.workItemsCount', { count: workItems.count })}
        </span>
      )}
    </div>
  )
}

type TaskCardProps = {
  task: RawTask
  deptLabel: string
  onSelect: (task: RawTask) => void
}

export function TaskCard({ task, deptLabel, onSelect }: TaskCardProps) {
  const derived = deriveTaskStatus(task)
  const paused = isTaskPaused(task)
  const sites = parseSites(task.site)
  const reporterLabel = task.reporter_name?.trim() || task.reporter || '-'
  const progress = Math.min(100, Math.max(0, task.progress))

  return (
    <article className="relative flex h-full flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring">
      <div className="flex items-start justify-between gap-2">
        <TaskCardBadges task={task} />
        <StatusText status={paused ? 'paused' : derived} className="shrink-0 text-xs" />
      </div>

      <div className="space-y-1 min-w-0">
        {task.task_type && (
          <p className="truncate text-xs text-muted-foreground">{task.task_type}</p>
        )}
        <h3>
          <button
            type="button"
            onClick={() => onSelect(task)}
            className="text-left text-sm font-semibold text-foreground line-clamp-2 leading-snug after:absolute after:inset-0 focus:outline-none cursor-pointer"
          >
            {task.title}
          </button>
        </h3>
        {task.title_vn && task.title_vn !== task.title && (
          <p className="text-xs text-muted-foreground line-clamp-1">{task.title_vn}</p>
        )}
      </div>

      <div className="mt-auto space-y-2 pt-2 border-t border-border text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 truncate max-w-full">
            <User className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate text-foreground font-medium">
              {task.assign_person || '-'}
            </span>
          </span>
          <span className="truncate">{deptLabel}</span>
          {sites.length > 0 && <span className="truncate">{sites.join(', ')}</span>}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
            <span>{formatTaskDueDate(task.due_date)}</span>
          </span>
          <span className="truncate">{reporterLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progress >= 100 ? 'bg-success' : 'bg-primary',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground tabular-nums">{progress}%</span>
        </div>
      </div>
    </article>
  )
}
