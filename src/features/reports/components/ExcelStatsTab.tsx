import * as React from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { getDeptDisplayName, useMetaDepts } from '@/hooks/use-meta'
import { isSuperLike } from '@/utils/permissions'
import { parseAssigneeList, sameDept } from '@/utils/task-domain'
import { getQuickDateRange } from '@/utils/date-range'
import { useReportTasks } from '../api/queries'
import {
  buildEfficiencyRanking,
  exportEfficiencyWorkbook,
  exportProgressWorkbook,
  type ReportGroupRow,
} from '../utils/report-domain'

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

export function ExcelStatsTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const isSuper = isSuperLike(user)
  const deptsQuery = useMetaDepts()

  const initial = getQuickDateRange('month')
  const [mode, setMode] = React.useState<'progress' | 'efficiency'>('progress')
  const [startDate, setStartDate] = React.useState(initial.start)
  const [endDate, setEndDate] = React.useState(initial.end)
  const [dept, setDept] = React.useState('')
  const [keyword, setKeyword] = React.useState('')
  const [dimension, setDimension] = React.useState<'assignee' | 'reporter'>('assignee')
  const [isExporting, setIsExporting] = React.useState(false)

  const tasksQuery = useReportTasks({ purpose: mode, start: startDate, end: endDate })

  const scopedTasks = (tasksQuery.data ?? []).filter((task) => {
    if (dept && !sameDept(task.assigned_unit, dept)) return false
    const q = keyword.trim().toLowerCase()
    if (!q) return true
    return (
      task.title.toLowerCase().includes(q) ||
      (task.assign_person ?? '').toLowerCase().includes(q) ||
      task.reporter.toLowerCase().includes(q) ||
      parseAssigneeList(task.assign_person).some((a) => a.toLowerCase().includes(q))
    )
  })

  const ranking = buildEfficiencyRanking(scopedTasks, dimension)

  const columns: ColumnDef<ReportGroupRow, unknown>[] = [
    {
      id: 'rank',
      header: '#',
      meta: { width: '48px', minWidth: '48px' },
      cell: ({ row }) => <span className="text-muted-foreground">{row.index + 1}</span>,
    },
    {
      id: 'person',
      header: t('reports.excel.cols.person'),
      meta: { minWidth: '150px' },
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.label}</span>,
    },
    {
      id: 'dept',
      header: t('reports.excel.cols.dept'),
      meta: { minWidth: '130px' },
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.dept || '—'}</span>,
    },
    {
      id: 'total',
      header: t('reports.excel.cols.total'),
      meta: { align: 'right', minWidth: '72px' },
      cell: ({ row }) => <span>{row.original.metrics.total}</span>,
    },
    {
      id: 'ontime',
      header: t('reports.excel.cols.ontime'),
      meta: { align: 'right', minWidth: '84px' },
      cell: ({ row }) => <span className="text-success">{row.original.metrics.ontime}</span>,
    },
    {
      id: 'late',
      header: t('reports.excel.cols.late'),
      meta: { align: 'right', minWidth: '76px' },
      cell: ({ row }) => <span className="text-warning">{row.original.metrics.late}</span>,
    },
    {
      id: 'delayed',
      header: t('reports.excel.cols.delayed'),
      meta: { align: 'right', minWidth: '80px' },
      cell: ({ row }) => <span className="text-destructive">{row.original.metrics.delayed}</span>,
    },
    {
      id: 'open',
      header: t('reports.excel.cols.open'),
      meta: { align: 'right', minWidth: '80px' },
      cell: ({ row }) => <span className="text-primary">{row.original.metrics.open}</span>,
    },
    {
      id: 'rate',
      header: t('reports.excel.cols.rate'),
      meta: { align: 'right', minWidth: '104px' },
      cell: ({ row }) => <span className="font-semibold">{row.original.metrics.ontimeRate}%</span>,
    },
  ]

  const handleExport = async () => {
    if (scopedTasks.length === 0) {
      onNotify(t('reports.common.exportEmpty'))
      return
    }
    setIsExporting(true)
    try {
      if (mode === 'progress') {
        await exportProgressWorkbook(scopedTasks, startDate, endDate)
      } else {
        await exportEfficiencyWorkbook(ranking, dimension, startDate, endDate)
      }
      onNotify(t('reports.common.exportSuccess'))
    } catch {
      onNotify(t('common.error'))
    }
    setIsExporting(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <section className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={mode === 'progress' ? 'default' : 'outline'}
              onClick={() => setMode('progress')}
            >
              {t('reports.excel.modeProgress')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'efficiency' ? 'default' : 'outline'}
              onClick={() => setMode('efficiency')}
            >
              {t('reports.excel.modeEfficiency')}
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={scopedTasks.length === 0 || isExporting}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" aria-hidden="true" />
            <span>{t('reports.common.exportExcel')}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="date"
            aria-label={t('reports.common.startDate')}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            aria-label={t('reports.common.endDate')}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {isSuper && (
            <select
              aria-label={t('reports.common.department')}
              className={SELECT_CLS}
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              <option value="">{t('reports.common.allDepartments')}</option>
              {(deptsQuery.data?.depts ?? []).map((d) => (
                <option key={d.value} value={d.value}>
                  {getDeptDisplayName(d, i18n.language)}
                </option>
              ))}
            </select>
          )}
          {mode === 'efficiency' ? (
            <select
              aria-label={t('reports.excel.dimension')}
              className={SELECT_CLS}
              value={dimension}
              onChange={(e) => setDimension(e.target.value as 'assignee' | 'reporter')}
            >
              <option value="assignee">{t('reports.excel.dimAssignee')}</option>
              <option value="reporter">{t('reports.excel.dimReporter')}</option>
            </select>
          ) : (
            <Input
              type="search"
              aria-label={t('reports.excel.keyword')}
              placeholder={t('reports.excel.keyword')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          )}
        </div>
      </section>

      {tasksQuery.isError ? (
        <InlineError
          status={toErrorStatus(tasksQuery.error)}
          onRetry={() => void tasksQuery.refetch()}
        />
      ) : (
        <DataTable
          data={ranking}
          columns={columns}
          isLoading={tasksQuery.isLoading}
          keyExtractor={(row) => row.key}
          emptyMessage={t('reports.common.noTasks')}
          density="compact"
          enablePagination
          className="min-h-0 flex-1"
        />
      )}
    </div>
  )
}
