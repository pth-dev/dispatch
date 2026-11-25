import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Repeat, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { InlineError, toErrorStatus } from '@/components/layout'
import type { RawTask } from '@/schemas/task'
import { isRecurringTask } from '@/utils/task-domain'
import { useMyTaskHistory } from '../../api/queries'
import { formatBilingualOption } from '../../api/task-catalog'
import { useDeptNameResolver } from '../../hooks/use-dept-name-resolver'
import { formatTaskDueDate } from '../../utils/task-display'

interface TaskHistoryCloneItemProps {
  task: RawTask
  deptLabel: string
  taskTypeLabel: string
  onSelect: (task: RawTask) => void
}

function TaskHistoryCloneItem({
  task,
  deptLabel,
  taskTypeLabel,
  onSelect,
}: TaskHistoryCloneItemProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-secondary cursor-pointer focus-visible:outline-none focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <span className="shrink-0 pt-0.5 text-xs font-semibold text-primary">#{task.id}</span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {task.confidential !== 0 && (
            <>
              <Lock className="size-3.5 shrink-0 text-warning" aria-hidden="true" />
              <span className="sr-only">{t(`tasks.confidential.lv${task.confidential}`)}</span>
            </>
          )}
          <span className="truncate">{task.title}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>{taskTypeLabel}</span>
          <span>•</span>
          <span>{deptLabel}</span>
          <span>•</span>
          <span>
            {t('tasks.clonePicker.dueLabel')}: {formatTaskDueDate(task.due_date)}
          </span>
          <span>•</span>
          <span>{task.progress}%</span>
          {isRecurringTask(task) && (
            <>
              <Repeat className="size-3 text-primary" aria-hidden="true" />
              <span className="sr-only">{t('tasks.fields.recurType')}</span>
            </>
          )}
        </span>
      </span>
    </button>
  )
}

interface TaskHistoryCloneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPickTask: (task: RawTask) => void
}

export function TaskHistoryCloneDialog({
  open,
  onOpenChange,
  onPickTask,
}: TaskHistoryCloneDialogProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = React.useState('')
  const resolveDept = useDeptNameResolver()
  const { data: history = [], isLoading, isError, error, refetch } = useMyTaskHistory(open)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setQuery('')
    onOpenChange(nextOpen)
  }

  const handleSelect = (task: RawTask) => {
    onPickTask(task)
    handleOpenChange(false)
  }

  const normalized = query.trim().toLowerCase().replace(/^#/, '')
  const filtered = history
    .filter((task) => {
      if (!normalized) return true
      const fields = [
        String(task.id),
        task.title,
        task.task_type ?? '',
        task.assigned_unit ?? '',
        resolveDept(task.assigned_unit),
      ]
      return fields.some((f) => f.toLowerCase().includes(normalized))
    })
    .slice(0, 200)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col p-4 sm:p-6 sm:max-w-2xl overflow-hidden">
        <DialogHeader className="min-w-0 pr-8 text-left">
          <DialogTitle className="text-base sm:text-lg leading-snug">
            {t('tasks.clonePicker.title')}
          </DialogTitle>
          <DialogDescription>{t('tasks.clonePicker.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('tasks.clonePicker.searchPlaceholder')}
              aria-label={t('tasks.clonePicker.searchPlaceholder')}
              className="pl-9"
            />
          </div>

          {isError ? (
            <InlineError status={toErrorStatus(error)} onRetry={() => void refetch()} />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-border rounded-lg border border-border">
              {isLoading ? (
                <LoadingSpinner size="md" className="p-6" />
              ) : filtered.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  {history.length === 0
                    ? t('tasks.clonePicker.empty')
                    : t('tasks.clonePicker.noMatch')}
                </p>
              ) : (
                filtered.map((task) => (
                  <TaskHistoryCloneItem
                    key={task.id}
                    task={task}
                    deptLabel={resolveDept(task.assigned_unit)}
                    taskTypeLabel={
                      task.task_type ? formatBilingualOption(task.task_type, i18n.language) : '-'
                    }
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
