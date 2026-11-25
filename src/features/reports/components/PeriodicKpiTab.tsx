import * as React from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MetricCard } from '@/components/ui/metric-card'
import { getDeptDisplayName, useMetaDepts } from '@/hooks/use-meta'
import { isSuperLike } from '@/utils/permissions'
import { sameDept } from '@/utils/task-domain'
import { getQuickDateRange } from '@/utils/date-range'
import { useReportTasks } from '../api/queries'
import { exportPeriodicKpiWorkbook, summarizeReportTasks } from '../utils/report-domain'

type KpiCycle = 'week' | 'month' | 'quarter' | 'year' | 'custom'
const CYCLES: readonly KpiCycle[] = ['week', 'month', 'quarter', 'year', 'custom']

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

export function PeriodicKpiTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const isSuper = isSuperLike(user)
  const deptsQuery = useMetaDepts()

  const initial = getQuickDateRange('month')
  const [cycle, setCycle] = React.useState<KpiCycle>('month')
  const [startDate, setStartDate] = React.useState(initial.start)
  const [endDate, setEndDate] = React.useState(initial.end)
  const [dept, setDept] = React.useState('')
  const [isExporting, setIsExporting] = React.useState(false)

  const tasksQuery = useReportTasks({ purpose: 'kpi', start: startDate, end: endDate })
  const scopedTasks = (tasksQuery.data ?? []).filter(
    (task) => !dept || sameDept(task.assigned_unit, dept),
  )
  const metrics = summarizeReportTasks(scopedTasks)

  const handleCycleChange = (next: KpiCycle) => {
    setCycle(next)
    if (next !== 'custom') {
      const range = getQuickDateRange(next)
      setStartDate(range.start)
      setEndDate(range.end)
    }
  }

  const handleExport = async () => {
    if (scopedTasks.length === 0) {
      onNotify(t('reports.common.exportEmpty'))
      return
    }
    setIsExporting(true)
    try {
      await exportPeriodicKpiWorkbook(scopedTasks, startDate, endDate)
      onNotify(t('reports.common.exportSuccess'))
    } catch {
      onNotify(t('common.error'))
    }
    setIsExporting(false)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs text-muted-foreground">{t('reports.kpi.description')}</p>

        <div className="flex flex-wrap items-center gap-1.5">
          {CYCLES.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={cycle === item ? 'default' : 'outline'}
              onClick={() => handleCycleChange(item)}
            >
              {t(`reports.kpi.cycles.${item}`)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            type="date"
            aria-label={t('reports.common.startDate')}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setCycle('custom')
            }}
          />
          <Input
            type="date"
            aria-label={t('reports.common.endDate')}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setCycle('custom')
            }}
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
          <Button
            type="button"
            disabled={scopedTasks.length === 0 || isExporting}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" aria-hidden="true" />
            <span>{t('reports.common.exportExcel')}</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t('reports.kpi.sheetsNote')}</p>
      </section>

      {tasksQuery.isLoading ? (
        <div role="status" className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <span className="sr-only">{t('common.loading')}</span>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 motion-safe:animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : tasksQuery.isError ? (
        <InlineError
          status={toErrorStatus(tasksQuery.error)}
          onRetry={() => void tasksQuery.refetch()}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <MetricCard label={t('reports.kpi.cards.total')} value={metrics.total} />
          <MetricCard label={t('reports.kpi.cards.completed')} value={metrics.completed} />
          <MetricCard label={t('reports.kpi.cards.ontime')} value={metrics.ontime} />
          <MetricCard label={t('reports.kpi.cards.late')} value={metrics.late} />
          <MetricCard label={t('reports.kpi.cards.delayed')} value={metrics.delayed} />
          <MetricCard label={t('reports.kpi.cards.rate')} value={`${metrics.ontimeRate}%`} />
        </div>
      )}
    </div>
  )
}
