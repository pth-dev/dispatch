import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useAppStore } from '@/app/store'
import { getDeptDisplayName } from '@/features/tasks/api/meta'
import { useMetaDepts, useUserDirectory } from '@/features/tasks/api/queries'
import { parseKpiBriefSearchParams } from '@/schemas/kpi'
import { getUserDepts, isSuperLike } from '@/utils/permissions'
import { sameDept } from '@/utils/task-domain'
import { useKpiReportTasks } from '../api/queries'
import {
  aggregateBriefRows,
  buildBriefCaseList,
  buildBriefRows,
  getUserBriefKey,
  groupBriefPeople,
  isBriefStatusDone,
  matchesBriefView,
  type BriefCaseRow,
  type BriefFinishedFilter,
  type BriefStatus,
  type BriefView,
  type BriefYear,
} from '../utils/kpi-brief-domain'
import {
  copyBriefBoardTsv,
  exportBriefPeopleCsv,
  exportBriefUnfinishedCsv,
  formatShortDateTime,
} from '../utils/kpi-export'
import { useKpiNotice } from './use-kpi-notice'

const AUTO_REFRESH_MS = 3 * 60 * 1000

export function useKpiBriefBoard() {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const [searchParams] = useSearchParams()
  const { notice, showNotice } = useKpiNotice()

  const initialParams = parseKpiBriefSearchParams(searchParams)
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear + 1; y >= currentYear - 5; y--) years.push(y)

  const [year, setYear] = React.useState<BriefYear>(() => initialParams.year ?? currentYear)
  const [month, setMonth] = React.useState<number>(() => initialParams.month ?? 0)
  const [personKey, setPersonKey] = React.useState<string>(() =>
    initialParams.person ? `u:${initialParams.person.toLowerCase()}` : '',
  )
  const [view, setView] = React.useState<BriefView>(() => {
    if (initialParams.view) return initialParams.view as BriefView
    return isSuperLike(user) && !user?.dept ? 'all' : 'dept'
  })
  const [statusFilter, setStatusFilter] = React.useState<BriefStatus | ''>('')
  const [finFilter, setFinFilter] = React.useState<BriefFinishedFilter>('')
  const [selectedFinished, setSelectedFinished] = React.useState<BriefCaseRow | null>(null)

  const deptsQuery = useMetaDepts()
  const directoryQuery = useUserDirectory()
  const tasksQuery = useKpiReportTasks({
    start: year === 'all' ? undefined : `${year}-01-01`,
    end: year === 'all' ? undefined : `${year}-12-31`,
    basis: 'final',
    includeCycles: true,
    refetchInterval: AUTO_REFRESH_MS,
  })

  const depts = deptsQuery.data?.allDepts ?? deptsQuery.data?.depts ?? []
  const directory = directoryQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const meKey = getUserBriefKey(user)

  function resolveDeptLabel(raw: string): string {
    const found = depts.find((d) => sameDept(d.value, raw))
    return found ? getDeptDisplayName(found, i18n.language) : raw
  }

  const myDeptsLabel = getUserDepts(user).map(resolveDeptLabel).join(' / ')
  const viewOptions: { value: BriefView; label: string }[] = [
    {
      value: 'dept',
      label: myDeptsLabel
        ? t('kpiBrief.views.deptWithName', { dept: myDeptsLabel })
        : t('kpiBrief.views.dept'),
    },
    { value: 'me', label: t('kpiBrief.views.me') },
  ]
  if (isSuperLike(user)) {
    viewOptions.push({ value: 'all', label: t('kpiBrief.views.all') })
    for (const d of depts) {
      viewOptions.push({
        value: `d:${d.value}`,
        label: getDeptDisplayName(d, i18n.language),
      })
    }
  }

  const allRows = buildBriefRows(tasks, directory, year, t('kpiBrief.unassigned'))
  const inViewRows = allRows.filter((r) => matchesBriefView(r, view, user))

  const monthCounts: Record<number, number> = {}
  for (const r of inViewRows) {
    monthCounts[r.month] = (monthCounts[r.month] ?? 0) + 1
  }

  const viewMonthRows = month === 0 ? inViewRows : inViewRows.filter((r) => r.month === month)
  const peopleByName = groupBriefPeople(viewMonthRows).sort((a, b) =>
    a.fullname.localeCompare(b.fullname),
  )
  const peopleByRate = [...peopleByName].sort(
    (a, b) => b.rate - a.rate || b.total - a.total || a.fullname.localeCompare(b.fullname),
  )
  const effectivePersonKey =
    personKey && peopleByName.some((p) => p.key === personKey) ? personKey : ''
  const boardRows = effectivePersonKey
    ? viewMonthRows.filter((r) => r.key === effectivePersonKey)
    : viewMonthRows

  const allViewAgg = aggregateBriefRows(viewMonthRows)
  const boardAgg = aggregateBriefRows(boardRows)
  const unfinishedCases = buildBriefCaseList(boardRows, 'unfinished', { statusFilter })
  const allFinishedRows = boardRows.filter((r) => isBriefStatusDone(r.status))
  const finishedCounts = {
    total: new Set(allFinishedRows.map((r) => r.tkey)).size,
    ontime: new Set(allFinishedRows.filter((r) => r.status === 'ontime').map((r) => r.tkey)).size,
    late: new Set(allFinishedRows.filter((r) => r.status === 'late').map((r) => r.tkey)).size,
  }
  const finishedCases = buildBriefCaseList(boardRows, 'finished', { finFilter })

  const yearLabel =
    year === 'all' ? t('kpiBrief.filters.allYears') : t('kpiBrief.filters.yearItem', { year })
  const monthLabel =
    month === 0 ? t('kpiBrief.filters.allMonths') : t('kpiBrief.filters.monthShort', { month })
  const activeViewLabel =
    viewOptions.find((o) => o.value === view)?.label ?? t('kpiBrief.views.dept')
  const selectedPersonName =
    peopleByName.find((p) => p.key === effectivePersonKey)?.fullname ?? ''
  const scopeSubtitle = `${monthLabel} · ${selectedPersonName || activeViewLabel}`
  const syncedLabel = tasksQuery.dataUpdatedAt
    ? t('kpiBrief.syncedAt', { time: formatShortDateTime(new Date(tasksQuery.dataUpdatedAt)) })
    : ''

  function handleViewChange(next: BriefView) {
    setView(next)
    setPersonKey('')
    setStatusFilter('')
  }

  function handleYearChange(next: BriefYear) {
    setYear(next)
    setStatusFilter('')
  }

  function handleMonthChange(next: number) {
    setMonth(next)
    setStatusFilter('')
  }

  function handleTogglePerson(key: string) {
    setPersonKey((prev) => (prev === key && key ? '' : key))
  }

  async function handleCopyTsv() {
    if (peopleByRate.length === 0) {
      showNotice('error', t('kpi.toast.noData'))
      return
    }
    const ok = await copyBriefBoardTsv(
      peopleByRate,
      allViewAgg,
      `${yearLabel} ${monthLabel}`,
      activeViewLabel,
      resolveDeptLabel,
      t,
    )
    showNotice(
      ok ? 'success' : 'error',
      ok ? t('kpi.toast.copied', { count: peopleByRate.length }) : t('kpi.toast.copyFailed'),
    )
  }

  function handleExportPeopleCsv() {
    if (peopleByRate.length === 0) {
      showNotice('error', t('kpi.toast.noData'))
      return
    }
    exportBriefPeopleCsv(peopleByRate, String(year), String(month || 'all'), resolveDeptLabel, t)
    showNotice('success', t('kpi.toast.exported'))
  }

  function handleExportUnfinishedCsv() {
    if (unfinishedCases.length === 0) {
      showNotice('error', t('kpi.toast.noData'))
      return
    }
    exportBriefUnfinishedCsv(
      unfinishedCases,
      String(year),
      String(month || 'all'),
      (s) => t(`kpiBrief.status.${s}`),
      t,
    )
    showNotice('success', t('kpi.toast.exported'))
  }

  async function handleRefresh() {
    await Promise.all([tasksQuery.refetch(), directoryQuery.refetch()])
    showNotice('success', t('kpi.toast.refreshed'))
  }

  return {
    user,
    notice,
    years,
    year,
    month,
    view,
    viewOptions,
    statusFilter,
    setStatusFilter,
    finFilter,
    setFinFilter,
    selectedFinished,
    setSelectedFinished,
    directory,
    meKey,
    tasksQuery,
    monthCounts,
    peopleByName,
    peopleByRate,
    effectivePersonKey,
    allViewAgg,
    boardAgg,
    unfinishedCases,
    finishedCases,
    finishedCounts,
    monthLabel,
    selectedPersonName,
    scopeSubtitle,
    syncedLabel,
    resolveDeptLabel,
    handleViewChange,
    handleYearChange,
    handleMonthChange,
    handleTogglePerson,
    handleCopyTsv,
    handleExportPeopleCsv,
    handleExportUnfinishedCsv,
    handleRefresh,
  }
}
