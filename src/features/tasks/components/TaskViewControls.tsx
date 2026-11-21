import { useTranslation } from 'react-i18next'
import { LayoutGrid, ListChecks } from 'lucide-react'
import { cn } from '@/utils'
import type { TaskColumnId, TaskViewMode } from '../hooks/use-task-view-prefs'
import { TaskColumnPicker } from './TaskColumnPicker'

type TaskViewControlsProps = {
  viewMode: TaskViewMode
  columnOrder: readonly TaskColumnId[]
  hiddenSet: ReadonlySet<TaskColumnId>
  isDefaultColumns: boolean
  onViewModeChange: (mode: TaskViewMode) => void
  onToggleColumn: (id: TaskColumnId) => void
  onMoveColumn: (id: TaskColumnId, direction: -1 | 1) => void
  onResetColumns: () => void
  className?: string
}

export function TaskViewControls({
  viewMode,
  columnOrder,
  hiddenSet,
  isDefaultColumns,
  onViewModeChange,
  onToggleColumn,
  onMoveColumn,
  onResetColumns,
  className,
}: TaskViewControlsProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('hidden lg:flex items-center gap-2 shrink-0', className)}>
      {viewMode === 'table' && (
        <TaskColumnPicker
          columnOrder={columnOrder}
          hiddenSet={hiddenSet}
          isDefault={isDefaultColumns}
          onToggle={onToggleColumn}
          onMove={onMoveColumn}
          onReset={onResetColumns}
        />
      )}

      <div
        role="group"
        aria-label={t('tasks.view.label')}
        className="inline-flex h-10 items-center rounded-lg border border-border bg-card p-1"
      >
        <button
          type="button"
          aria-pressed={viewMode === 'table'}
          onClick={() => onViewModeChange('table')}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            viewMode === 'table'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ListChecks className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.view.table')}</span>
        </button>

        <button
          type="button"
          aria-pressed={viewMode === 'card'}
          onClick={() => onViewModeChange('card')}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            viewMode === 'card'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <LayoutGrid className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.view.card')}</span>
        </button>
      </div>
    </div>
  )
}
