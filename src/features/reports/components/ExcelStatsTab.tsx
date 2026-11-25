import * as React from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs text-muted-foreground">{t('reports.excel.description')}</p>

        <div className="flex flex-wrap items-center gap-2">
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
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
          <Button
            type="button"
            disabled={scopedTasks.length === 0 || isExporting}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" aria-hidden="true" />
            <span>{t('reports.common.exportExcel')}</span>
          </Button>
        </div>
      </section>

      {tasksQuery.isLoading ? (
        <div role="status" className="h-40 motion-safe:animate-pulse rounded-xl border border-border bg-card">
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : tasksQuery.isError ? (
        <InlineError
          status={toErrorStatus(tasksQuery.error)}
          onRetry={() => void tasksQuery.refetch()}
        />
      ) : ranking.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {t('reports.common.noTasks')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left text-xs font-semibold text-primary">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{t('reports.excel.cols.person')}</th>
                <th className="px-3 py-2">{t('reports.excel.cols.dept')}</th>
                <th className="px-3 py-2 text-right">{t('reports.excel.cols.total')}</th>
                <th className="px-3 py-2 text-right">{t('reports.excel.cols.ontime')}</th>
                <th className="px-3 py-2 text-right">{t('reports.excel.cols.late')}</th>
                <th className="px-3 py-2 text-right">{t('reports.excel.cols.delayed')}</th>
                <th className="px-3 py-2 text-right">{t('reports.excel.cols.open')}</th>
                <th className="px-3 py-2 text-right">{t('reports.excel.cols.rate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ranking.map((row, idx) => (
                <tr key={row.key} className="hover:bg-secondary/50">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{row.label}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.dept || '—'}</td>
                  <td className="px-3 py-2 text-right">{row.metrics.total}</td>
                  <td className="px-3 py-2 text-right text-success">{row.metrics.ontime}</td>
                  <td className="px-3 py-2 text-right text-warning">{row.metrics.late}</td>
                  <td className="px-3 py-2 text-right text-destructive">{row.metrics.delayed}</td>
                  <td className="px-3 py-2 text-right text-primary">{row.metrics.open}</td>
                  <td className="px-3 py-2 text-right font-semibold">{row.metrics.ontimeRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
