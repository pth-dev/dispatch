import * as React from 'react'
import { useTranslation } from 'react-i18next'
import type { RawReport, WorkItemsEnvelope } from '@/schemas/task'
import {
  calcWorkItemsRemaining,
  computeWorkItemReportStats,
  isWorkItemMine,
  summarizeWorkItems,
} from '../utils/work-items-domain'
import { exportWorkItemsExcel } from '../utils/work-items-excel'
import {
  WorkItemsSummaryBar,
  type ProjectWorkItemsViewMode,
} from './WorkItemsSummaryBar'
import { WorkItemsBoardView, type WorkItemBoardRow } from './WorkItemsBoardView'
import { WorkItemsGanttView } from './WorkItemsGanttView'

type ProjectWorkItemsPanelProps = {
  envelope: WorkItemsEnvelope | null
  taskTitle: string
  isTaskFinished: boolean
  reports: RawReport[]
  currentUsername?: string | null
  canReport: boolean
  activeFilterTopicId: string
  onReportTopic: (topicId: string) => void
  onFilterTopic: (topicId: string) => void
}

export function ProjectWorkItemsPanel({
  envelope,
  taskTitle,
  isTaskFinished,
  reports,
  currentUsername,
  canReport,
  activeFilterTopicId,
  onReportTopic,
  onFilterTopic,
}: ProjectWorkItemsPanelProps): React.ReactElement | null {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = React.useState<ProjectWorkItemsViewMode>('board')
  const [mineOnly, setMineOnly] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [exportError, setExportError] = React.useState<string | null>(null)

  if (!envelope || envelope.items.length === 0) return null

  const summary = summarizeWorkItems(envelope.items, envelope.rule)
  const reportStats = computeWorkItemReportStats(reports)
  const remaining = calcWorkItemsRemaining(
    envelope.items,
    envelope.rule,
    summary,
    reportStats,
    new Date(),
    isTaskFinished,
  )

  const allRows: WorkItemBoardRow[] = envelope.items.map((item, idx) => ({
    item,
    originalIndex: idx,
    calc: summary.calcs[idx] ?? {
      gross: 0,
      auto: 0,
      manual: 0,
      net: 0,
      hasRangeError: false,
    },
    share: summary.shares[idx] ?? 0,
    remain: remaining.rows[idx],
    stat: reportStats[item.id],
  }))

  const visibleRows = mineOnly
    ? allRows.filter((row) => isWorkItemMine(row.item, currentUsername))
    : allRows

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      await exportWorkItemsExcel(envelope.items, envelope.rule, taskTitle)
    } catch {
      setExportError(t('tasks.project.excelError'))
    }
    setExporting(false)
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <WorkItemsSummaryBar
        itemCount={envelope.items.length}
        rule={envelope.rule}
        summary={summary}
        remaining={remaining}
        viewMode={viewMode}
        mineOnly={mineOnly}
        exporting={exporting}
        onViewModeChange={setViewMode}
        onMineOnlyChange={setMineOnly}
        onExportExcel={() => void handleExport()}
      />

      {exportError && (
        <p role="alert" className="text-xs text-destructive">
          {exportError}
        </p>
      )}

      {viewMode === 'board' ? (
        <WorkItemsBoardView
          rows={visibleRows}
          canReport={canReport}
          activeFilterTopicId={activeFilterTopicId}
          onReportTopic={onReportTopic}
          onFilterTopic={onFilterTopic}
        />
      ) : (
        <WorkItemsGanttView
          rows={visibleRows}
          canReport={canReport}
          onReportTopic={onReportTopic}
        />
      )}
    </section>
  )
}
