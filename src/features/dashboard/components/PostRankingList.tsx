import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import type { PostStatsRankingRow } from '@/schemas/dashboard'
import { cn } from '@/utils/cn'
import { getKpiGrade, type KpiGradeTone } from '@/utils/kpi-domain'

type PostRankingListProps = {
  rows: readonly PostStatsRankingRow[]
  limit?: number
}

const GRADE_CLASS: Record<KpiGradeTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  primary: 'border-primary/30 bg-primary-soft text-primary',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  muted: 'border-border bg-secondary text-muted-foreground',
}

function PostRankingMobileCard({ row }: { row: PostStatsRankingRow }): React.ReactElement {
  const grade = getKpiGrade(row.kpi_score)
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-xs">
      <span
        className={cn(
          'w-6 shrink-0 text-center font-semibold tabular-nums',
          row.rank <= 3 ? 'text-warning' : 'text-muted-foreground',
        )}
      >
        {row.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {row.fullname || row.username}{' '}
          <span className="text-muted-foreground">({row.username})</span>
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {row.dept_label || '—'} · {row.completionRate}% / {row.ontimeRate}%
        </p>
      </div>
      <div className="shrink-0 text-right space-y-0.5">
        <p className="font-semibold text-primary tabular-nums">{row.posts}</p>
        <Badge variant="outline" className={cn('text-[10px]', GRADE_CLASS[grade.tone])}>
          {row.kpi_score ?? '—'} {grade.code}
        </Badge>
      </div>
    </div>
  )
}

export function PostRankingList({
  rows,
  limit = 20,
}: PostRankingListProps): React.ReactElement {
  const { t } = useTranslation()
  const shown = rows.slice(0, limit)

  if (shown.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        {t('dashboard.posts.emptyRanking')}
      </p>
    )
  }

  const columns: ColumnDef<PostStatsRankingRow>[] = [
    {
      id: 'rank',
      header: '#',
      meta: {
        width: '44px',
        headerClassName: 'py-2 pr-2 pl-0 w-10',
        cellClassName: 'py-2 pr-2 pl-0 font-semibold tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span className={row.original.rank <= 3 ? 'text-warning' : 'text-muted-foreground'}>
          {row.original.rank}
        </span>
      ),
    },
    {
      id: 'person',
      header: t('dashboard.posts.cols.person'),
      meta: {
        minWidth: '180px',
        headerClassName: 'py-2 pr-2 pl-0',
        cellClassName: 'min-w-[180px] py-2 pr-2 pl-0 font-medium text-foreground whitespace-nowrap',
      },
      cell: ({ row }) => {
        const displayName = row.original.fullname || row.original.username
        return (
          <span title={`${displayName} (${row.original.username})`}>
            {displayName} <span className="text-muted-foreground">({row.original.username})</span>
          </span>
        )
      },
    },
    {
      id: 'dept',
      header: t('dashboard.posts.cols.dept'),
      meta: {
        minWidth: '110px',
        headerClassName: 'py-2 pr-2 pl-0',
        cellClassName: 'py-2 pr-2 pl-0 text-muted-foreground whitespace-nowrap',
      },
      cell: ({ row }) => row.original.dept_label || '—',
    },
    {
      id: 'posts',
      header: t('dashboard.posts.cols.posts'),
      meta: {
        align: 'right',
        headerClassName: 'py-2 pr-2 pl-0',
        cellClassName: 'py-2 pr-2 pl-0 font-semibold text-primary tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.posts,
    },
    {
      id: 'kpiTasks',
      header: t('dashboard.posts.cols.kpiTasks'),
      meta: {
        align: 'right',
        headerClassName: 'py-2 pr-2 pl-0',
        cellClassName: 'py-2 pr-2 pl-0 tabular-nums text-muted-foreground whitespace-nowrap',
      },
      cell: ({ row }) => row.original.kpi_total,
    },
    {
      id: 'completion',
      header: t('dashboard.posts.cols.completion'),
      meta: {
        align: 'right',
        headerClassName: 'py-2 pr-2 pl-0',
        cellClassName: 'py-2 pr-2 pl-0 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => `${row.original.completionRate}%`,
    },
    {
      id: 'ontime',
      header: t('dashboard.posts.cols.ontime'),
      meta: {
        align: 'right',
        headerClassName: 'py-2 pr-2 pl-0',
        cellClassName: 'py-2 pr-2 pl-0 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => `${row.original.ontimeRate}%`,
    },
    {
      id: 'score',
      header: t('dashboard.posts.cols.score'),
      meta: {
        align: 'right',
        headerClassName: 'py-2 pr-2 pl-0',
        cellClassName: 'py-2 pr-2 pl-0 font-semibold tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.kpi_score ?? '—',
    },
    {
      id: 'grade',
      header: t('dashboard.posts.cols.grade'),
      meta: {
        headerClassName: 'py-2 px-0',
        cellClassName: 'py-2 px-0 whitespace-nowrap',
      },
      cell: ({ row }) => {
        const grade = getKpiGrade(row.original.kpi_score)
        return (
          <Badge variant="outline" className={cn('text-[10px]', GRADE_CLASS[grade.tone])}>
            {grade.code}
          </Badge>
        )
      },
    },
  ]

  return (
    <DataTable
      variant="embedded"
      data={shown}
      columns={columns}
      keyExtractor={(row) => `${row.rank}-${row.username}`}
      enablePagination
      initialPageSize={10}
      mobileBreakpoint="md"
      mobileContainerClassName="divide-y-0 space-y-2"
      mobileItemClassName={() => 'p-0'}
      tableClassName="min-w-[680px]"
      headerClassName="bg-transparent text-xs"
      rowClassName={() => 'hover:bg-secondary/40'}
      renderMobileCard={(row) => <PostRankingMobileCard row={row} />}
    />
  )
}
