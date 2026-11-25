import type * as React from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import type { AssigneeIdentity, DeptMemberStatusRow } from '../utils/dashboard-charts'

type DeptMemberMobileCardProps = {
  row: DeptMemberStatusRow
  identity: AssigneeIdentity
  cellUrl: (name: string, status?: string) => string
}

/** Card hiển thị ma trận trạng thái công việc của từng nhân sự trên màn hình nhỏ. */
export function DeptMemberMobileCard({
  row,
  identity,
  cellUrl,
}: DeptMemberMobileCardProps): React.ReactElement {
  const { t } = useTranslation()
  const fullTitle = identity.code ? `${identity.name} (${identity.code})` : identity.name

  const metrics = [
    {
      key: 'delayed',
      label: t('dashboard.dept.metrics.delayed'),
      count: row.overdue,
      status: 'delayed_pending',
      toneClass: 'text-destructive',
    },
    {
      key: 'progress',
      label: t('dashboard.dept.metrics.progress'),
      count: row.inProgress,
      status: 'in_progress',
      toneClass: 'text-primary',
    },
    {
      key: 'notStarted',
      label: t('dashboard.dept.metrics.notStarted'),
      count: row.notStarted,
      status: 'not_started',
      toneClass: 'text-foreground',
    },
    {
      key: 'paused',
      label: t('dashboard.dept.metrics.paused'),
      count: row.paused,
      status: 'paused',
      toneClass: 'text-muted-foreground',
    },
    {
      key: 'completed',
      label: t('dashboard.dept.metrics.completed'),
      count: row.completed,
      status: 'completed',
      toneClass: 'text-success',
    },
    {
      key: 'openTotal',
      label: t('dashboard.dept.metrics.openTotal'),
      count: row.open,
      status: 'incomplete',
      toneClass: 'text-foreground',
    },
  ]

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={cellUrl(row.name)}
          title={fullTitle}
          className="min-w-0 inline-flex flex-wrap items-baseline gap-1.5 font-semibold text-sm text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <span className="break-words">{identity.name}</span>
          {identity.code ? (
            <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
              {identity.code}
            </span>
          ) : null}
        </Link>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {row.total}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {metrics.map((m) =>
          m.count > 0 ? (
            <Link
              key={m.key}
              to={cellUrl(row.name, m.status)}
              className="flex min-h-9 items-center justify-between gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate text-muted-foreground">{m.label}</span>
              <span className={cn('shrink-0 font-bold tabular-nums', m.toneClass)}>
                {m.count}
              </span>
            </Link>
          ) : (
            <div
              key={m.key}
              className="flex min-h-9 items-center justify-between gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs"
            >
              <span className="truncate text-muted-foreground/70">{m.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground/40">0</span>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
