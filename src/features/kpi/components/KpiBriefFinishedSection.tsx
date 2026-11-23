import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { parseLocalDateTime, parseReqDepts } from '@/utils/task-domain'
import {
  BRIEF_FINISHED_LIMIT,
  type BriefCaseRow,
  type BriefFinishedFilter,
} from '../utils/kpi-brief-domain'
import { formatShortDateTime } from '../utils/kpi-export'
import { KpiBriefStatusBadge } from './KpiBriefStatusBadge'

export interface KpiBriefFinishedSectionProps {
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
}: KpiBriefFinishedSectionProps) {
  const { t } = useTranslation()
  const displayed = cases.slice(0, BRIEF_FINISHED_LIMIT)

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
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {displayed.map((c) => (
                <button
                  key={c.tkey}
                  type="button"
                  onClick={() => onOpenFinishedDetail(c)}
                  className="w-full space-y-1.5 py-3 text-left hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      <span className="text-success">#{c.task.id}</span> {c.task.title}
                    </span>
                    <KpiBriefStatusBadge status={c.status} className="shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground">{c.names.join(', ')}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatShortDateTime(parseLocalDateTime(c.task.finish_date)) || '-'}
                    {c.lateDays != null && (
                      <span className="ml-2 font-semibold text-warning">
                        {t('kpiBrief.cases.overdueDaysShort', { days: c.lateDays })}
                      </span>
                    )}
                  </p>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] text-left text-xs">
                <thead className="border-b border-border bg-muted/30 text-[11px] font-medium text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2">{t('kpiBrief.cases.id')}</th>
                    <th className="px-2 py-2">{t('kpiBrief.cases.title')}</th>
                    <th className="px-2 py-2">{t('kpiBrief.cases.assignee')}</th>
                    <th className="px-2 py-2">{t('kpiBrief.cases.status')}</th>
                    <th className="px-2 py-2">{t('kpiBrief.cases.planDate')}</th>
                    <th className="px-2 py-2">{t('kpiBrief.cases.finishDate')}</th>
                    <th className="px-2 py-2 text-right">{t('kpiBrief.cases.overdueDays')}</th>
                    <th className="px-2 py-2">{t('kpiBrief.cases.reqDept')}</th>
                    <th className="w-[24%] px-2 py-2">{t('kpiBrief.cases.lastReport')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayed.map((c) => {
                    const reqDepts = parseReqDepts(c.task.req_depts, c.task.req_dept)
                      .map(resolveDeptLabel)
                      .join(', ')
                    const lastRep =
                      typeof c.task.last_report === 'string' && c.task.last_report.trim()
                        ? c.task.last_report.trim().slice(0, 140)
                        : t('kpiBrief.cases.noReport')
                    return (
                      <tr key={c.tkey} className="align-top transition-colors hover:bg-muted/40">
                        <td className="whitespace-nowrap px-2 py-2.5 font-semibold tabular-nums">
                          <button
                            type="button"
                            onClick={() => onOpenFinishedDetail(c)}
                            className="text-success hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          >
                            #{c.task.id}
                          </button>
                        </td>
                        <td className="min-w-[180px] px-2 py-2.5 font-medium text-foreground">
                          <button
                            type="button"
                            onClick={() => onOpenFinishedDetail(c)}
                            className="text-left hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          >
                            {c.task.title}
                          </button>
                          {c.task.task_type && (
                            <span className="block text-[10px] text-muted-foreground">
                              {c.task.task_type}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-foreground">{c.names.join(', ')}</td>
                        <td className="px-2 py-2.5">
                          <KpiBriefStatusBadge status={c.status} />
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 tabular-nums text-muted-foreground">
                          {formatShortDateTime(c.plan)}
                        </td>
                        <td
                          className={cn(
                            'whitespace-nowrap px-2 py-2.5 font-medium tabular-nums',
                            c.status === 'late' ? 'text-warning' : 'text-success',
                          )}
                        >
                          {formatShortDateTime(parseLocalDateTime(c.task.finish_date)) || '-'}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-2.5 text-right font-semibold tabular-nums',
                            c.lateDays ? 'text-warning' : 'text-muted-foreground',
                          )}
                        >
                          {c.lateDays ?? '-'}
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">{reqDepts || '-'}</td>
                        <td className="px-2 py-2.5 text-muted-foreground whitespace-pre-wrap break-words">
                          {lastRep}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
