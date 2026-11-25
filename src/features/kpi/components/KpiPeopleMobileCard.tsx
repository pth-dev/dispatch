import type * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import { KPI_GRADE_BADGE_CLASS } from '../hooks/use-kpi-people-columns'
import { formatKpiPct, type KpiBasis, type PeopleKpiRow } from '../utils/kpi-people-domain'
import { KpiPersonTaskDetails } from './KpiPersonTaskDetails'

export interface KpiPeopleMobileCardProps {
  row: PeopleKpiRow
  rank: number
  selected: boolean
  expanded: boolean
  taskMap: ReadonlyMap<string, RawTask>
  basis: KpiBasis
  resolveDeptLabel: (raw: string) => string
  onToggleSelect: (key: string, checked: boolean) => void
  onToggleExpand: (key: string) => void
}

export function KpiPeopleMobileCard({
  row,
  rank,
  selected,
  expanded,
  taskMap,
  basis,
  resolveDeptLabel,
  onToggleSelect,
  onToggleExpand,
}: KpiPeopleMobileCardProps): React.ReactElement {
  const { t } = useTranslation()
  const displayName = row.isUnregistered ? t('kpi.unregistered') : row.fullname || '-'
  const deptLabel = row.deptRaw ? resolveDeptLabel(row.deptRaw) : '-'

  return (
    <div
      className={cn(
        'space-y-3 rounded-lg transition-colors',
        selected && 'bg-primary-soft/35 p-2 -mx-2',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="pt-0.5">
            <Checkbox
              aria-label={row.username}
              checked={selected}
              onCheckedChange={(val) => onToggleSelect(row.key, val === true)}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground break-words">
              <span className="mr-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                #{rank}
              </span>
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.username} · {deptLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-base font-bold tabular-nums text-primary">
            {row.score === null ? '-' : row.score}
          </span>
          <Badge variant="outline" className={KPI_GRADE_BADGE_CLASS[row.grade.tone]}>
            {row.grade.code} {t(`kpi.grade.${row.grade.code}`)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted/40 p-2 text-center text-xs tabular-nums">
        <div className="flex flex-col justify-between gap-1">
          <p className="text-[10px] text-muted-foreground">{t('kpi.table.total')}</p>
          <p className="font-semibold text-primary">{row.total}</p>
        </div>
        <div className="flex flex-col justify-between gap-1">
          <p className="text-[10px] text-muted-foreground">{t('kpi.table.completionRate')}</p>
          <p className="font-semibold text-success">
            {formatKpiPct(row.completionRate, row.total)}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-1">
          <p className="text-[10px] text-muted-foreground">{t('kpi.table.ontimeRate')}</p>
          <p className="font-semibold text-primary">
            {formatKpiPct(row.ontimeRate, row.total)}
          </p>
        </div>
        <div className="flex flex-col justify-between gap-1">
          <p className="text-[10px] text-muted-foreground">{t('kpi.table.overdue')}</p>
          <p className={cn('font-semibold', row.overdue > 0 ? 'text-destructive' : 'text-foreground')}>
            {row.overdue}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onToggleExpand(row.key)}
        aria-expanded={expanded}
        className="w-full min-h-9 gap-1.5 text-xs"
      >
        {expanded ? (
          <ChevronUp className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-3.5" aria-hidden="true" />
        )}
        <span>{expanded ? t('kpi.table.collapse') : t('kpi.table.expand')}</span>
      </Button>

      {expanded && (
        <div className="pt-1">
          <KpiPersonTaskDetails row={row} taskMap={taskMap} basis={basis} />
        </div>
      )}
    </div>
  )
}
