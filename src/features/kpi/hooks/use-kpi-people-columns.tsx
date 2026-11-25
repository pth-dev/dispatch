import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { ColumnDef } from '@/components/ui/data-table'
import { cn } from '@/utils/cn'
import type { KpiGradeTone } from '@/utils/kpi-domain'
import { formatKpiPct, type PeopleKpiRow } from '../utils/kpi-people-domain'

export const KPI_GRADE_BADGE_CLASS: Record<KpiGradeTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  primary: 'border-primary/30 bg-primary-soft/60 text-primary',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  muted: 'border-border bg-secondary text-muted-foreground',
}

export function useKpiPeopleColumns({
  allSelected,
  someSelected,
  selectedKeys,
  expandedKeys,
  resolveDeptLabel,
  onToggleSelect,
  onSelectAllVisible,
  onToggleExpand,
}: {
  allSelected: boolean
  someSelected: boolean
  selectedKeys: ReadonlySet<string>
  expandedKeys: ReadonlySet<string>
  resolveDeptLabel: (raw: string) => string
  onToggleSelect: (key: string, checked: boolean) => void
  onSelectAllVisible: (checked: boolean) => void
  onToggleExpand: (key: string) => void
}): ColumnDef<PeopleKpiRow>[] {
  const { t } = useTranslation()

  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          aria-label={t('kpi.table.selectAll')}
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={(checked) => onSelectAllVisible(checked === true)}
        />
      ),
      meta: {
        width: '40px',
        headerClassName: 'w-10 px-2 py-2',
        cellClassName: 'px-2 py-2 whitespace-nowrap',
      },
      cell: ({ row }) => (
        <Checkbox
          aria-label={row.original.username}
          checked={selectedKeys.has(row.original.key)}
          onCheckedChange={(val) => onToggleSelect(row.original.key, val === true)}
        />
      ),
    },
    {
      id: 'rank',
      header: t('kpi.table.rank'),
      meta: {
        width: '44px',
        align: 'right',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2 font-medium tabular-nums text-muted-foreground whitespace-nowrap',
      },
      cell: ({ row }) => row.index + 1,
    },
    {
      id: 'username',
      header: t('kpi.table.username'),
      meta: {
        minWidth: '80px',
        headerClassName: 'px-2 py-2',
        cellClassName: 'px-2 py-2 font-semibold text-foreground whitespace-nowrap tabular-nums',
      },
      cell: ({ row }) => row.original.username,
    },
    {
      id: 'fullname',
      header: t('kpi.table.fullname'),
      meta: {
        minWidth: '160px',
        maxWidth: '220px',
        headerClassName: 'px-2 py-2',
        cellClassName: 'min-w-[160px] max-w-[220px] px-2 py-2 font-medium text-foreground',
      },
      cell: ({ row }) => {
        const displayName = row.original.isUnregistered
          ? t('kpi.unregistered')
          : row.original.fullname || '-'
        return (
          <span className="block truncate" title={displayName}>
            {displayName}
          </span>
        )
      },
    },
    {
      id: 'dept',
      header: t('kpi.table.dept'),
      meta: {
        minWidth: '100px',
        headerClassName: 'px-2.5 py-2.5',
        cellClassName: 'px-2.5 py-2.5 text-muted-foreground whitespace-nowrap',
      },
      cell: ({ row }) => (row.original.deptRaw ? resolveDeptLabel(row.original.deptRaw) : '-'),
    },
    {
      id: 'total',
      header: t('kpi.table.total'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 font-semibold tabular-nums text-primary whitespace-nowrap',
      },
      cell: ({ row }) => row.original.total,
    },
    {
      id: 'completed',
      header: t('kpi.table.completed'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.completed,
    },
    {
      id: 'completionRate',
      header: t('kpi.table.completionRate'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-success">
            {formatKpiPct(row.original.completionRate, row.original.total)}
          </span>
          {row.original.total > 0 && (
            <span className="block text-[10px] text-muted-foreground">
              +{row.original.finalPart}
            </span>
          )}
        </>
      ),
    },
    {
      id: 'ontime',
      header: t('kpi.table.ontime'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.ontime,
    },
    {
      id: 'ontimeRate',
      header: t('kpi.table.ontimeRate'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => (
        <>
          <span className="font-semibold text-primary">
            {formatKpiPct(row.original.ontimeRate, row.original.total)}
          </span>
          {row.original.total > 0 && (
            <span className="block text-[10px] text-muted-foreground">
              +{row.original.ontimePart}
            </span>
          )}
        </>
      ),
    },
    {
      id: 'late',
      header: t('kpi.table.late'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums text-warning whitespace-nowrap',
      },
      cell: ({ row }) => (
        <>
          <span className="font-medium">{row.original.late}</span>
          <span className="ml-1 text-[10px] text-muted-foreground">
            ({formatKpiPct(row.original.lateRate, row.original.total)})
          </span>
        </>
      ),
    },
    {
      id: 'pending',
      header: t('kpi.table.pending'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.pending,
    },
    {
      id: 'overdue',
      header: t('kpi.table.overdue'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 font-semibold tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span
          className={cn(row.original.overdue > 0 ? 'text-destructive' : 'text-muted-foreground')}
        >
          {row.original.overdue}
        </span>
      ),
    },
    {
      id: 'response1h',
      header: t('kpi.table.response1h'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => formatKpiPct(row.original.responseRate, row.original.total),
    },
    {
      id: 'paused',
      header: t('kpi.table.paused'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2.5',
        cellClassName: 'px-2 py-2.5 tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span
          className={cn(
            row.original.paused > 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
          )}
        >
          {row.original.paused}
        </span>
      ),
    },
    {
      id: 'score',
      header: t('kpi.table.score'),
      meta: {
        align: 'right',
        headerClassName: 'px-2 py-2',
        cellClassName: 'px-2 py-2 text-sm font-bold tabular-nums text-primary whitespace-nowrap',
      },
      cell: ({ row }) => (row.original.score === null ? '-' : row.original.score),
    },
    {
      id: 'grade',
      header: t('kpi.table.grade'),
      meta: {
        headerClassName: 'px-2 py-2',
        cellClassName: 'whitespace-nowrap px-2 py-2',
      },
      cell: ({ row }) => (
        <Badge variant="outline" className={KPI_GRADE_BADGE_CLASS[row.original.grade.tone]}>
          {row.original.grade.code} {t(`kpi.grade.${row.original.grade.code}`)}
        </Badge>
      ),
    },
    {
      id: 'detail',
      header: t('kpi.table.detail'),
      meta: {
        sticky: 'right',
        minWidth: '96px',
        headerClassName: 'bg-muted px-2 py-2',
        cellClassName: 'bg-card whitespace-nowrap px-2 py-2',
      },
      cell: ({ row }) => {
        const expanded = expandedKeys.has(row.original.key)
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleExpand(row.original.key)}
            aria-expanded={expanded}
            className="h-7 gap-1 px-2.5 text-xs"
          >
            {expanded ? (
              <ChevronUp className="size-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5" aria-hidden="true" />
            )}
            {expanded ? t('kpi.table.collapse') : t('kpi.table.expand')}
          </Button>
        )
      },
    },
  ]
}
