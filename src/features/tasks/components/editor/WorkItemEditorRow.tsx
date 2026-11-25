import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { DeptItem } from '@/schemas/meta'
import type { WorkItem } from '@/schemas/task'
import type { WorkItemDayCalc } from '../../utils/work-items-domain'
import { SELECT_FIELD_CLASS } from '../../api/task-catalog'

type WorkItemEditorRowProps = {
  item: WorkItem
  index: number
  total: number
  calc: WorkItemDayCalc
  share: number
  depts: DeptItem[]
  userDatalistId: string
  disabled?: boolean
  onChange: (index: number, patch: Partial<WorkItem>) => void
  onMove: (index: number, delta: -1 | 1) => void
  onRemove: (index: number) => void
}

export function WorkItemEditorRow({
  item,
  index,
  total,
  calc,
  share,
  depts,
  userDatalistId,
  disabled = false,
  onChange,
  onMove,
  onRemove,
}: WorkItemEditorRowProps) {
  const { t } = useTranslation()
  const prefix = `wi-${item.id}`

  return (
    <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-soft text-[11px] font-semibold text-primary tabular-nums">
            {index + 1}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {calc.hasRangeError ? (
              <span className="text-destructive font-medium">
                {t('tasks.project.rangeError')}
              </span>
            ) : calc.gross > 0 ? (
              t('tasks.project.itemDaysBadge', {
                net: calc.net,
                share: share.toFixed(1),
              })
            ) : (
              t('tasks.project.noDatesYet')
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 lg:size-7"
            disabled={disabled || index === 0}
            onClick={() => onMove(index, -1)}
            aria-label={t('tasks.project.moveUp')}
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 lg:size-7"
            disabled={disabled || index >= total - 1}
            onClick={() => onMove(index, 1)}
            aria-label={t('tasks.project.moveDown')}
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 lg:size-7 text-destructive hover:text-destructive"
            disabled={disabled}
            onClick={() => onRemove(index)}
            aria-label={t('common.delete')}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        <div className="md:col-span-5 space-y-1">
          <label htmlFor={`${prefix}-topic`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.topic')} <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <Input
            id={`${prefix}-topic`}
            value={item.topic}
            maxLength={120}
            disabled={disabled}
            placeholder={t('tasks.project.topicPlaceholder')}
            onChange={(e) => onChange(index, { topic: e.target.value })}
          />
        </div>

        <div className="md:col-span-3 space-y-1">
          <label htmlFor={`${prefix}-ou`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.ownerOu')}
          </label>
          <select
            id={`${prefix}-ou`}
            value={item.owner_ou}
            disabled={disabled}
            onChange={(e) => onChange(index, { owner_ou: e.target.value })}
            className={SELECT_FIELD_CLASS}
          >
            <option value="">-</option>
            {depts.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
            {item.owner_ou && !depts.some((d) => d.value === item.owner_ou) && (
              <option value={item.owner_ou}>{item.owner_ou}</option>
            )}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label htmlFor={`${prefix}-owner`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.owner')}
          </label>
          <Input
            id={`${prefix}-owner`}
            list={userDatalistId}
            value={item.owner}
            disabled={disabled}
            placeholder={t('tasks.project.userPlaceholder')}
            onChange={(e) => onChange(index, { owner: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label htmlFor={`${prefix}-agent`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.agent')}
          </label>
          <Input
            id={`${prefix}-agent`}
            list={userDatalistId}
            value={item.agent}
            disabled={disabled}
            placeholder={t('tasks.project.userPlaceholder')}
            onChange={(e) => onChange(index, { agent: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        <div className="md:col-span-5 space-y-1">
          <label htmlFor={`${prefix}-start`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.start')}
          </label>
          <Input
            id={`${prefix}-start`}
            type="datetime-local"
            value={item.start}
            disabled={disabled}
            onChange={(e) => onChange(index, { start: e.target.value })}
          />
        </div>

        <div className="md:col-span-5 space-y-1">
          <label htmlFor={`${prefix}-end`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.end')}
          </label>
          <Input
            id={`${prefix}-end`}
            type="datetime-local"
            value={item.end}
            aria-invalid={calc.hasRangeError}
            disabled={disabled}
            onChange={(e) => onChange(index, { end: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <label htmlFor={`${prefix}-deduct`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.deduct')}
          </label>
          <Input
            id={`${prefix}-deduct`}
            type="number"
            min={0}
            max={999}
            step={0.5}
            value={item.deduct}
            disabled={disabled}
            onChange={(e) => onChange(index, { deduct: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label htmlFor={`${prefix}-content`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.content')}
          </label>
          <Textarea
            id={`${prefix}-content`}
            rows={2}
            value={item.content}
            disabled={disabled}
            placeholder={t('tasks.project.contentPlaceholder')}
            onChange={(e) => onChange(index, { content: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={`${prefix}-risk`} className="block text-[11px] font-semibold text-foreground">
            {t('tasks.project.risk')}
          </label>
          <Textarea
            id={`${prefix}-risk`}
            rows={2}
            value={item.risk}
            disabled={disabled}
            placeholder={t('tasks.project.riskPlaceholder')}
            onChange={(e) => onChange(index, { risk: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
