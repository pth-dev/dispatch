import * as React from 'react'
import { Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { StatusText } from '@/components/ui/status-text'
import type { RawTask } from '@/schemas/task'
import { resolveApiErrorMessage } from '@/services'
import {
  formatLocalDateInput,
  getQuickDateRange,
  type QuickDateRange,
} from '@/utils/date-range'
import {
  deriveTaskStatus,
  isTaskCompleted,
  isTaskPaused,
  parseReqDepts,
} from '@/utils/task-domain'
import { fetchTaskReportsForPdf, useReportTasks } from '../api/queries'
import { PdfPrintSheet, type PdfPrintEntry } from './PdfPrintSheet'

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

const QUICK_RANGES: readonly Exclude<QuickDateRange, 'today'>[] = [
  'week',
  'month',
  'quarter',
  'year',
]

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const idx = nextIndex++
      const item = items[idx]
      if (item !== undefined) {
        results[idx] = await worker(item)
      }
    }
  })
  await Promise.all(runners)
  return results
}

function matchesPdfStatus(task: RawTask, statusFilter: string): boolean {
  if (statusFilter === 'all') return true
  if (statusFilter === 'incomplete') return !isTaskCompleted(task)
  if (statusFilter === 'completed') return isTaskCompleted(task)
  if (statusFilter === 'paused') return isTaskPaused(task)
  return deriveTaskStatus(task) === statusFilter
}

export function PdfReportTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const user = useAppStore((s) => s.user)
  const monthRange = getQuickDateRange('month')
  const [unlimited, setUnlimited] = React.useState(false)
  const [startDate, setStartDate] = React.useState(monthRange.start || formatLocalDateInput())
  const [endDate, setEndDate] = React.useState(monthRange.end || formatLocalDateInput())
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set())
  const [isPreparing, setIsPreparing] = React.useState(false)
  const [printEntries, setPrintEntries] = React.useState<PdfPrintEntry[]>([])

  const tasksQuery = useReportTasks({
    purpose: 'pdf',
    start: unlimited ? '' : startDate,
    end: unlimited ? '' : endDate,
  })

  const filtered = (tasksQuery.data ?? [])
    .filter((task) => {
      if (!matchesPdfStatus(task, statusFilter)) return false
      const q = search.trim().replace(/^#/, '').toLowerCase()
      if (!q) return true
      const reqText = parseReqDepts(task.req_depts, task.req_dept).join(' ').toLowerCase()
      return (
        String(task.id).includes(q) ||
        task.title.toLowerCase().includes(q) ||
        (task.title_vn ?? '').toLowerCase().includes(q) ||
        (task.assign_person ?? '').toLowerCase().includes(q) ||
        (task.assigned_unit ?? '').toLowerCase().includes(q) ||
        reqText.includes(q) ||
        (task.task_type ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => b.id - a.id)

  const handleQuickRange = (range: Exclude<QuickDateRange, 'today'>) => {
    const next = getQuickDateRange(range)
    setUnlimited(false)
    setStartDate(next.start)
    setEndDate(next.end)
  }

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handlePrint = async () => {
    const picked = filtered.filter((task) => selectedIds.has(task.id))
    if (picked.length === 0) {
      onNotify(t('reports.common.exportEmpty'))
      return
    }
    setIsPreparing(true)
    try {
      const entries = await mapWithConcurrency(picked, 6, async (task) => {
        const list = await fetchTaskReportsForPdf(task.id).catch(() => [])
        return { task, reports: [...list].reverse() }
      })
      setPrintEntries(entries)
      window.setTimeout(() => window.print(), 120)
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
    setIsPreparing(false)
  }

  const columns: ColumnDef<RawTask, unknown>[] = [
    {
      id: 'select',
      header: () => <span className="sr-only">{t('reports.common.selectAll')}</span>,
      meta: { width: '48px', minWidth: '48px', align: 'center' },
      cell: ({ row }) => (
        <Checkbox
          aria-label={`#${row.original.id} ${row.original.title}`}
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleId(row.original.id)}
        />
      ),
    },
    {
      id: 'id',
      header: 'ID',
      meta: { width: '76px', minWidth: '72px' },
      cell: ({ row }) => <span className="font-medium text-primary">#{row.original.id}</span>,
    },
    {
      id: 'title',
      header: t('tasks.columns.title'),
      meta: { minWidth: '220px' },
      cell: ({ row }) => <span className="text-foreground">{row.original.title}</span>,
    },
    {
      id: 'dept',
      header: t('common.department'),
      meta: { minWidth: '120px' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.assigned_unit || '—'}</span>
      ),
    },
    {
      id: 'assignee',
      header: t('common.assignee'),
      meta: { minWidth: '130px' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.assign_person || '—'}</span>
      ),
    },
    {
      id: 'progress',
      header: t('worklog.progress'),
      meta: { align: 'right', minWidth: '72px' },
      cell: ({ row }) => (
        <span className={row.original.progress === 100 ? 'font-semibold text-success' : 'text-primary'}>
          {row.original.progress}%
        </span>
      ),
    },
    {
      id: 'due',
      header: t('common.dueDate'),
      meta: { minWidth: '124px' },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.due_date || '—'}</span>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      meta: { minWidth: '124px' },
      cell: ({ row }) => <StatusText status={deriveTaskStatus(row.original)} />,
    },
  ]

  const authorLabel = user
    ? `${user.username} / ${user.fullname || user.username} (${[user.dept, user.site].filter(Boolean).join(' / ')})`
    : ''
  const rangeLabel = unlimited
    ? t('reports.common.unlimitedDate')
    : `${startDate} ~ ${endDate}`

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <section className="shrink-0 space-y-2 print:hidden">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="date"
            aria-label={t('reports.common.startDate')}
            disabled={unlimited}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            aria-label={t('reports.common.endDate')}
            disabled={unlimited}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <select
            aria-label={t('reports.common.status')}
            className={SELECT_CLS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('status.all')}</option>
            <option value="incomplete">{t('status.incomplete')}</option>
            <option value="delayed_pending">{t('status.delayed_pending')}</option>
            <option value="completed">{t('status.completed')}</option>
            <option value="completed_ontime">{t('status.completed_ontime')}</option>
            <option value="late_completed">{t('status.late_completed')}</option>
            <option value="paused">{t('status.paused')}</option>
          </select>
          <Input
            type="search"
            aria-label={t('reports.common.search')}
            placeholder={t('reports.common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-foreground">
              <Checkbox
                checked={unlimited}
                onCheckedChange={(v) => setUnlimited(Boolean(v))}
              />
              <span>{t('reports.common.unlimitedDate')}</span>
            </label>
            <div className="flex flex-wrap items-center gap-1">
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t('reports.common.selectedCount', {
                count: filtered.filter((item) => selectedIds.has(item.id)).length,
                total: filtered.length,
              })}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set(filtered.map((item) => item.id)))}
            >
              {t('reports.common.selectAll')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
            >
              {t('reports.common.clearSelection')}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={filtered.every((item) => !selectedIds.has(item.id)) || isPreparing}
              onClick={() => void handlePrint()}
            >
              <Printer className="size-4" aria-hidden="true" />
              <span>{isPreparing ? t('reports.common.loadingReports') : t('reports.common.printPdf')}</span>
            </Button>
          </div>
        </div>
      </section>

      {tasksQuery.isError ? (
        <InlineError
          status={toErrorStatus(tasksQuery.error)}
          onRetry={() => void tasksQuery.refetch()}
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          isLoading={tasksQuery.isLoading}
          keyExtractor={(task) => String(task.id)}
          emptyMessage={t('reports.common.noTasks')}
          density="compact"
          enablePagination
          className="min-h-0 flex-1 print:hidden"
        />
      )}

      <PdfPrintSheet entries={printEntries} author={authorLabel} rangeLabel={rangeLabel} />
    </div>
  )
}
