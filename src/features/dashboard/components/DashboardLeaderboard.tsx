import * as React from 'react'
import { Link } from 'react-router'
import { Award, ChevronLeft, ChevronRight, Info, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP_ROUTES } from '@/constants/app-routes'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/utils/cn'
import { buildTaskDrilldownUrl, type PeriodAssigneeRankRow } from '../utils/dashboard-charts'
import type { DashboardPeriod } from '../utils/dashboard-domain'

interface DashboardLeaderboardProps {
  rows: readonly PeriodAssigneeRankRow[]
  period: DashboardPeriod
  department?: string
}

interface RankedRow extends PeriodAssigneeRankRow {
  rank: number
}

function LeaderboardRow({ row, href }: { row: RankedRow; href: string }) {
  const rateTone =
    row.ontimeRate >= 90
      ? 'text-success'
      : row.ontimeRate >= 70
        ? 'text-warning'
        : 'text-destructive'

  return (
    <Link
      to={href}
      className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          'w-6 shrink-0 text-center font-semibold tabular-nums',
          row.rank <= 3 ? 'text-warning' : 'text-muted-foreground',
        )}
      >
        {row.rank}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-foreground" title={row.assignee}>
        {row.assignee}
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
        {row.ontime}/{row.completed}
      </span>
      <span className={cn('w-12 shrink-0 text-right font-semibold tabular-nums', rateTone)}>
        {row.ontimeRate}%
      </span>
    </Link>
  )
}

export function DashboardLeaderboard({ rows, period, department }: DashboardLeaderboardProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [filterInput, setFilterInput] = React.useState('')
  const [page, setPage] = React.useState(0)
  const deferredFilter = React.useDeferredValue(filterInput.trim().toLowerCase())

  const ranked: RankedRow[] = rows.map((row, idx) => ({ ...row, rank: idx + 1 }))
  const tokens = deferredFilter
    ? deferredFilter
        .split(/[,，、;；]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const filtered =
    tokens.length === 0
      ? ranked
      : ranked.filter((row) => tokens.some((tok) => row.assignee.toLowerCase().includes(tok)))

  const pageSize = isMobile ? 10 : 30
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const columns: RankedRow[][] = isMobile
    ? [pageRows]
    : [pageRows.slice(0, 10), pageRows.slice(10, 20), pageRows.slice(20, 30)].filter(
        (col) => col.length > 0,
      )

  const tooltip = t('dashboard.leaderboard.tooltip')

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Award className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              {t('dashboard.leaderboard.title')}
            </h2>
            <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {t(`dashboard.period.${period}`)}
            </span>
            <span title={tooltip} aria-label={tooltip} className="text-muted-foreground">
              <Info className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{t('dashboard.leaderboard.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={filterInput}
              onChange={(e) => {
                setFilterInput(e.target.value)
                setPage(0)
              }}
              placeholder={t('dashboard.leaderboard.filterPlaceholder')}
              aria-label={t('dashboard.leaderboard.filterPlaceholder')}
              className="pl-9"
            />
          </div>

          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="size-11 lg:size-8"
                aria-label={t('common.previous')}
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-1.5 text-xs text-muted-foreground tabular-nums">
                {safePage + 1} / {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="size-11 lg:size-8"
                aria-label={t('common.next')}
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {pageRows.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {t('dashboard.leaderboard.empty')}
        </p>
      ) : (
        <div className={cn('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3')}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="space-y-1.5">
              {col.map((row) => (
                <LeaderboardRow
                  key={row.assignee}
                  row={row}
                  href={buildTaskDrilldownUrl(APP_ROUTES.TASKS, {
                    scope: 'all',
                    department,
                    search: row.assignee,
                  })}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
