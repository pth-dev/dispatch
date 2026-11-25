import * as React from 'react'
import { Grid3X3, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Sparkline } from '@/components/ui/sparkline'
import type { PostStatsResponse, PostStatsSeries } from '@/schemas/dashboard'
import { cn } from '@/utils/cn'
import { formatPostBucketLabel } from '../utils/dashboard-domain'

type DeptPeopleHeatmapTableProps = {
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

function buildHeatmapColumns(
  data: PostStatsResponse,
  maxVal: number,
  t: (key: string) => string,
): ColumnDef<PostStatsSeries>[] {
  const n = data.labels.length

  const fixedColumns: ColumnDef<PostStatsSeries>[] = [
    {
      id: 'person',
      header: t('dashboard.posts.cols.person'),
      meta: {
        sticky: 'left',
        minWidth: '170px',
        headerClassName: 'min-w-[170px] bg-secondary px-2.5 py-2 font-semibold whitespace-nowrap',
        cellClassName: 'min-w-[170px] bg-card px-2.5 py-1.5 font-medium text-foreground whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span title={row.original.label}>{row.original.label}</span>
      ),
    },
    {
      id: 'total',
      header: t('dashboard.dept.heatmapCols.total'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold whitespace-nowrap',
        cellClassName: 'px-2 py-1.5 font-semibold text-primary tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.total,
    },
    {
      id: 'avg',
      header: t('dashboard.dept.heatmapCols.avg'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold whitespace-nowrap',
        cellClassName: 'px-2 py-1.5 text-muted-foreground tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => (n > 0 ? Math.round((row.original.total / n) * 10) / 10 : 0),
    },
    {
      id: 'latest',
      header: t('dashboard.dept.heatmapCols.latest'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2 font-semibold whitespace-nowrap',
        cellClassName: 'px-2 py-1.5 font-medium tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => {
        const last = row.original.data[n - 1] ?? 0
        const prev = n > 1 ? (row.original.data[n - 2] ?? 0) : 0
        const diff = last - prev
        const tone =
          diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'
        return (
          <span className={tone}>
            {last}
            {diff !== 0 ? (diff > 0 ? ` ▲${diff}` : ` ▼${Math.abs(diff)}`) : ''}
          </span>
        )
      },
    },
    {
      id: 'trend',
      header: t('dashboard.dept.heatmapCols.trend'),
      meta: {
        headerClassName: 'px-2 py-2 font-semibold whitespace-nowrap',
        cellClassName: 'px-2 py-1.5',
      },
      cell: ({ row }) => <Sparkline data={row.original.data} />,
    },
  ]

  const bucketColumns: ColumnDef<PostStatsSeries>[] = data.labels.map((label, i) => ({
    id: `bucket-${label}-${i}`,
    header: formatPostBucketLabel(label, data.gran),
    meta: {
      align: 'center',
      headerClassName: 'px-1.5 py-2 font-semibold whitespace-nowrap',
      cellClassName: 'px-0.5 py-1',
    },
    cell: ({ row }) => {
      const val = row.original.data[i] ?? 0
      return (
        <span
          title={`${row.original.label} · ${label}: ${val}`}
          className={cn(
            'inline-block min-w-6 rounded px-1 py-0.5 text-[11px] font-medium tabular-nums',
            heatCellClass(val, maxVal),
          )}
        >
          {val}
        </span>
      )
    },
  }))

  return [...fixedColumns, ...bucketColumns]
}

export function DeptPeopleHeatmapTable({
  data,
}: DeptPeopleHeatmapTableProps): React.ReactElement | null {
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

  const columns = buildHeatmapColumns(data, maxVal, t)

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

      <DataTable
        variant="embedded"
        data={rows}
        columns={columns}
        keyExtractor={(row) => row.username || row.label}
        enablePagination
        initialPageSize={20}
        emptyMessage={t('dashboard.dept.heatmapEmpty')}
        emptyClassName="px-4 py-6 text-xs"
        containerClassName="rounded-lg border border-border"
        tableClassName="w-max min-w-full text-xs"
        headerClassName="bg-secondary text-xs"
        rowClassName={() => 'hover:bg-secondary/40'}
      />
    </section>
  )
}
