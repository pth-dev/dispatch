import { CalendarDays, Download, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TodoHeaderBarProps {
  selectedDate: string
  today: string
  isDirty: boolean
  canWrite: boolean
  isSaving: boolean
  hasSelectedItems: boolean
  onDateChange: (nextDate: string) => void
  onSave: () => void
  onExportCsv: () => void
}

export function TodoHeaderBar({
  selectedDate,
  today,
  isDirty,
  canWrite,
  isSaving,
  hasSelectedItems,
  onDateChange,
  onSave,
  onExportCsv,
}: TodoHeaderBarProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('todo.title')}
          </h1>
          <p className="text-xs text-muted-foreground">{t('todo.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <Badge
              variant="outline"
              className="border-destructive/30 bg-destructive/5 text-destructive"
            >
              {t('todo.unsavedBadge')}
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onExportCsv}
            disabled={!hasSelectedItems}
          >
            <Download className="size-4" />
            <span>{t('todo.actions.export')}</span>
          </Button>
          {canWrite && (
            <Button type="button" onClick={onSave} disabled={isSaving}>
              <Save className="size-4" />
              <span>
                {isSaving ? t('todo.actions.saving') : t('todo.actions.save')}
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <label
          htmlFor="todo-date-picker"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <CalendarDays className="size-4 text-primary" />
          <span>{t('todo.workDateLabel')}</span>
        </label>
        <Input
          id="todo-date-picker"
          type="date"
          value={selectedDate}
          disabled={isSaving}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-auto min-w-40"
        />
        {selectedDate !== today && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSaving}
            onClick={() => onDateChange(today)}
          >
            {t('todo.actions.today')}
          </Button>
        )}
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {t('todo.hint')}
        </p>
      </div>
    </div>
  )
}
