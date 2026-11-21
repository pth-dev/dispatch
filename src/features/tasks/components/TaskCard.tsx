import { useTranslation } from 'react-i18next'
import { CalendarDays, MessageSquareText, User } from 'lucide-react'
import { StatusText } from '@/components/ui/status-text'
import { useAppStore } from '@/app/store'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils'
import {
  deriveTaskStatus,
  getTaskLevelCode,
  isTaskPaused,
  parseReqDepts,
  sameDept,
} from '@/utils/task-domain'
import { matchesAssignee, matchesCreator } from '../api/filter-tasks'
import { formatTaskDueDate, parseLastReportSummary } from '../utils/task-display'
import { TaskCardChips } from './TaskCardChips'

type TaskCardProps = {
  task: RawTask
  resolveDeptName: (rawDept: string | null | undefined) => string
  showRoleTags: boolean
  onSelect: (task: RawTask) => void
}

export function TaskCard({
  task,
  resolveDeptName,
  showRoleTags,
  onSelect,
}: TaskCardProps) {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)
  const derived = deriveTaskStatus(task)
  const paused = isTaskPaused(task)
  const levelCode = getTaskLevelCode(task.level)
  const isMine = showRoleTags && matchesAssignee(task, user)
  const isCreated = showRoleTags && matchesCreator(task, user)
  const lastReport = parseLastReportSummary(task)
  const reporterLabel = task.reporter_name?.trim() || task.reporter || '-'
  const progress = Math.min(100, Math.max(0, task.progress))
  const deptLabel = resolveDeptName(task.assigned_unit)
  const distinctReqDept = parseReqDepts(task.req_depts, task.req_dept).find(
    (dept) => !sameDept(dept, task.assigned_unit),
  )
  const reqDeptLabel = distinctReqDept ? resolveDeptName(distinctReqDept) : ''

  return (
    <article className="relative flex h-full flex-col gap-2.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-primary">#{task.id}</span>
          {levelCode !== 'normal' && (
            <span
              className={cn(
                'font-semibold',
                levelCode === 'critical' ? 'text-status-urgent' : 'text-warning',
              )}
            >
              {levelCode === 'critical'
                ? t('tasks.filter.levelCritical')
                : t('tasks.filter.levelUrgent')}
            </span>
          )}
          {isMine && (
            <span className="rounded bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-primary">
              {t('tasks.card.assignedToMe')}
            </span>
          )}
          {isCreated && !isMine && (
            <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-xs font-medium text-foreground">
              {t('tasks.card.createdByMe')}
            </span>
          )}
        </div>
        <StatusText status={paused ? 'paused' : derived} className="shrink-0 text-xs" />
      </div>

      <div className="space-y-1 min-w-0">
        <h4>
          <button
            type="button"
            onClick={() => onSelect(task)}
            className="text-left text-sm font-semibold text-foreground line-clamp-2 leading-snug after:absolute after:inset-0 focus:outline-none cursor-pointer"
          >
            {task.title}
          </button>
        </h4>
        {task.title_vn && task.title_vn !== task.title && (
          <p className="text-xs text-muted-foreground line-clamp-1">{task.title_vn}</p>
        )}
      </div>

      <TaskCardChips task={task} />

      <div className="mt-auto space-y-2 pt-2 border-t border-border text-xs text-muted-foreground">
        {lastReport && (
          <div className="flex items-start gap-1.5 rounded-md bg-secondary/50 px-2 py-1.5 text-xs text-foreground">
            <MessageSquareText
              className="size-3.5 shrink-0 mt-0.5 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="line-clamp-2 min-w-0 leading-snug">
              {lastReport.text || lastReport.at}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="inline-flex items-center gap-1 truncate max-w-full">
            <User className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate text-foreground font-medium">
              {task.assign_person || '-'}
            </span>
          </span>
          <span className="truncate">{deptLabel}</span>
          {reqDeptLabel && (
            <span className="truncate">{t('tasks.card.reqDeptLabel', { dept: reqDeptLabel })}</span>
          )}
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
          <span className="font-semibold text-foreground tabular-nums">{progress}%</span>
        </div>
      </div>
    </article>
  )
}
