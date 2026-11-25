import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Download,
  GanttChart,
  Table2,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { WorkItemsRule } from '@/schemas/task'
import type {
  WorkItemsRemainingSummary,
  WorkItemsSummary,
} from '../utils/work-items-domain'

export type ProjectWorkItemsViewMode = 'board' | 'gantt'

type WorkItemsSummaryBarProps = {
  itemCount: number
  rule: WorkItemsRule
  summary: WorkItemsSummary
  remaining: WorkItemsRemainingSummary
  viewMode: ProjectWorkItemsViewMode
  mineOnly: boolean
  exporting: boolean
  onViewModeChange: (mode: ProjectWorkItemsViewMode) => void
  onMineOnlyChange: (next: boolean) => void
  onExportExcel: () => void
}

export function WorkItemsSummaryBar({
  itemCount,
  rule,
  summary,
  remaining,
  viewMode,
  mineOnly,
  exporting,
  onViewModeChange,
  onMineOnlyChange,
  onExportExcel,
}: WorkItemsSummaryBarProps) {
  const { t } = useTranslation()

  const tabClass = (active: boolean) =>
    cn(
      'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarRange className="size-4 text-primary shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">
            {t('tasks.detail.workItemsTitle', { count: itemCount })}
          </h2>
          {remaining.allDone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-success">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              <span>{t('tasks.project.allDone')}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t('tasks.project.viewModeLabel')}
            className="inline-flex items-center rounded-lg border border-border bg-background p-0.5"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'board'}
              onClick={() => onViewModeChange('board')}
              className={tabClass(viewMode === 'board')}
            >
              <Table2 className="size-3.5" aria-hidden="true" />
              <span>{t('tasks.project.viewBoard')}</span>
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'gantt'}
              onClick={() => onViewModeChange('gantt')}
              className={tabClass(viewMode === 'gantt')}
            >
              <GanttChart className="size-3.5" aria-hidden="true" />
              <span>{t('tasks.project.viewGantt')}</span>
            </button>
          </div>

          <Button
            type="button"
            variant={mineOnly ? 'default' : 'outline'}
            size="sm"
            aria-pressed={mineOnly}
            onClick={() => onMineOnlyChange(!mineOnly)}
          >
            <UserCheck className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.project.mineOnly')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={onExportExcel}
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.project.exportExcel')}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground tabular-nums">
        <span>
          {t('tasks.project.ruleLabel')}:{' '}
          <strong className="text-foreground">{t(`tasks.project.rules.${rule}`)}</strong>
        </span>
        <span>
          {t('tasks.project.spanDays')}:{' '}
          <strong className="text-foreground">{summary.spanDays}</strong>
        </span>
        <span>
          {t('tasks.project.deductDays')}:{' '}
          <strong className="text-foreground">{summary.spanDeduct}</strong>
        </span>
        <span>
          {t('tasks.project.remainNetDays')}:{' '}
          <strong className="text-primary">{remaining.remainNet}</strong>
        </span>
        {remaining.warnings.length > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-warning">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{t('tasks.project.warnCount', { count: remaining.warnings.length })}</span>
          </span>
        )}
      </div>
    </div>
  )
}
