import * as React from 'react'
import { Award, Copy, Download, LayoutPanelTop, Printer, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { useAppStore } from '@/app/store'
import { InlineError, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { APP_ROUTES } from '@/constants/app-routes'
import { getDeptDisplayName } from '@/features/tasks/api/meta'
import { useMetaDepts, useUserDirectory } from '@/features/tasks/api/queries'
import { parseKpiPeopleSearchParams } from '@/schemas/kpi'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import { canReadMenu, isSuperLike } from '@/utils/permissions'
import { sameDept } from '@/utils/task-domain'
import { useKpiReportTasks } from '../api/queries'
import { KpiPeopleFilters } from '../components/KpiPeopleFilters'
import { KpiPeoplePrintSheet } from '../components/KpiPeoplePrintSheet'
import { KpiPeopleSummaryCards } from '../components/KpiPeopleSummaryCards'
import { KpiPeopleTable } from '../components/KpiPeopleTable'
import { useKpiNotice } from '../hooks/use-kpi-notice'
import {
  copyPeopleKpiTsv,
  exportPeopleKpiCsv,
  exportPeopleKpiDetailsCsv,
} from '../utils/kpi-export'
import {
  computePeopleKpi,
  computePeopleKpiSummary,
  filterAndSortPeopleKpi,
  getKpiTaskKey,
  getPeriodDateRange,
  getScopedKpiPeople,
  type KpiBasis,
  type KpiQuickRange,
  type KpiSortKey,
} from '../utils/kpi-people-domain'

export default function KpiPeoplePage() {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const [searchParams] = useSearchParams()
  const { notice, showNotice } = useKpiNotice()

  const initialParams = parseKpiPeopleSearchParams(searchParams)
  const [startStr, setStartStr] = React.useState(
    () => initialParams.start || getPeriodDateRange('month').start,
  )
  const [endStr, setEndStr] = React.useState(
    () => initialParams.end || getPeriodDateRange('month').end,
  )
  const [basis, setBasis] = React.useState<KpiBasis>(() => initialParams.basis ?? 'final')
  const [query, setQuery] = React.useState(() => initialParams.q ?? '')
  const deferredQuery = React.useDeferredValue(query)
  const [deptOverride, setDeptOverride] = React.useState<string | null>(
    () => initialParams.dept ?? null,
  )
  const [sort, setSort] = React.useState<KpiSortKey>('score')
  const [showEmpty, setShowEmpty] = React.useState(false)
  const [printWithDetail, setPrintWithDetail] = React.useState(false)
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(() => new Set())
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(() => new Set())

  const deptsQuery = useMetaDepts()
  const directoryQuery = useUserDirectory()
  const isRangeInvalid = Boolean(startStr && endStr && startStr > endStr)
  const tasksQuery = useKpiReportTasks({
    start: startStr,
    end: endStr,
    basis,
    includeCycles: true,
    enabled: !isRangeInvalid,
  })

  const depts = deptsQuery.data?.allDepts ?? deptsQuery.data?.depts ?? []
  const directory = directoryQuery.data ?? []
  const tasks = tasksQuery.data ?? []

  const defaultDept =
    !user || isSuperLike(user) || !user.dept
      ? ''
      : (depts.find((d) => sameDept(d.value, user.dept))?.value ?? '')

  const activeDept = deptOverride !== null ? deptOverride : defaultDept

  function resolveDeptLabel(raw: string): string {
    const found = depts.find((d) => sameDept(d.value, raw))
    return found ? getDeptDisplayName(found, i18n.language) : raw
  }

  const scopedPeople = getScopedKpiPeople(user, directory)
  const taskMap = new Map<string, RawTask>()
  for (const item of tasks) {
    taskMap.set(getKpiTaskKey(item), item)
  }

  const allRows = computePeopleKpi(tasks, {
    startStr,
    endStr,
    basis,
    people: scopedPeople,
    directory,
  })
  const visibleRows = filterAndSortPeopleKpi(allRows, {
    query: deferredQuery,
    dept: activeDept,
    showEmpty,
    sort,
  })
  const summary = computePeopleKpiSummary(visibleRows)
  const selectedRows = visibleRows.filter((r) => selectedKeys.has(r.key))
  const exportTargetRows = selectedRows.length > 0 ? selectedRows : visibleRows

  function handleQuickRange(range: KpiQuickRange) {
    const r = getPeriodDateRange(range)
    setBasis('final')
    setStartStr(r.start)
    setEndStr(r.end)
  }

  function handleReset() {
    setQuery('')
    setSort('score')
    setShowEmpty(false)
    setDeptOverride(null)
    handleQuickRange('month')
  }

  function handleToggleSelect(key: string, checked: boolean) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function handleSelectAllVisible(checked: boolean) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      for (const r of visibleRows) {
        if (checked) next.add(r.key)
        else next.delete(r.key)
      }
      return next
    })
  }

  function handleToggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handlePrint() {
    if (selectedRows.length === 0) {
      showNotice('error', t('kpi.toast.selectToPrint'))
      return
    }
    window.print()
  }

  function handleExportSummary() {
    if (exportTargetRows.length === 0) {
      showNotice('error', t('kpi.toast.noData'))
      return
    }
    exportPeopleKpiCsv(exportTargetRows, startStr, endStr, resolveDeptLabel, t)
    showNotice('success', t('kpi.toast.exported'))
  }

  function handleExportDetails() {
    if (exportTargetRows.length === 0) {
      showNotice('error', t('kpi.toast.noData'))
      return
    }
    exportPeopleKpiDetailsCsv(exportTargetRows, taskMap, basis, startStr, endStr, t)
    showNotice('success', t('kpi.toast.exported'))
  }

  async function handleCopyTsv() {
    if (exportTargetRows.length === 0) {
      showNotice('error', t('kpi.toast.noData'))
      return
    }
    const ok = await copyPeopleKpiTsv(exportTargetRows, resolveDeptLabel, t)
    showNotice(
      ok ? 'success' : 'error',
      ok ? t('kpi.toast.copied', { count: exportTargetRows.length }) : t('kpi.toast.copyFailed'),
    )
  }

  async function handleRefresh() {
    if (isRangeInvalid) {
      showNotice('error', t('kpi.toast.invalidRange'))
      return
    }
    await Promise.all([tasksQuery.refetch(), directoryQuery.refetch()])
    showNotice('success', t('kpi.toast.refreshed'))
  }

  const scopeDesc = isSuperLike(user)
    ? t('kpi.scopeAll')
    : t('kpi.scopeDept', { dept: user?.dept ? resolveDeptLabel(user.dept) : '-' })
  const activeDeptLabel = activeDept ? resolveDeptLabel(activeDept) : t('kpi.filters.allDepts')

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <PageHeader
          title={t('kpi.title')}
          subtitle={scopeDesc}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleRefresh()}
                disabled={tasksQuery.isFetching}
              >
                <RefreshCw
                  className={cn('size-4', tasksQuery.isFetching && 'animate-spin')}
                  aria-hidden="true"
                />
                {t('kpi.actions.refresh')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="size-4" aria-hidden="true" />
                {t('kpi.actions.print')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Download className="size-4" aria-hidden="true" />
                    {t('kpi.actions.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportSummary}>
                    <Download className="mr-2 size-4" aria-hidden="true" />
                    {t('kpi.actions.exportSummaryCsv')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportDetails}>
                    <Award className="mr-2 size-4" aria-hidden="true" />
                    {t('kpi.actions.exportDetailsCsv')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleCopyTsv()}>
                    <Copy className="mr-2 size-4" aria-hidden="true" />
                    {t('kpi.actions.copyTsv')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {canReadMenu(user, 'kpi_brief') && (
                <Button asChild size="sm">
                  <Link to={APP_ROUTES.KPI_BRIEF}>
                    <LayoutPanelTop className="size-4" aria-hidden="true" />
                    {t('kpi.actions.openBrief')}
                  </Link>
                </Button>
              )}
            </div>
          }
        />
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'rounded-lg border px-3.5 py-2 text-xs font-medium print:hidden',
            notice.tone === 'error'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-success/30 bg-success/10 text-success',
          )}
        >
          {notice.message}
        </div>
      )}

      <KpiPeopleFilters
        query={query}
        dept={activeDept}
        startStr={startStr}
        endStr={endStr}
        basis={basis}
        sort={sort}
        showEmpty={showEmpty}
        printWithDetail={printWithDetail}
        depts={depts}
        scopedPeople={scopedPeople}
        onQueryChange={setQuery}
        onDeptChange={setDeptOverride}
        onStartChange={setStartStr}
        onEndChange={setEndStr}
        onBasisChange={setBasis}
        onSortChange={setSort}
        onQuickRange={handleQuickRange}
        onShowEmptyChange={setShowEmpty}
        onPrintWithDetailChange={setPrintWithDetail}
        onReset={handleReset}
      />

      {isRangeInvalid ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {t('kpi.toast.invalidRange')}
        </div>
      ) : tasksQuery.isError ? (
        <InlineError status="500" onRetry={() => void tasksQuery.refetch()} />
      ) : tasksQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <KpiPeopleSummaryCards summary={summary} />
          <KpiPeopleTable
            rows={visibleRows}
            taskMap={taskMap}
            basis={basis}
            selectedKeys={selectedKeys}
            expandedKeys={expandedKeys}
            resolveDeptLabel={resolveDeptLabel}
            onToggleSelect={handleToggleSelect}
            onSelectAllVisible={handleSelectAllVisible}
            onToggleExpand={handleToggleExpand}
          />
          <KpiPeoplePrintSheet
            rows={selectedRows}
            taskMap={taskMap}
            basis={basis}
            startStr={startStr}
            endStr={endStr}
            deptLabel={activeDeptLabel}
            query={deferredQuery}
            withDetail={printWithDetail}
            user={user}
            resolveDeptLabel={resolveDeptLabel}
          />
        </>
      )}
    </div>
  )
}
