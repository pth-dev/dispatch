import { useTranslation } from 'react-i18next'
import type { ColumnDef } from '@/components/ui/data-table'
import { cn } from '@/utils/cn'
import { parseLocalDateTime, parseReqDepts } from '@/utils/task-domain'
import { KpiBriefStatusBadge } from '../components/KpiBriefStatusBadge'
import type { BriefCaseRow } from '../utils/kpi-brief-domain'
import { formatShortDateTime } from '../utils/kpi-export'

export function useKpiBriefFinishedColumns({
  resolveDeptLabel,
  onOpenFinishedDetail,
}: {
  resolveDeptLabel: (raw: string) => string
  onOpenFinishedDetail: (item: BriefCaseRow) => void
}): ColumnDef<BriefCaseRow>[] {
  const { t } = useTranslation()

  return [
    {
      id: 'id',
      header: t('kpiBrief.cases.id'),
      meta: {
        width: '84px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5 font-semibold tabular-nums',
      },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenFinishedDetail(row.original)
          }}
          className="text-success hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          #{row.original.task.id}
        </button>
      ),
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
      cell: ({ row }) => (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenFinishedDetail(row.original)
            }}
            title={row.original.task.title}
            className="line-clamp-2 text-left hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {row.original.task.title}
          </button>
          {row.original.task.task_type && (
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              {row.original.task.task_type}
            </span>
          )}
        </>
      ),
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
        minWidth: '124px',
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5',
      },
      cell: ({ row }) => <KpiBriefStatusBadge status={row.original.status} />,
    },
    {
      id: 'planDate',
      header: t('kpiBrief.cases.planDate'),
      meta: {
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5 tabular-nums text-muted-foreground',
      },
      cell: ({ row }) => formatShortDateTime(row.original.plan),
    },
    {
      id: 'finishDate',
      header: t('kpiBrief.cases.finishDate'),
      meta: {
        headerClassName: 'px-2.5 py-2',
        cellClassName: 'whitespace-nowrap px-2.5 py-2.5 font-medium tabular-nums',
      },
      cell: ({ row }) => (
        <span className={row.original.status === 'late' ? 'text-warning' : 'text-success'}>
          {formatShortDateTime(parseLocalDateTime(row.original.task.finish_date)) || '-'}
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
        <span className={cn(row.original.lateDays ? 'text-warning' : 'text-muted-foreground')}>
          {row.original.lateDays ?? '-'}
        </span>
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
        const raw = row.original.task.last_report
        const text =
          typeof raw === 'string' && raw.trim()
            ? raw.trim().slice(0, 140)
            : t('kpiBrief.cases.noReport')
        return (
          <span className="line-clamp-2 break-words" title={text}>
            {text}
          </span>
        )
      },
    },
  ]
}
