import * as React from 'react'
import { CalendarDays, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDeptDisplayName, useMetaDepts, useUserDirectory } from '@/hooks/use-meta'
import { getQuickDateRange } from '@/utils/date-range'
import { isSuperLike } from '@/utils/permissions'
import { useReportTasks } from '../api/queries'
import {
  buildPeriodicKpiDataset,
  buildUserLookup,
  exportPeriodicKpi8SheetWorkbook,
  getIsoWeekInfo,
  resolvePeriodicKpiRange,
  type PeriodicKpiCycle,
} from '../utils/periodic-kpi-domain'
import { PeriodicKpiPreview } from './PeriodicKpiPreview'

const CYCLES: readonly PeriodicKpiCycle[] = ['week', 'month', 'quarter', 'year', 'custom']
const WEEKS = Array.from({ length: 53 }, (_, i) => i + 1)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const QUARTERS = [1, 2, 3, 4] as const

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

export function PeriodicKpiTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const isSuper = isSuperLike(user)
  const deptsQuery = useMetaDepts()
  const directoryQuery = useUserDirectory()

  const now = new Date()
  const currentYear = now.getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)
  const initialCustom = getQuickDateRange('month', now)
  const initialIso = getIsoWeekInfo(now)

  const [cycle, setCycle] = React.useState<PeriodicKpiCycle>('month')
  const [year, setYear] = React.useState(currentYear)
  const [week, setWeek] = React.useState(initialIso.week)
  const [month, setMonth] = React.useState(now.getMonth() + 1)
  const [quarter, setQuarter] = React.useState(Math.floor(now.getMonth() / 3) + 1)
  const [customStart, setCustomStart] = React.useState(initialCustom.start)
  const [customEnd, setCustomEnd] = React.useState(initialCustom.end)
  const [dept, setDept] = React.useState('')
  const [isExporting, setIsExporting] = React.useState(false)

  const range = resolvePeriodicKpiRange({
    type: cycle,
    year,
    week,
    month,
    quarter,
    customStart,
    customEnd,
  })

  const flowQuery = useReportTasks(
    {
      purpose: 'kpi',
      start: range?.startStr ?? '',
      end: range?.endStr ?? '',
    },
    Boolean(range),
  )

  const kpiQuery = useReportTasks(
    {
      purpose: 'kpi',
      start: range?.startStr ?? '',
      end: range?.endStr ?? '',
      includeCycles: true,
      basis: 'final',
    },
    Boolean(range),
  )

  const userMap = buildUserLookup(directoryQuery.data ?? [])
  const dataset = range
    ? buildPeriodicKpiDataset({
        flowTasks: flowQuery.data ?? [],
        kpiTasks: kpiQuery.data ?? [],
        range,
        unit: isSuper ? dept : '',
        userMap,
      })
    : null

  const isLoading = flowQuery.isLoading || kpiQuery.isLoading
  const queryError = flowQuery.error ?? kpiQuery.error
  const hasError = flowQuery.isError || kpiQuery.isError

  const handleExport = async () => {
    if (!dataset || (dataset.created.length === 0 && dataset.kpiSummary.total === 0)) {
      onNotify(t('reports.common.exportEmpty'))
      return
    }
    setIsExporting(true)
    try {
      const selectedDeptObj = (deptsQuery.data?.depts ?? []).find((d) => d.value === dept)
      const scopeLabel =
        isSuper && selectedDeptObj
          ? getDeptDisplayName(selectedDeptObj, i18n.language)
          : isSuper
            ? t('reports.common.allDepartments')
            : user?.dept || ''
      await exportPeriodicKpi8SheetWorkbook(dataset, {
        author: user ? `${user.username} / ${user.fullname || user.username}` : '',
        scopeLabel,
      })
      onNotify(t('reports.common.exportSuccess'))
    } catch {
      onNotify(t('common.error'))
    }
    setIsExporting(false)
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto space-y-3">
      <section className="space-y-2.5 border-b border-border pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {CYCLES.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                aria-pressed={cycle === item}
                variant={cycle === item ? 'default' : 'outline'}
                onClick={() => setCycle(item)}
              >
                {t(`reports.kpi.cycles.${item}`)}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            disabled={!dataset || isLoading || isExporting}
            onClick={() => void handleExport()}
          >
            <Download className="size-4" aria-hidden="true" />
            <span>{t('reports.common.exportExcel')}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {cycle !== 'custom' && (
            <select
              aria-label={t('reports.kpi.yearLabel')}
              className={SELECT_CLS}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          {cycle === 'week' && (
            <select
              aria-label={t('reports.kpi.weekLabel')}
              className={SELECT_CLS}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
            >
              {WEEKS.map((w) => (
                <option key={w} value={w}>
                  {t('reports.kpi.weekOption', { week: w })}
                </option>
              ))}
            </select>
          )}

          {cycle === 'month' && (
            <select
              aria-label={t('reports.kpi.monthLabel')}
              className={SELECT_CLS}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {t('reports.kpi.monthOption', { month: m })}
                </option>
              ))}
            </select>
          )}

          {cycle === 'quarter' && (
            <select
              aria-label={t('reports.kpi.quarterLabel')}
              className={SELECT_CLS}
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          )}

          {cycle === 'custom' && (
            <>
              <Input
                type="date"
                aria-label={t('reports.common.startDate')}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <Input
                type="date"
                aria-label={t('reports.common.endDate')}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </>
          )}

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
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {range ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-primary">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              <span>
                {range.label}: {range.startStr} ~ {range.endStr}
              </span>
            </span>
          ) : (
            <span role="alert" className="font-medium text-destructive">
              {t('reports.kpi.rangeInvalid')}
            </span>
          )}
          <span className="text-muted-foreground">{t('reports.kpi.sheetsNote')}</span>
        </div>
      </section>

      {isLoading ? (
        <div role="status" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <span className="sr-only">{t('common.loading')}</span>
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 motion-safe:animate-pulse rounded-xl border border-border bg-secondary"
            />
          ))}
        </div>
      ) : hasError ? (
        <InlineError
          status={toErrorStatus(queryError)}
          onRetry={() => {
            void flowQuery.refetch()
            void kpiQuery.refetch()
          }}
        />
      ) : dataset ? (
        <PeriodicKpiPreview dataset={dataset} />
      ) : null}
    </div>
  )
}
