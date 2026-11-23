import type * as React from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { APP_ROUTES } from '@/constants/app-routes'
import {
  getBriefLastReportText,
  useKpiBriefUnfinishedColumns,
} from '../hooks/use-kpi-brief-unfinished-columns'
import type { BriefCaseRow, BriefStatus } from '../utils/kpi-brief-domain'
import { formatShortDateTime } from '../utils/kpi-export'
import { KpiBriefStatusBadge } from './KpiBriefStatusBadge'

export type KpiBriefUnfinishedSectionProps = {
  sectionRef?: React.RefObject<HTMLDivElement | null>
  cases: readonly BriefCaseRow[]
  monthLabel: string
  hasMonthFilter: boolean
  personName: string
  statusFilter: BriefStatus | ''
  resolveDeptLabel: (raw: string) => string
  onClearMonth: () => void
  onClearPerson: () => void
  onClearStatus: () => void
}

function UnfinishedCaseMobileCard({
  item,
  overdueText,
  reportPreview,
}: {
  item: BriefCaseRow
  overdueText?: string
  reportPreview: string
}): React.ReactElement {
  return (
    <Link
      to={APP_ROUTES.TASK_DETAIL(item.task.id)}
      className="block space-y-1.5 py-3 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          <span className="text-primary">#{item.task.id}</span> {item.task.title}
        </span>
        <KpiBriefStatusBadge status={item.status} className="shrink-0" />
      </div>
      <p className="text-xs text-muted-foreground">{item.names.join(', ')}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {formatShortDateTime(item.plan)}
        {overdueText && <span className="ml-2 font-semibold text-destructive">{overdueText}</span>}
        <span className="ml-2 font-semibold text-primary">{item.task.progress}%</span>
      </p>
      <p className="rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
        {reportPreview}
      </p>
    </Link>
  )
}

function FilterChipBadge({
  label,
  clearLabel,
  onClear,
}: {
  label: string
  clearLabel: string
  onClear?: () => void
}): React.ReactElement {
  return (
    <Badge variant="secondary" className="gap-1">
      {label}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          className="ml-0.5 hover:text-destructive"
        >
          <X className="size-3" />
        </button>
      )}
    </Badge>
  )
}

export function KpiBriefUnfinishedSection({
  sectionRef,
  cases,
  monthLabel,
  hasMonthFilter,
  personName,
  statusFilter,
  resolveDeptLabel,
  onClearMonth,
  onClearPerson,
  onClearStatus,
}: KpiBriefUnfinishedSectionProps): React.ReactElement {
  const { t } = useTranslation()
  const columns = useKpiBriefUnfinishedColumns({ resolveDeptLabel })
  const clearLabel = t('kpiBrief.clearFilter')

  return (
    <div ref={sectionRef} className="scroll-mt-4">
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{t('kpiBrief.unfinished.title')}</h2>
          <FilterChipBadge
            label={monthLabel}
            clearLabel={clearLabel}
            onClear={hasMonthFilter ? onClearMonth : undefined}
          />
          {personName && (
            <FilterChipBadge label={personName} clearLabel={clearLabel} onClear={onClearPerson} />
          )}
          {statusFilter && (
            <FilterChipBadge
              label={t(`kpiBrief.status.${statusFilter}`)}
              clearLabel={clearLabel}
              onClear={onClearStatus}
            />
          )}
          <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
            {t('kpiBrief.unfinished.count', { count: cases.length })}
          </span>
        </div>

        {cases.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-success">
            {t('kpiBrief.unfinished.empty')}
          </p>
        ) : (
          <DataTable
            variant="embedded"
            data={cases}
            columns={columns}
            keyExtractor={(c) => c.tkey}
            mobileBreakpoint="md"
            mobileItemClassName={() => 'p-0'}
            tableClassName="min-w-[920px]"
            rowClassName={() => 'align-top hover:bg-muted/40'}
            renderMobileCard={(c) => (
              <UnfinishedCaseMobileCard
                item={c}
                overdueText={
                  c.overdueDays != null
                    ? t('kpiBrief.cases.overdueDaysShort', { days: c.overdueDays })
                    : undefined
                }
                reportPreview={getBriefLastReportText(
                  c.task.last_report,
                  Boolean(c.task.is_cycle),
                  t,
                )}
              />
            )}
          />
        )}
      </Card>
    </div>
  )
}
