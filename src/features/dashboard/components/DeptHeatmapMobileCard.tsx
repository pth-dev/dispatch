import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkline } from '@/components/ui/sparkline'
import type { PostStatsResponse, PostStatsSeries } from '@/schemas/dashboard'
import { cn } from '@/utils/cn'
import { formatPostBucketLabel, heatCellClass } from '../utils/dashboard-domain'

type DeptHeatmapMobileCardProps = {
  row: PostStatsSeries
  labels: readonly string[]
  gran: PostStatsResponse['gran']
  maxVal: number
}

/** Card tóm tắt mật độ báo cáo theo thời gian của nhân sự trên màn hình nhỏ. */
export function DeptHeatmapMobileCard({
  row,
  labels,
  gran,
  maxVal,
}: DeptHeatmapMobileCardProps): React.ReactElement {
  const { t } = useTranslation()
  const n = labels.length
  const avg = n > 0 ? Math.round((row.total / n) * 10) / 10 : 0
  const last = row.data[n - 1] ?? 0
  const prev = n > 1 ? (row.data[n - 2] ?? 0) : 0
  const diff = last - prev
  const latestTone =
    diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-sm font-semibold text-foreground break-words">
          {row.label}
        </span>
        <Sparkline data={row.data} ariaLabel={row.label} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-xs">
        <div className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5">
          <div className="text-[11px] text-muted-foreground">
            {t('dashboard.dept.heatmapCols.total')}
          </div>
          <div className="font-bold tabular-nums text-foreground">{row.total}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5">
          <div className="text-[11px] text-muted-foreground">
            {t('dashboard.dept.heatmapCols.avg')}
          </div>
          <div className="font-semibold tabular-nums text-foreground">{avg}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5">
          <div className="text-[11px] text-muted-foreground">
            {t('dashboard.dept.heatmapCols.latest')}
          </div>
          <div className={cn('font-semibold tabular-nums', latestTone)}>
            {last}
            {diff !== 0 ? (diff > 0 ? ` ▲${diff}` : ` ▼${Math.abs(diff)}`) : ''}
          </div>
        </div>
      </div>

      {labels.length > 0 ? (
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {labels.map((label, i) => {
            const val = row.data[i] ?? 0
            return (
              <div
                key={`${label}-${i}`}
                title={`${row.label} · ${label}: ${val}`}
                className="flex shrink-0 flex-col items-center gap-0.5"
              >
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatPostBucketLabel(label, gran)}
                </span>
                <span
                  className={cn(
                    'inline-flex min-w-6 items-center justify-center rounded px-1 py-0.5 text-[11px] font-medium tabular-nums',
                    heatCellClass(val, maxVal),
                  )}
                >
                  {val}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
