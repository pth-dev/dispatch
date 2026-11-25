import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { ColumnDef } from '@/components/ui/data-table'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils/cn'
import { isRecurringTask, parseReqDepts } from '@/utils/task-domain'
import { KpiBriefStatusBadge } from '../components/KpiBriefStatusBadge'
import type { BriefCaseRow } from '../utils/kpi-brief-domain'
import { formatShortDateTime } from '../utils/kpi-export'

export function getBriefLastReportText(
  raw: unknown,
  isCycle: boolean,
  t: (key: string) => string,
): string {
  if (isCycle) return t('kpiBrief.cases.archivedCycle')
  const text = typeof raw === 'string' ? raw.replace(/\r\n?/g, '\n').trim() : ''
  if (!text) return t('kpiBrief.cases.noReport')
  return text.length > 140 ? `${text.slice(0, 140)}…` : text
}

export function useKpiBriefUnfinishedColumns({
  resolveDeptLabel,
}: {
  resolveDeptLabel: (raw: string) => string
}): ColumnDef<BriefCaseRow>[] {
  const { t } = useTranslation()

  return [
    {
      id: 'id',
      header: t('kpiBrief.cases.id'),
      meta: {
        width: '92px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5 font-semibold tabular-nums',
      },
      cell: ({ row }) => {
        const c = row.original
        const rec =
          Boolean(c.task.is_cycle) || isRecurringTask({ recur_type: c.task.recur_type ?? 'once' })
        return (
          <>
            <Link to={APP_ROUTES.TASK_DETAIL(c.task.id)} className="text-primary hover:underline">
              #{c.task.id}
            </Link>
            {rec && (
              <span className="block text-[10px] font-normal text-muted-foreground">
                {c.task.cycle_date || c.task.recur_cycle_date || ''}
              </span>
            )}
          </>
        )
      },
    },
    {
      id: 'title',
      header: t('kpiBrief.cases.title'),
      meta: {
        minWidth: '220px',
        maxWidth: '320px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'min-w-[220px] max-w-[320px] px-2.5 py-2.5 font-medium text-foreground',
      },
      cell: ({ row }) => {
        const c = row.original
        return (
          <>
            <Link
              to={APP_ROUTES.TASK_DETAIL(c.task.id)}
              title={c.task.title}
              className="line-clamp-2 hover:text-primary hover:underline"
            >
              {c.task.title}
            </Link>
            {c.task.task_type && (
              <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                {c.task.task_type}
              </span>
            )}
          </>
        )
      },
    },
    {
      id: 'assignee',
      header: t('kpiBrief.cases.assignee'),
      meta: {
        minWidth: '150px',
        maxWidth: '220px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'min-w-[150px] max-w-[220px] px-2.5 py-2.5 text-foreground',
      },
      cell: ({ row }) => {
        const fullNames = row.original.names.join(', ')
        return (
          <span className="line-clamp-2 break-words font-medium" title={fullNames}>
            {fullNames}
          </span>
        )
      },
    },
    {
      id: 'status',
      header: t('kpiBrief.cases.status'),
      meta: {
        minWidth: '132px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5',
      },
      cell: ({ row }) => {
        const c = row.original
        return (
          <>
            <KpiBriefStatusBadge status={c.status} />
            {c.status === 'paused' && c.task.pause_reason && (
              <span className="mt-1 block max-w-[140px] truncate text-[10px] text-muted-foreground">
                {c.task.pause_reason}
              </span>
            )}
          </>
        )
      },
    },
    {
      id: 'planDate',
      header: t('kpiBrief.cases.planDate'),
      meta: {
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5 tabular-nums',
      },
      cell: ({ row }) => (
        <span
          className={
            row.original.status === 'overdue'
              ? 'font-semibold text-destructive'
              : 'text-foreground'
          }
        >
          {formatShortDateTime(row.original.plan)}
        </span>
      ),
    },
    {
      id: 'overdueDays',
      header: t('kpiBrief.cases.overdueDays'),
      meta: {
        align: 'right',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5 font-semibold tabular-nums',
      },
      cell: ({ row }) => (
        <span
          className={cn(row.original.overdueDays ? 'text-destructive' : 'text-muted-foreground')}
        >
          {row.original.overdueDays ?? '-'}
        </span>
      ),
    },
    {
      id: 'progress',
      header: t('kpiBrief.cases.progress'),
      meta: {
        align: 'right',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5 tabular-nums',
      },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary"
              style={{ width: `${row.original.task.progress}%` }}
            />
          </div>
          <span className="font-semibold text-primary">{row.original.task.progress}%</span>
        </div>
      ),
    },
    {
      id: 'reqDept',
      header: t('kpiBrief.cases.reqDept'),
      meta: {
        minWidth: '110px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'min-w-[110px] px-2.5 py-2.5 text-muted-foreground',
      },
      cell: ({ row }) => {
        const reqDepts = parseReqDepts(row.original.task.req_depts, row.original.task.req_dept)
          .map(resolveDeptLabel)
          .join(', ')
        return (
          <span className="line-clamp-2" title={reqDepts || '-'}>
            {reqDepts || '-'}
          </span>
        )
      },
    },
    {
      id: 'lastReport',
      header: t('kpiBrief.cases.lastReport'),
      meta: {
        minWidth: '200px',
        maxWidth: '280px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'min-w-[200px] max-w-[280px] px-2.5 py-2.5 text-muted-foreground',
      },
      cell: ({ row }) => {
        const text = getBriefLastReportText(
          row.original.task.last_report,
          Boolean(row.original.task.is_cycle),
          t,
        )
        return (
          <span className="line-clamp-2 break-words" title={text}>
            {text}
          </span>
        )
      },
    },
  ]
}
