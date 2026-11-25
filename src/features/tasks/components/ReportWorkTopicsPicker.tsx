import { Calculator, CheckCircle2, ListChecks } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { WorkItemsEnvelope } from '@/schemas/task'
import {
  isWorkItemMine,
  type WorkItemReportStat,
} from '../utils/work-items-domain'

export type TopicDraftState = {
  checked: boolean
  progress: string
  early: boolean
}

type ReportWorkTopicsPickerProps = {
  envelope: WorkItemsEnvelope
  reportStats: Record<string, WorkItemReportStat>
  currentUsername?: string | null
  drafts: Record<string, TopicDraftState>
  calcHint: string | null
  disabled?: boolean
  onToggle: (id: string, checked: boolean) => void
  onProgressChange: (id: string, value: string) => void
  onEarlyChange: (id: string, early: boolean) => void
  onSelectPreset: (mode: 'all' | 'mine' | 'none') => void
  onCalcTotalProgress: () => void
}

export function ReportWorkTopicsPicker({
  envelope,
  reportStats,
  currentUsername,
  drafts,
  calcHint,
  disabled = false,
  onToggle,
  onProgressChange,
  onEarlyChange,
  onSelectPreset,
  onCalcTotalProgress,
}: ReportWorkTopicsPickerProps) {
  const { t } = useTranslation()
  const selectedCount = envelope.items.filter((it) => drafts[it.id]?.checked).length

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <ListChecks className="size-4 text-primary shrink-0" aria-hidden="true" />
          <span>{t('tasks.project.reportTopicsTitle')}</span>
        </div>
        <span className="text-[11px] font-medium text-primary tabular-nums">
          {selectedCount > 0
            ? t('tasks.project.selectedTopicsCount', {
                selected: selectedCount,
                total: envelope.items.length,
              })
            : t('tasks.project.generalReportMode')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px]"
          disabled={disabled}
          onClick={() => onSelectPreset('all')}
        >
          {t('tasks.project.selectAll')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px]"
          disabled={disabled}
          onClick={() => onSelectPreset('mine')}
        >
          {t('tasks.project.selectMine')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px]"
          disabled={disabled}
          onClick={() => onSelectPreset('none')}
        >
          {t('tasks.project.selectNone')}
        </Button>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-0.5">
        {envelope.items.map((item, idx) => {
          const draft = drafts[item.id] ?? { checked: false, progress: '', early: false }
          const stat = reportStats[item.id]
          const mine = isWorkItemMine(item, currentUsername)

          return (
            <div
              key={item.id}
              className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-2"
            >
              <label className="flex min-w-0 flex-1 items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.checked}
                  disabled={disabled}
                  onChange={(e) => onToggle(item.id, e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border text-primary cursor-pointer"
                />
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block font-medium text-foreground break-words">
                    {idx + 1}. {item.topic}
                    {mine && (
                      <span className="ml-1.5 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {t('tasks.project.mineBadge')}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    {stat?.topicProgress !== null && stat?.topicProgress !== undefined
                      ? t('tasks.project.lastTopicProgress', { progress: stat.topicProgress })
                      : t('tasks.project.noTopicProgress')}
                  </span>
                </span>
              </label>

              <div className="flex shrink-0 flex-col items-end gap-1 w-28">
                <Input
                  type="number"
                  min={stat?.topicProgress ?? 0}
                  max={100}
                  step={1}
                  aria-label={`${item.topic} (%)`}
                  value={draft.progress}
                  placeholder="%"
                  disabled={disabled || !draft.checked || draft.early}
                  onChange={(e) => onProgressChange(item.id, e.target.value)}
                  className="h-8 text-xs tabular-nums"
                />
                <label className="inline-flex items-center gap-1 text-[11px] font-medium text-success cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.early}
                    disabled={disabled || !draft.checked}
                    onChange={(e) => onEarlyChange(item.id, e.target.checked)}
                    className="size-3.5 rounded border-border cursor-pointer"
                  />
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  <span>{t('tasks.project.earlyDoneShort')}</span>
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={onCalcTotalProgress}
        >
          <Calculator className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.project.calcWeightedProgress')}</span>
        </Button>
        {calcHint && <span className="text-[11px] font-medium text-primary">{calcHint}</span>}
      </div>
    </div>
  )
}
