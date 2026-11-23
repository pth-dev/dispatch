import * as React from 'react'
import { Grid3X3, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Sparkline } from '@/components/ui/sparkline'
import type { PostStatsResponse, PostStatsSeries } from '@/schemas/dashboard'
import { cn } from '@/utils/cn'
import { formatPostBucketLabel } from '../utils/dashboard-domain'

interface DeptPeopleHeatmapTableProps {
  data: PostStatsResponse | undefined
}

function heatCellClass(value: number, maxVal: number): string {
  if (value <= 0) return 'text-muted-foreground/40'
  const ratio = value / Math.max(1, maxVal)
  if (ratio > 0.75) return 'bg-primary text-primary-foreground'
  if (ratio > 0.5) return 'bg-primary/70 text-primary-foreground'
  if (ratio > 0.25) return 'bg-primary/30 text-foreground'
  return 'bg-primary-soft text-primary'
}

function HeatmapPersonRow({
  series,
  labels,
  maxVal,
}: {
  series: PostStatsSeries
  labels: readonly string[]
  maxVal: number
}) {
  const n = labels.length
  const last = series.data[n - 1] ?? 0
  const prev = n > 1 ? (series.data[n - 2] ?? 0) : 0
  const diff = last - prev
  const avg = n > 0 ? Math.round((series.total / n) * 10) / 10 : 0

  return (
    <tr className="hover:bg-secondary/40">
      <td className="sticky left-0 z-10 bg-card px-2.5 py-1.5 font-medium text-foreground whitespace-nowrap">
        {series.label}
      </td>
      <td className="px-2 py-1.5 text-right font-semibold text-primary tabular-nums">
        {series.total}
      </td>
      <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">{avg}</td>
      <td
        className={cn(
          'px-2 py-1.5 text-right font-medium tabular-nums whitespace-nowrap',
          diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {last}
        {diff !== 0 ? (diff > 0 ? ` ▲${diff}` : ` ▼${Math.abs(diff)}`) : ''}
      </td>
      <td className="px-2 py-1.5">
        <Sparkline data={series.data} />
      </td>
      {labels.map((label, i) => {
        const val = series.data[i] ?? 0
        return (
          <td key={`${label}-${i}`} className="px-0.5 py-1 text-center">
            <span
              title={`${series.label} · ${label}: ${val}`}
              className={cn(
                'inline-block min-w-6 rounded px-1 py-0.5 text-[11px] font-medium tabular-nums',
                heatCellClass(val, maxVal),
              )}
            >
              {val}
            </span>
          </td>
        )
      })}
    </tr>
  )
}

export function DeptPeopleHeatmapTable({ data }: DeptPeopleHeatmapTableProps) {
  const { t } = useTranslation()
  const [filterInput, setFilterInput] = React.useState('')
  const deferredFilter = React.useDeferredValue(filterInput.trim().toLowerCase())

  if (!data || data.labels.length === 0) return null

  const rows = data.series.filter((s) => {
    if (!deferredFilter) return true
    return (
      s.label.toLowerCase().includes(deferredFilter) ||
      (s.username ?? '').toLowerCase().includes(deferredFilter)
    )
  })

  let maxVal = 0
  for (const row of rows) {
    for (const v of row.data) {
      if (v > maxVal) maxVal = v
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Grid3X3 className="size-4 text-primary" aria-hidden="true" />
            <span>{t('dashboard.dept.heatmapTitle', { count: rows.length })}</span>
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{t('dashboard.dept.heatmapLegendLow')}</span>
            <span className="size-3 rounded-xs bg-primary-soft" aria-hidden="true" />
            <span className="size-3 rounded-xs bg-primary/30" aria-hidden="true" />
            <span className="size-3 rounded-xs bg-primary/70" aria-hidden="true" />
            <span className="size-3 rounded-xs bg-primary" aria-hidden="true" />
            <span>{t('dashboard.dept.heatmapLegendHigh')}</span>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            placeholder={t('dashboard.dept.heatmapFilterPlaceholder')}
            aria-label={t('dashboard.dept.heatmapFilterPlaceholder')}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-max min-w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary text-muted-foreground">
              <th className="sticky left-0 z-10 bg-secondary px-2.5 py-2 text-left font-semibold whitespace-nowrap">
                {t('dashboard.posts.cols.person')}
              </th>
              <th className="px-2 py-2 text-right font-semibold whitespace-nowrap">
                {t('dashboard.dept.heatmapCols.total')}
              </th>
              <th className="px-2 py-2 text-right font-semibold whitespace-nowrap">
                {t('dashboard.dept.heatmapCols.avg')}
              </th>
              <th className="px-2 py-2 text-right font-semibold whitespace-nowrap">
                {t('dashboard.dept.heatmapCols.latest')}
              </th>
              <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">
                {t('dashboard.dept.heatmapCols.trend')}
              </th>
              {data.labels.map((label, i) => (
                <th key={`${label}-${i}`} className="px-1.5 py-2 text-center font-semibold whitespace-nowrap">
                  {formatPostBucketLabel(label, data.gran)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={data.labels.length + 5} className="px-4 py-6 text-center text-muted-foreground">
                  {t('dashboard.dept.heatmapEmpty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <HeatmapPersonRow
                  key={row.username || row.label}
                  series={row}
                  labels={data.labels}
                  maxVal={maxVal}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
