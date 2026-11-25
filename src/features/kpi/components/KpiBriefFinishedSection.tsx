import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/utils/cn'
import { parseLocalDateTime } from '@/utils/task-domain'
import { useKpiBriefFinishedColumns } from '../hooks/use-kpi-brief-finished-columns'
import {
  BRIEF_FINISHED_LIMIT,
  type BriefCaseRow,
  type BriefFinishedFilter,
} from '../utils/kpi-brief-domain'
import { formatShortDateTime } from '../utils/kpi-export'
import { KpiBriefStatusBadge } from './KpiBriefStatusBadge'

export type KpiBriefFinishedSectionProps = {
  sectionRef?: React.RefObject<HTMLDivElement | null>
  cases: readonly BriefCaseRow[]
  totalCount: number
  ontimeCount: number
  lateCount: number
  finFilter: BriefFinishedFilter
  resolveDeptLabel: (raw: string) => string
  onFinFilterChange: (filter: BriefFinishedFilter) => void
  onOpenFinishedDetail: (item: BriefCaseRow) => void
}

function FinishedCaseMobileCard({
  item,
  overdueText,
}: {
  item: BriefCaseRow
  overdueText?: string
}): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          <span className="text-success">#{item.task.id}</span> {item.task.title}
        </span>
        <KpiBriefStatusBadge status={item.status} className="shrink-0" />
      </div>
      <p className="text-xs text-muted-foreground">{item.names.join(', ')}</p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {formatShortDateTime(parseLocalDateTime(item.task.finish_date)) || '-'}
        {overdueText && <span className="ml-2 font-semibold text-warning">{overdueText}</span>}
      </p>
    </div>
  )
}

export function KpiBriefFinishedSection({
  sectionRef,
  cases,
  totalCount,
  ontimeCount,
  lateCount,
  finFilter,
  resolveDeptLabel,
  onFinFilterChange,
  onOpenFinishedDetail,
}: KpiBriefFinishedSectionProps): React.ReactElement {
  const { t } = useTranslation()
  const displayed = cases.slice(0, BRIEF_FINISHED_LIMIT)
  const columns = useKpiBriefFinishedColumns({ resolveDeptLabel, onOpenFinishedDetail })

  const filterButtons: { key: BriefFinishedFilter; label: string }[] = [
    { key: '', label: `${t('kpiBrief.finished.all')} ${totalCount}` },
    { key: 'ontime', label: `${t('kpiBrief.status.ontime')} ${ontimeCount}` },
    { key: 'late', label: `${t('kpiBrief.status.late')} ${lateCount}` },
  ]

  return (
    <div ref={sectionRef} className="scroll-mt-4">
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{t('kpiBrief.finished.title')}</h2>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.key || 'all'}
                type="button"
                aria-pressed={finFilter === btn.key}
                onClick={() => onFinFilterChange(finFilter === btn.key ? '' : btn.key)}
                className={cn(
                  'min-h-9 lg:min-h-0 rounded-md px-2.5 py-1.5 lg:py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  finFilter === btn.key
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
            {cases.length > BRIEF_FINISHED_LIMIT
              ? t('kpiBrief.finished.countLimited', {
                  count: cases.length,
                  limit: BRIEF_FINISHED_LIMIT,
                })
              : t('kpiBrief.finished.count', { count: cases.length })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">{t('kpiBrief.finished.hint')}</p>

        {displayed.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('kpiBrief.finished.empty')}
          </p>
        ) : (
          <DataTable
            variant="embedded"
            data={displayed}
            columns={columns}
            keyExtractor={(c) => c.tkey}
            enablePagination
            initialPageSize={10}
            mobileBreakpoint="md"
            onRowClick={onOpenFinishedDetail}
            mobileItemClassName={() => 'px-0 py-3 hover:bg-muted/30'}
            tableClassName="min-w-[900px]"
            rowClassName={() => 'align-top hover:bg-muted/40'}
            renderMobileCard={(c) => (
              <FinishedCaseMobileCard
                item={c}
                overdueText={
                  c.lateDays != null
                    ? t('kpiBrief.cases.overdueDaysShort', { days: c.lateDays })
                    : undefined
                }
              />
            )}
          />
        )}
      </Card>
    </div>
  )
}
