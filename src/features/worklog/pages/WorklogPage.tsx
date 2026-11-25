import * as React from 'react'
import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, PageContainer, PageHeader, toErrorStatus } from '@/components/layout'
import { MetricCard } from '@/components/ui/metric-card'
import { isSuperLike } from '@/utils/permissions'
import { useWorkRecords, useWorklogUsers } from '../api/queries'
import { WorklogDayGroup } from '../components/WorklogDayGroup'
import { WorklogFilterBar } from '../components/WorklogFilterBar'
import {
  exportWorklogExcel,
  formatLocalDateInput,
  getWorklogQuickRange,
  groupWorkRecordsByDate,
  type WorklogQuickRange,
} from '../utils/worklog-domain'

export function WorklogPage() {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)
  const isSuper = isSuperLike(user)
  const canSelectUser = isSuper || user?.role === 'admin'

  const today = formatLocalDateInput()
  const [selectedUser, setSelectedUser] = React.useState(user?.username ?? '')
  const [startDate, setStartDate] = React.useState(today)
  const [endDate, setEndDate] = React.useState(today)
  const [activeQuick, setActiveQuick] = React.useState<WorklogQuickRange | null>('today')
  const [applied, setApplied] = React.useState({
    user: user?.username ?? '',
    start: today,
    end: today,
  })
  const [isExporting, setIsExporting] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)

  const effectiveUser = selectedUser || user?.username || ''
  const effectiveAppliedUser = applied.user || user?.username || ''
  const rangeInvalid = Boolean(startDate && endDate && startDate > endDate)

  const usersQuery = useWorklogUsers(canSelectUser)
  const recordsQuery = useWorkRecords(
    { user: effectiveAppliedUser, start: applied.start, end: applied.end },
    !rangeInvalid,
  )

  const summary = groupWorkRecordsByDate(recordsQuery.data ?? [])

  const handleQuickSelect = (range: WorklogQuickRange) => {
    const next = getWorklogQuickRange(range)
    setStartDate(next.start)
    setEndDate(next.end)
    setActiveQuick(range)
    setApplied({ user: effectiveUser, start: next.start, end: next.end })
  }

  const handleSearch = () => {
    if (rangeInvalid) return
    setApplied({ user: effectiveUser, start: startDate, end: endDate })
  }

  const handleExport = async () => {
    const rows = recordsQuery.data ?? []
    if (rows.length === 0) {
      setNotice(t('worklog.exportEmpty'))
      return
    }
    setIsExporting(true)
    try {
      await exportWorklogExcel(rows, applied.start, applied.end)
      setNotice(t('worklog.exportSuccess'))
    } catch {
      setNotice(t('common.error'))
    }
    setIsExporting(false)
  }

  return (
    <PageContainer className="space-y-4">
      <PageHeader title={t('worklog.title')} subtitle={t('worklog.subtitle')} />

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{t('worklog.kpiNotice')}</span>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs text-foreground"
        >
          <span>{notice}</span>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => setNotice(null)}
          >
            {t('common.close')}
          </button>
        </div>
      )}

      <WorklogFilterBar
        canSelectUser={canSelectUser}
        isSuper={isSuper}
        users={usersQuery.data ?? []}
        selectedUser={effectiveUser}
        startDate={startDate}
        endDate={endDate}
        activeQuick={activeQuick}
        rangeInvalid={rangeInvalid}
        hasRecords={(recordsQuery.data?.length ?? 0) > 0}
        isExporting={isExporting}
        onUserChange={(nextUser) => {
          setSelectedUser(nextUser)
          setApplied({ user: nextUser, start: startDate, end: endDate })
        }}
        onStartChange={(val) => {
          setStartDate(val)
          setActiveQuick(null)
        }}
        onEndChange={(val) => {
          setEndDate(val)
          setActiveQuick(null)
        }}
        onQuickSelect={handleQuickSelect}
        onSearch={handleSearch}
        onExport={() => void handleExport()}
      />

      {recordsQuery.isLoading ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">{t('common.loading')}</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-24 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-24 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-24 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
          </div>
          <div className="h-48 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
        </div>
      ) : recordsQuery.isError ? (
        <InlineError
          status={toErrorStatus(recordsQuery.error)}
          onRetry={() => void recordsQuery.refetch()}
        />
      ) : summary.totalRecords === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('worklog.empty')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard label={t('worklog.stats.records')} value={summary.totalRecords} />
            <MetricCard label={t('worklog.stats.tasks')} value={summary.uniqueTasks} />
            <MetricCard label={t('worklog.stats.days')} value={summary.activeDays} />
          </div>

          <div className="space-y-4">
            {summary.groups.map((bucket) => (
              <WorklogDayGroup key={bucket.date} bucket={bucket} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  )
}

export default WorklogPage
