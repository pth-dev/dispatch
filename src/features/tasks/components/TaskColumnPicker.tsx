import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Columns3, Lock, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils'
import { LOCKED_TASK_COLUMNS, type TaskColumnId } from '../hooks/use-task-view-prefs'

type TaskColumnPickerRowProps = {
  id: TaskColumnId
  visible: boolean
  isFirst: boolean
  isLast: boolean
  onToggle: (id: TaskColumnId) => void
  onMove: (id: TaskColumnId, direction: -1 | 1) => void
}

function TaskColumnPickerRow({
  id,
  visible,
  isFirst,
  isLast,
  onToggle,
  onMove,
}: TaskColumnPickerRowProps) {
  const { t } = useTranslation()
  const locked = LOCKED_TASK_COLUMNS.has(id)
  const label = t(`tasks.columns.${id}`)

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs',
        visible ? 'border-border bg-card' : 'border-dashed border-border bg-secondary/40',
      )}
    >
      <label className="flex flex-1 min-w-0 items-center gap-2 cursor-pointer">
        <Checkbox
          checked={visible}
          disabled={locked}
          onCheckedChange={() => onToggle(id)}
          aria-label={label}
        />
        <span className="truncate text-foreground">{label}</span>
        {locked && (
          <span className="inline-flex shrink-0 items-center" title={t('tasks.view.lockedColumn')}>
            <Lock className="size-3 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">{t('tasks.view.lockedColumn')}</span>
          </span>
        )}
      </label>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onMove(id, -1)}
          aria-label={t('tasks.view.moveUp', { column: label })}
          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowUp className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => onMove(id, 1)}
          aria-label={t('tasks.view.moveDown', { column: label })}
          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

type TaskColumnPickerProps = {
  columnOrder: readonly TaskColumnId[]
  hiddenSet: ReadonlySet<TaskColumnId>
  isDefault: boolean
  onToggle: (id: TaskColumnId) => void
  onMove: (id: TaskColumnId, direction: -1 | 1) => void
  onReset: () => void
}

export function TaskColumnPicker({
  columnOrder,
  hiddenSet,
  isDefault,
  onToggle,
  onMove,
  onReset,
}: TaskColumnPickerProps) {
  const { t } = useTranslation()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-10 px-3 text-xs gap-1.5 shrink-0',
            !isDefault && 'border-primary text-primary font-semibold',
          )}
        >
          <Columns3 className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.view.columns')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-semibold text-foreground">{t('tasks.view.columns')}</span>
          {!isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded text-xs font-semibold text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              <span>{t('common.reset')}</span>
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('tasks.view.columnsHint')}
        </p>

        <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5">
          {columnOrder.map((id, index) => (
            <TaskColumnPickerRow
              key={id}
              id={id}
              visible={!hiddenSet.has(id)}
              isFirst={index === 0}
              isLast={index === columnOrder.length - 1}
              onToggle={onToggle}
              onMove={onMove}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
