import type * as React from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils/cn'
import { isRecurringTask, parseReqDepts } from '@/utils/task-domain'
import type { BriefCaseRow, BriefStatus } from '../utils/kpi-brief-domain'
import { formatShortDateTime } from '../utils/kpi-export'
import { KpiBriefStatusBadge } from './KpiBriefStatusBadge'

export interface KpiBriefUnfinishedSectionProps {
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

function getLastReportText(raw: unknown, isCycle: boolean, t: (key: string) => string): string {
  if (isCycle) return t('kpiBrief.cases.archivedCycle')
  const text = typeof raw === 'string' ? raw.replace(/\r\n?/g, '\n').trim() : ''
  if (!text) return t('kpiBrief.cases.noReport')
  return text.length > 140 ? `${text.slice(0, 140)}…` : text
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
}: KpiBriefUnfinishedSectionProps) {
  const { t } = useTranslation()

  return (
    <div ref={sectionRef} className="scroll-mt-4">
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{t('kpiBrief.unfinished.title')}</h2>

          <Badge variant="secondary" className="gap-1">
            {monthLabel}
            {hasMonthFilter && (
              <button
                type="button"
                onClick={onClearMonth}
                aria-label={t('kpiBrief.clearFilter')}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>

          {personName && (
            <Badge variant="secondary" className="gap-1">
              {personName}
              <button
                type="button"
                onClick={onClearPerson}
                aria-label={t('kpiBrief.clearFilter')}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          )}

          {statusFilter && (
            <Badge variant="secondary" className="gap-1">
              {t(`kpiBrief.status.${statusFilter}`)}
              <button
                type="button"
                onClick={onClearStatus}
                aria-label={t('kpiBrief.clearFilter')}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
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
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {cases.map((c) => {
                const reportPreview = getLastReportText(
                  c.task.last_report,
                  Boolean(c.task.is_cycle),
                  t,
                )
                return (
                  <Link
                    key={c.tkey}
                    to={APP_ROUTES.TASK_DETAIL(c.task.id)}
                    className="block space-y-1.5 py-3 hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        <span className="text-primary">#{c.task.id}</span> {c.task.title}
                      </span>
                      <KpiBriefStatusBadge status={c.status} className="shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">{c.names.join(', ')}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatShortDateTime(c.plan)}
                      {c.overdueDays != null && (
                        <span className="ml-2 font-semibold text-destructive">
                          {t('kpiBrief.cases.overdueDaysShort', { days: c.overdueDays })}
                        </span>
                      )}
                      <span className="ml-2 font-semibold text-primary">{c.task.progress}%</span>
                    </p>
                    <p className="rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                      {reportPreview}
                    </p>
                  </Link>
                )
              })}
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
                    <th className="px-2 py-2 text-right">{t('kpiBrief.cases.overdueDays')}</th>
                    <th className="px-2 py-2 text-right">{t('kpiBrief.cases.progress')}</th>
                    <th className="px-2 py-2">{t('kpiBrief.cases.reqDept')}</th>
                    <th className="w-[26%] px-2 py-2">{t('kpiBrief.cases.lastReport')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cases.map((c) => {
                    const rec = Boolean(c.task.is_cycle) || isRecurringTask({ recur_type: c.task.recur_type ?? 'once' })
                    const reqDepts = parseReqDepts(c.task.req_depts, c.task.req_dept)
                      .map(resolveDeptLabel)
                      .join(', ')
                    const taskHref = APP_ROUTES.TASK_DETAIL(c.task.id)
                    return (
                      <tr key={c.tkey} className="align-top transition-colors hover:bg-muted/40">
                        <td className="whitespace-nowrap px-2 py-2.5 font-semibold tabular-nums">
                          <Link to={taskHref} className="text-primary hover:underline">
                            #{c.task.id}
                          </Link>
                          {rec && (
                            <span className="block text-[10px] font-normal text-muted-foreground">
                              {c.task.cycle_date || c.task.recur_cycle_date || ''}
                            </span>
                          )}
                        </td>
                        <td className="min-w-[180px] px-2 py-2.5 font-medium text-foreground">
                          <Link to={taskHref} className="hover:text-primary hover:underline">
                            {c.task.title}
                          </Link>
                          {c.task.task_type && (
                            <span className="block text-[10px] text-muted-foreground">
                              {c.task.task_type}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-foreground">{c.names.join(', ')}</td>
                        <td className="px-2 py-2.5">
                          <KpiBriefStatusBadge status={c.status} />
                          {c.status === 'paused' && c.task.pause_reason && (
                            <span className="mt-1 block text-[10px] text-muted-foreground">
                              {c.task.pause_reason}
                            </span>
                          )}
                        </td>
                        <td
                          className={cn(
                            'whitespace-nowrap px-2 py-2.5 tabular-nums',
                            c.status === 'overdue' ? 'font-semibold text-destructive' : 'text-foreground',
                          )}
                        >
                          {formatShortDateTime(c.plan)}
                        </td>
                        <td
                          className={cn(
                            'px-2 py-2.5 text-right font-semibold tabular-nums',
                            c.overdueDays ? 'text-destructive' : 'text-muted-foreground',
                          )}
                        >
                          {c.overdueDays ?? '-'}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${c.task.progress}%` }}
                              />
                            </div>
                            <span className="font-semibold text-primary">{c.task.progress}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-muted-foreground">{reqDepts || '-'}</td>
                        <td className="px-2 py-2.5 text-muted-foreground whitespace-pre-wrap break-words">
                          {getLastReportText(c.task.last_report, Boolean(c.task.is_cycle), t)}
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
