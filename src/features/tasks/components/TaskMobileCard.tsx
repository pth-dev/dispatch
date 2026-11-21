import { useTranslation } from 'react-i18next'
import { StatusText } from '@/components/ui/status-text'
import type { RawTask } from '@/schemas/task'
import { deriveTaskStatus, isTaskPaused } from '@/utils/task-domain'
import { formatTaskDueDate } from '../hooks/use-task-columns'

type TaskMobileCardProps = {
  task: RawTask
}

export function TaskMobileCard({ task }: TaskMobileCardProps) {
  const { t } = useTranslation()
  const derived = deriveTaskStatus(task)
  const paused = isTaskPaused(task)

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-primary">#{task.id}</span>
        <div className="flex items-center gap-1.5">
          <StatusText status={paused ? 'paused' : derived} />
          <span className="text-[11px] text-muted-foreground">{task.progress}%</span>
        </div>
      </div>

      <p className="font-medium text-foreground line-clamp-2 leading-snug">{task.title}</p>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
        <span>{task.assigned_unit || '-'}</span>
        <span>•</span>
        <span>{task.assign_person || '-'}</span>
        <span>•</span>
        <span>{t('tasks.mobile.dueDate', { date: formatTaskDueDate(task.due_date) })}</span>
      </div>
    </div>
  )
}
