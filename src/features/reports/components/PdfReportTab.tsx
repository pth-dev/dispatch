import * as React from 'react'
import { Printer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { StatusText } from '@/components/ui/status-text'
import type { RawReport, RawTask } from '@/schemas/task'
import { resolveApiErrorMessage } from '@/services'
import { deriveTaskStatus, isTaskPaused } from '@/utils/task-domain'
import { formatLocalDateInput, getQuickDateRange } from '@/utils/date-range'
import { fetchTaskReportsForPdf, useReportTasks } from '../api/queries'

const SELECT_CLS =
  'h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30'

type PrintEntry = { task: RawTask; reports: RawReport[] }

export function PdfReportTab({ onNotify }: { onNotify: (msg: string) => void }) {
  const { t, i18n } = useTranslation()
  const monthRange = getQuickDateRange('month')
  const [unlimited, setUnlimited] = React.useState(false)
  const [startDate, setStartDate] = React.useState(monthRange.start || formatLocalDateInput())
  const [endDate, setEndDate] = React.useState(monthRange.end || formatLocalDateInput())
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set())
  const [isPreparing, setIsPreparing] = React.useState(false)
  const [printEntries, setPrintEntries] = React.useState<PrintEntry[]>([])

  const tasksQuery = useReportTasks({
    purpose: 'pdf',
    start: unlimited ? '' : startDate,
    end: unlimited ? '' : endDate,
  })

  const filtered = (tasksQuery.data ?? []).filter((task) => {
    if (statusFilter === 'paused' && !isTaskPaused(task)) return false
    if (statusFilter !== 'all' && statusFilter !== 'paused' && deriveTaskStatus(task) !== statusFilter) {
      return false
    }
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      String(task.id).includes(q) ||
      task.title.toLowerCase().includes(q) ||
      (task.assign_person ?? '').toLowerCase().includes(q)
    )
  })

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
      const entries = await Promise.all(
        picked.map(async (task) => ({
          task,
          reports: await fetchTaskReportsForPdf(task.id).catch(() => []),
        })),
      )
      setPrintEntries(entries)
      window.setTimeout(() => window.print(), 100)
    } catch (error) {
      onNotify(resolveApiErrorMessage(error, t, i18n.language))
    }
    setIsPreparing(false)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 space-y-3 print:hidden">
        <p className="text-xs text-muted-foreground">{t('reports.pdf.description')}</p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
            <option value="in_progress">{t('status.in_progress')}</option>
            <option value="delayed_pending">{t('status.delayed_pending')}</option>
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-foreground">
            <Checkbox
              checked={unlimited}
              onCheckedChange={(v) => setUnlimited(Boolean(v))}
            />
            <span>{t('reports.common.unlimitedDate')}</span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t('reports.common.selectedCount', { count: selectedIds.size, total: filtered.length })}
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
              disabled={selectedIds.size === 0 || isPreparing}
              onClick={() => void handlePrint()}
            >
              <Printer className="size-4" aria-hidden="true" />
              <span>{isPreparing ? t('reports.common.loadingReports') : t('reports.common.printPdf')}</span>
            </Button>
          </div>
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
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground print:hidden">
          {t('reports.common.noTasks')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card print:hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-left text-xs font-semibold text-primary">
                <th className="w-10 px-3 py-2">
                  <span className="sr-only">{t('reports.common.selectAll')}</span>
                </th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">{t('tasks.columns.title')}</th>
                <th className="px-3 py-2">{t('common.assignee')}</th>
                <th className="px-3 py-2">{t('common.dueDate')}</th>
                <th className="px-3 py-2">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-secondary/50">
                  <td className="px-3 py-2 text-center">
                    <Checkbox
                      aria-label={`#${task.id}`}
                      checked={selectedIds.has(task.id)}
                      onCheckedChange={() => toggleId(task.id)}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-primary">#{task.id}</td>
                  <td className="px-3 py-2 text-foreground">{task.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">{task.assign_person || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{task.due_date || '—'}</td>
                  <td className="px-3 py-2">
                    <StatusText status={deriveTaskStatus(task)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printEntries.length > 0 && (
        <div className="hidden print:block space-y-6">
          <h2 className="text-lg font-semibold text-foreground">{t('reports.pdf.printTitle')}</h2>
          {printEntries.map(({ task, reports }) => (
            <article key={task.id} className="break-inside-avoid border-b border-border pb-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                #{task.id} — {task.title} ({task.progress}%)
              </h3>
              <p className="text-xs text-muted-foreground">
                {task.assigned_unit} · {task.assign_person} · {task.due_date}
              </p>
              <div className="space-y-1.5 pl-3">
                <div className="text-xs font-semibold text-foreground">{t('reports.pdf.historyTitle')}</div>
                {reports.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('reports.pdf.noHistory')}</p>
                ) : (
                  reports.map((rep) => (
                    <div key={rep.id} className="text-xs text-foreground">
                      <strong>{rep.createdAt}</strong> ({rep.fullname || rep.username} · {rep.progress}%):{' '}
                      {rep.content}
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
