import * as React from 'react'
import { Lock, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { InlineError, toErrorStatus } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { TrendLineChart, type TrendSeries } from '@/components/ui/trend-line-chart'
import type { PostGranularity, PostKpiPeriod, PostStatsResponse } from '@/schemas/dashboard'
import { cn } from '@/utils/cn'
import { formatPostBucketLabel } from '../utils/dashboard-domain'
import { PostRankingList } from './PostRankingList'

interface DashboardPostTrendSectionProps {
  title: string
  subtitle: string
  rankingTitle: string
  canRead: boolean
  data: PostStatsResponse | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  gran: PostGranularity
  onGranChange: (gran: PostGranularity) => void
  kpiPeriod: PostKpiPeriod
  onKpiPeriodChange: (period: PostKpiPeriod) => void
  maxSeries?: number
  rankLimit?: number
}

const GRAN_OPTIONS: readonly PostGranularity[] = ['day', 'week', 'month']
const KPI_OPTIONS: readonly PostKpiPeriod[] = ['month', 'quarter', 'year']
const DEFAULT_VISIBLE_SERIES = 4

export function DashboardPostTrendSection({
  title,
  subtitle,
  rankingTitle,
  canRead,
  data,
  isLoading,
  isError,
  error,
  onRetry,
  gran,
  onGranChange,
  kpiPeriod,
  onKpiPeriodChange,
  maxSeries = 10,
  rankLimit = 20,
}: DashboardPostTrendSectionProps) {
  const { t } = useTranslation()
  const [showAllSeries, setShowAllSeries] = React.useState(false)

  if (!canRead) {
    return (
      <section className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-6 text-xs text-muted-foreground">
        <Lock className="size-4 shrink-0" aria-hidden="true" />
        <span>{t('dashboard.posts.noPermission')}</span>
      </section>
    )
  }

  const nonZeroSeries = data ? data.series.filter((item) => item.total > 0).slice(0, maxSeries) : []
  const effectiveLimit = showAllSeries ? maxSeries : Math.min(DEFAULT_VISIBLE_SERIES, maxSeries)
  const hasMoreSeries = nonZeroSeries.length > DEFAULT_VISIBLE_SERIES

  const chartSeries: TrendSeries[] = []
  if (data) {
    if (data.total_series.length > 0) {
      chartSeries.push({
        id: '__total__',
        label: t('dashboard.posts.totalLine'),
        data: data.total_series,
        total: data.total,
        dashed: true,
      })
    }
    for (const s of nonZeroSeries.slice(0, effectiveLimit)) {
      chartSeries.push({
        id: s.username || s.label,
        label: s.label,
        data: s.data,
        total: s.total,
      })
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="size-4 text-primary" aria-hidden="true" />
              <span>{title}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {subtitle}
              {data ? ` · ${t('dashboard.posts.totalPosts', { count: data.total })}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasMoreSeries && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAllSeries((v) => !v)}
              >
                {showAllSeries
                  ? t('dashboard.posts.showTopSeries')
                  : t('dashboard.posts.showAllSeries', { count: nonZeroSeries.length })}
              </Button>
            )}
            <div
              role="group"
              aria-label={t('dashboard.period.label')}
              className="inline-flex w-fit rounded-lg border border-border bg-secondary/40 p-1"
            >
              {GRAN_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={gran === opt}
                  onClick={() => onGranChange(opt)}
                  className={cn(
                    'min-h-11 lg:min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    gran === opt
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`dashboard.posts.gran.${opt}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div role="status" className="h-56 motion-safe:animate-pulse rounded-lg bg-secondary/60">
            <span className="sr-only">{t('common.loading')}</span>
          </div>
        ) : isError ? (
          <InlineError status={toErrorStatus(error)} onRetry={onRetry} />
        ) : (
          <TrendLineChart
            labels={data?.labels ?? []}
            series={chartSeries}
            ariaLabel={title}
            emptyMessage={t('dashboard.posts.emptyChart')}
            formatXLabel={(raw) => formatPostBucketLabel(raw, gran)}
            maxSeries={maxSeries + 1}
          />
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">{rankingTitle}</h3>
            {data?.kpi_period?.label && (
              <p className="text-xs text-muted-foreground">{data.kpi_period.label}</p>
            )}
          </div>

          <div
            role="group"
            aria-label={rankingTitle}
            className="inline-flex w-fit rounded-lg border border-border bg-secondary/40 p-1"
          >
            {KPI_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={kpiPeriod === opt}
                onClick={() => onKpiPeriodChange(opt)}
                className={cn(
                  'min-h-11 lg:min-h-8 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  kpiPeriod === opt
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`dashboard.posts.kpiPeriod.${opt}`)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div role="status" className="h-44 motion-safe:animate-pulse rounded-lg bg-secondary/60">
            <span className="sr-only">{t('common.loading')}</span>
          </div>
        ) : isError ? (
          <InlineError status={toErrorStatus(error)} onRetry={onRetry} />
        ) : (
          <PostRankingList rows={data?.ranking ?? []} limit={rankLimit} />
        )}
      </section>
    </div>
  )
}
