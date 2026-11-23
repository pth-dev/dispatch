import type * as React from 'react'
import { Link } from 'react-router'
import { Eye, Lock } from 'lucide-react'
import { LessonRuleBadge, type LessonMarqueeHit } from '@/components/ui/lesson-marquee-banner'
import { StatusText } from '@/components/ui/status-text'
import { Button } from '@/components/ui/button'
import type { RawTask } from '@/schemas/task'
import { APP_ROUTES } from '@/constants/app-routes'
import {
  deriveTaskStatus,
  getTaskLevelCode,
  isTaskPaused,
  isUrgentLevel,
} from '@/utils/task-domain'
import {
  getWorkItemsSummary,
  parseLastReportSummary,
} from '../utils/task-display'

export function TaskTitleCell({
  task,
  lessonHits,
  urgentLabel,
  confidentialLabel,
}: {
  task: RawTask
  lessonHits: LessonMarqueeHit[]
  urgentLabel: string
  confidentialLabel: string
}): React.ReactElement {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {isUrgentLevel(task.level) && (
        <span className="inline-flex shrink-0 items-center" title={urgentLabel}>
          <span className="size-1.5 rounded-full bg-status-urgent" aria-hidden="true" />
          <span className="sr-only">{urgentLabel}</span>
        </span>
      )}
      {task.confidential > 0 && (
        <span className="inline-flex shrink-0 items-center" title={confidentialLabel}>
          <Lock className="size-3.5 text-warning" aria-hidden="true" />
          <span className="sr-only">{confidentialLabel}</span>
        </span>
      )}
      <span className="min-w-0 truncate font-medium text-foreground" title={task.title}>
        {task.title}
      </span>
      {lessonHits.length > 0 && <LessonRuleBadge hits={lessonHits} />}
    </div>
  )
}

export function TaskStatusCell({ task }: { task: RawTask }): React.ReactElement {
  const derived = deriveTaskStatus(task)
  const paused = isTaskPaused(task)
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <StatusText status={paused ? 'paused' : derived} />
      <span className="text-xs text-muted-foreground">{task.progress}%</span>
    </div>
  )
}

export function TaskLastReportCell({ task }: { task: RawTask }): React.ReactElement {
  const summary = parseLastReportSummary(task)
  if (!summary) {
    return <span className="text-muted-foreground">-</span>
  }
  const tooltip = [summary.at, summary.who, summary.progress, summary.text]
    .filter(Boolean)
    .join(' • ')
  return (
    <span className="block truncate text-foreground" title={tooltip}>
      {summary.text || summary.at}
    </span>
  )
}

export function TaskWorkItemsCell({
  task,
  formatCount,
}: {
  task: RawTask
  formatCount: (count: number) => string
}): React.ReactElement {
  const summary = getWorkItemsSummary(task)
  if (!summary) return <span className="text-muted-foreground">-</span>
  const label = formatCount(summary.count)
  const detail = summary.firstTopic ? `${label} • ${summary.firstTopic}` : label
  return (
    <span className="block truncate text-foreground" title={detail}>
      {detail}
    </span>
  )
}

export function TaskLevelCell({
  level,
  labels,
}: {
  level: RawTask['level']
  labels: { critical: string; urgent: string; normal: string }
}): React.ReactElement {
  const code = getTaskLevelCode(level)
  const label =
    code === 'critical'
      ? labels.critical
      : code === 'urgent'
        ? labels.urgent
        : labels.normal
  const toneClass =
    code === 'critical'
      ? 'text-status-urgent font-semibold'
      : code === 'urgent'
        ? 'text-warning font-semibold'
        : 'text-muted-foreground'
  return <span className={toneClass}>{label}</span>
}

export function TaskActionCell({
  taskId,
  ariaLabel,
}: {
  taskId: number
  ariaLabel: string
}): React.ReactElement {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-7 hover:bg-muted"
      onClick={(e) => e.stopPropagation()}
      aria-label={ariaLabel}
    >
      <Link to={APP_ROUTES.TASK_DETAIL(taskId)}>
        <Eye className="size-4.5 text-muted-foreground" aria-hidden="true" />
      </Link>
    </Button>
  )
}
