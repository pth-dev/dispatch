import { Link } from 'react-router'
import { AlertTriangle, CheckCircle2, ChevronRight, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils/cn'
import type { OverdueAgingBucket, OverdueAgingStats, OverdueBucketKey } from '../utils/dashboard-charts'

interface DashboardOverdueAgingCardProps {
  stats: OverdueAgingStats
  viewAllHref: string
  onSelectBucket: (bucket: OverdueAgingBucket) => void
}

const BUCKET_TONE: Record<OverdueBucketKey, string> = {
  '1_3': 'bg-warning/65',
  '4_7': 'bg-warning',
  '8_14': 'bg-destructive/75',
  over_14: 'bg-destructive',
}

export function DashboardOverdueAgingCard({
  stats,
  viewAllHref,
  onSelectBucket,
}: DashboardOverdueAgingCardProps) {
  const { t } = useTranslation()
  const tooltip = t('dashboard.aging.tooltip')

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <AlertTriangle
              className={cn('size-4', stats.overdueCount > 0 ? 'text-destructive' : 'text-success')}
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-foreground">{t('dashboard.aging.title')}</h2>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t('dashboard.scopeBadge.live')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.aging.pausedExcluded', { count: stats.pausedCount })}
          </p>
        </div>

        <span title={tooltip} aria-label={tooltip} className="shrink-0 text-muted-foreground">
          <Info className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-secondary/35 p-2.5 text-center">
        <div className="flex flex-col justify-between gap-1">
          <p className="text-[11px] text-muted-foreground">{t('dashboard.aging.overdueTotal')}</p>
          <p
            className={cn(
              'text-base font-semibold tabular-nums',
              stats.overdueCount > 0 ? 'text-destructive' : 'text-success',
            )}
          >
            {stats.overdueCount}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-1">
          <p className="text-[11px] text-muted-foreground">{t('dashboard.aging.avgOpenAge')}</p>
          <p className="text-base font-semibold text-foreground tabular-nums">
            {stats.avgOpenAgeDays != null
              ? t('dashboard.aging.daysValue', { count: stats.avgOpenAgeDays })
              : '—'}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-1">
          <p className="text-[11px] text-muted-foreground">{t('dashboard.aging.maxOverdue')}</p>
          <p
            className={cn(
              'text-base font-semibold tabular-nums',
              stats.maxOverdueDays != null ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {stats.maxOverdueDays != null
              ? t('dashboard.aging.daysValue', { count: stats.maxOverdueDays })
              : '—'}
          </p>
        </div>
      </div>

      {stats.overdueCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
          <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
          <p className="text-xs font-medium text-foreground">{t('dashboard.aging.allClear')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {stats.buckets.map((bucket) => (
              <button
                key={bucket.key}
                type="button"
                disabled={bucket.count === 0}
                onClick={() => onSelectBucket(bucket)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-left text-xs transition-colors',
                  bucket.count > 0
                    ? 'cursor-pointer hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    : 'opacity-50',
                )}
              >
                <span className="w-24 shrink-0 font-medium text-foreground">
                  {t(`dashboard.aging.buckets.${bucket.key}`)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full transition-all', BUCKET_TONE[bucket.key])}
                    style={{ width: `${bucket.percent}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-muted-foreground tabular-nums">
                  {bucket.count} ({bucket.percent}%)
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-border pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-foreground">{t('dashboard.aging.longestTitle')}</h3>
              <Link
                to={viewAllHref}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                <span>{t('dashboard.aging.viewAll', { count: stats.overdueCount })}</span>
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-1">
              {stats.longestTasks.map(({ task, overdueDays }) => (
                <Link
                  key={task.id}
                  to={APP_ROUTES.TASK_DETAIL(task.id)}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-secondary/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      <span className="mr-1.5 font-semibold text-primary">#{task.id}</span>
                      <span>{task.title}</span>
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {task.assigned_unit || '—'} · {task.assign_person || '—'}
                    </p>
                  </div>
                  <Badge variant="destructive" className="shrink-0 tabular-nums">
                    {t('dashboard.aging.lateDaysBadge', { count: overdueDays })}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
