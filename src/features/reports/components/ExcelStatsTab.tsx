import * as React from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { MetricCard } from '@/components/ui/metric-card'
import { getDeptDisplayName, useMetaDepts, useUserDirectory } from '@/hooks/use-meta'
import { getQuickDateRange, type QuickDateRange } from '@/utils/date-range'
import { isSuperLike } from '@/utils/permissions'
import { useReportTasks } from '../api/queries'
import {
  buildEfficiencyDataset,
  EMPTY_DEPT_KEY,
  exportEfficiency4SheetWorkbook,
  exportProgress3SheetWorkbook,
  filterProgressTasks,
  type EfficiencyPersonRow,
  type ExcelScopeType,
} from '../utils/excel-report-domain'
import { buildUserLookup, formatRateText } from '../utils/periodic-kpi-domain'
import { ExcelScopePicker } from './ExcelScopePicker'

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

const QUICK_RANGES: readonly Exclude<QuickDateRange, 'today'>[] = [
  'week',
  'month',
  'quarter',
  'year',
]

export function ExcelStatsTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const isSuper = isSuperLike(user)
  const deptsQuery = useMetaDepts()
  const directoryQuery = useUserDirectory()

  const initial = getQuickDateRange('month')
  const [mode, setMode] = React.useState<'progress' | 'efficiency'>('progress')
  const [startDate, setStartDate] = React.useState(initial.start)
  const [endDate, setEndDate] = React.useState(initial.end)
  const [effDept, setEffDept] = React.useState('')
  const [dimension, setDimension] = React.useState<'assignee' | 'reporter'>('assignee')

  const [scopeType, setScopeType] = React.useState<ExcelScopeType>('ALL')
  const [selectedDepts, setSelectedDepts] = React.useState<Set<string>>(() => new Set())
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(() => new Set())
  const [extraKeyword, setExtraKeyword] = React.useState('')
  const [isExporting, setIsExporting] = React.useState(false)

  const tasksQuery = useReportTasks({ purpose: mode, start: startDate, end: endDate })
  const userMap = buildUserLookup(directoryQuery.data ?? [])

  const progressTasks = filterProgressTasks(tasksQuery.data ?? [], {
    scopeType,
    selectedDepts,
    selectedUsers,
    extraKeyword,
    userMap,
  })

  const effDataset = buildEfficiencyDataset(
    mode === 'progress' ? progressTasks : (tasksQuery.data ?? []),
    mode === 'efficiency' ? dimension : 'assignee',
    mode === 'efficiency' && isSuper ? effDept : '',
    userMap,
  )

  const toggleDept = (value: string) => {
    setSelectedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const handleQuickRange = (range: Exclude<QuickDateRange, 'today'>) => {
    const next = getQuickDateRange(range)
    setStartDate(next.start)
    setEndDate(next.end)
  }

  const handleExport = async () => {
    const targetCount = mode === 'progress' ? progressTasks.length : effDataset.people.length
    if (targetCount === 0) {
      onNotify(t('reports.common.exportEmpty'))
      return
    }
    setIsExporting(true)
    try {
      const author = user ? `${user.username} / ${user.fullname || user.username}` : ''
      const scopeLabel = isSuper ? t('reports.common.allDepartments') : user?.dept || ''
      if (mode === 'progress') {
        await exportProgress3SheetWorkbook(progressTasks, {
          start: startDate,
          end: endDate,
          scopeLabel,
          targetLabel: t(`reports.excel.scopes.${scopeType.toLowerCase()}`),
          author,
          userMap,
        })
      } else {
        await exportEfficiency4SheetWorkbook(effDataset, {
          dimension,
          start: startDate,
          end: endDate,
          scopeLabel: effDept || scopeLabel,
          author,
        })
      }
      onNotify(t('reports.common.exportSuccess'))
    } catch {
      onNotify(t('common.error'))
    }
    setIsExporting(false)
  }

  const columns: ColumnDef<EfficiencyPersonRow, unknown>[] = [
    {
      id: 'rank',
      header: '#',
      meta: { width: '48px', minWidth: '48px' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.info.key === EMPTY_DEPT_KEY ? '—' : row.index + 1}
        </span>
      ),
    },
    {
      id: 'person',
      header: t('reports.excel.cols.person'),
      meta: { minWidth: '170px' },
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.info.username}
          {row.original.info.fullname ? ` / ${row.original.info.fullname}` : ''}
        </span>
      ),
    },
    {
      id: 'dept',
      header: t('reports.excel.cols.dept'),
      meta: { minWidth: '130px' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.info.dept || '—'}</span>
      ),
    },
    {
      id: 'total',
      header: t('reports.excel.cols.total'),
      meta: { align: 'right', minWidth: '72px' },
      cell: ({ row }) => <span>{row.original.agg.total}</span>,
    },
    {
      id: 'ontime',
      header: t('reports.excel.cols.ontime'),
      meta: { align: 'right', minWidth: '80px' },
      cell: ({ row }) => <span className="text-success">{row.original.agg.onTime}</span>,
    },
    {
      id: 'late',
      header: t('reports.excel.cols.late'),
      meta: { align: 'right', minWidth: '76px' },
      cell: ({ row }) => <span className="text-warning">{row.original.agg.late}</span>,
    },
    {
      id: 'delayed',
      header: t('reports.excel.cols.delayed'),
      meta: { align: 'right', minWidth: '80px' },
      cell: ({ row }) => <span className="text-destructive">{row.original.agg.delayed}</span>,
    },
    {
      id: 'open',
      header: t('reports.excel.cols.open'),
      meta: { align: 'right', minWidth: '80px' },
      cell: ({ row }) => (
        <span className="text-primary">
          {row.original.agg.inProgress + row.original.agg.notStarted}
        </span>
      ),
    },
    {
      id: 'rate',
      header: t('reports.excel.cols.rate'),
      meta: { align: 'right', minWidth: '104px' },
      cell: ({ row }) => <span className="font-semibold">{row.original.ontimeRate}%</span>,
    },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <section className="shrink-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              aria-pressed={mode === 'progress'}
              variant={mode === 'progress' ? 'default' : 'outline'}
              onClick={() => setMode('progress')}
            >
              {t('reports.excel.modeProgress')}
            </Button>
            <Button
              type="button"
              size="sm"
              aria-pressed={mode === 'efficiency'}
              variant={mode === 'efficiency' ? 'default' : 'outline'}
              onClick={() => setMode('efficiency')}
            >
              {t('reports.excel.modeEfficiency')}
            </Button>
            {QUICK_RANGES.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => handleQuickRange(r)}
              >
                {t(`worklog.quick.${r}`)}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            disabled={
              isExporting ||
              (mode === 'progress' ? progressTasks.length === 0 : effDataset.people.length === 0)
            }
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
          {mode === 'efficiency' && (
            <>
              <select
                aria-label={t('reports.common.department')}
                className={SELECT_CLS}
                disabled={!isSuper}
                value={isSuper ? effDept : user?.dept || ''}
                onChange={(e) => setEffDept(e.target.value)}
              >
                {isSuper ? (
                  <>
                    <option value="">{t('reports.common.allDepartments')}</option>
                    {(deptsQuery.data?.depts ?? []).map((d) => (
                      <option key={d.value} value={d.value}>
                        {getDeptDisplayName(d, i18n.language)}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value={user?.dept || ''}>{user?.dept || '—'}</option>
                )}
              </select>
              <select
                aria-label={t('reports.excel.dimension')}
                className={SELECT_CLS}
                value={dimension}
                onChange={(e) => setDimension(e.target.value as 'assignee' | 'reporter')}
              >
                <option value="assignee">{t('reports.excel.dimAssignee')}</option>
                <option value="reporter">{t('reports.excel.dimReporter')}</option>
              </select>
            </>
          )}
        </div>

        {mode === 'progress' && (
          <ExcelScopePicker
            scopeType={scopeType}
            depts={deptsQuery.data?.depts ?? []}
            directory={directoryQuery.data ?? []}
            currentUsername={user?.username ?? ''}
            currentDept={user?.dept ?? ''}
            selectedDepts={selectedDepts}
            selectedUsers={selectedUsers}
            extraKeyword={extraKeyword}
            onScopeChange={setScopeType}
            onToggleDept={toggleDept}
            onSetUsers={setSelectedUsers}
            onExtraKeywordChange={setExtraKeyword}
          />
        )}

        {mode === 'efficiency' && !tasksQuery.isLoading && !tasksQuery.isError && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricCard label={t('reports.excel.cols.total')} value={effDataset.totalAgg.total} />
            <MetricCard
              label={t('reports.excel.cols.rate')}
              value={formatRateText(effDataset.totalAgg.onTime, effDataset.totalAgg.total)}
            />
            <MetricCard
              label={t('reports.excel.cols.delayed')}
              value={effDataset.totalAgg.delayed}
            />
            <MetricCard label={t('reports.excel.cols.late')} value={effDataset.totalAgg.late} />
          </div>
        )}
      </section>

      {tasksQuery.isError ? (
        <InlineError
          status={toErrorStatus(tasksQuery.error)}
          onRetry={() => void tasksQuery.refetch()}
        />
      ) : (
        <DataTable
          data={effDataset.people}
          columns={columns}
          isLoading={tasksQuery.isLoading}
          keyExtractor={(row) => row.info.key}
          emptyMessage={t('reports.common.noTasks')}
          density="compact"
          enablePagination
          className="min-h-0 flex-1"
        />
      )}
    </div>
  )
}
