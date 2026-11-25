import { useTranslation } from 'react-i18next'
import { MessageSquare, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import type { WorkItem } from '@/schemas/task'
import { useDeptNameResolver } from '../hooks/use-dept-name-resolver'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'
import type {
  WorkItemDayCalc,
  WorkItemRemainRow,
  WorkItemReportStat,
} from '../utils/work-items-domain'

export type WorkItemBoardRow = {
  item: WorkItem
  originalIndex: number
  calc: WorkItemDayCalc
  share: number
  remain?: WorkItemRemainRow
  stat?: WorkItemReportStat
}

type WorkItemsBoardViewProps = {
  rows: WorkItemBoardRow[]
  canReport: boolean
  activeFilterTopicId: string
  onReportTopic: (topicId: string) => void
  onFilterTopic: (topicId: string) => void
}

function WarnStatusText({ row }: { row?: WorkItemRemainRow }) {
  const { t } = useTranslation()
  if (!row || !row.ok || row.done || !row.level) return null
  if (row.level === 'over') {
    return <span className="text-[11px] font-semibold text-destructive">{t('tasks.project.warnOverdue')}</span>
  }
  if (row.level === 'urgent') {
    return (
      <span className="text-[11px] font-semibold text-destructive">
        {t('tasks.project.warnUrgent', { days: row.remain })}
      </span>
    )
  }
  return (
    <span className="text-[11px] font-semibold text-warning">
      {t('tasks.project.warnSoon', { days: row.remain })}
    </span>
  )
}

export function WorkItemsBoardView({
  rows,
  canReport,
  activeFilterTopicId,
  onReportTopic,
  onFilterTopic,
}: WorkItemsBoardViewProps) {
  const { t } = useTranslation()
  const { resolveUser } = useUserDisplayResolver()
  const resolveDept = useDeptNameResolver()

  const columns: ColumnDef<WorkItemBoardRow>[] = [
    {
      id: 'index',
      header: '#',
      meta: {
        width: '40px',
        headerClassName: 'py-2 pr-2 pl-0 text-primary font-semibold',
        cellClassName: 'py-2 pr-2 pl-0 text-muted-foreground tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.originalIndex + 1,
    },
    {
      id: 'topic',
      header: t('tasks.detail.workItemTopic'),
      meta: {
        minWidth: '220px',
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'min-w-[220px] py-2 pr-3 pl-0',
      },
      cell: ({ row }) => {
        const { item, remain, stat } = row.original
        return (
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-foreground">{item.topic || '-'}</span>
              {stat?.topicEarly && (
                <span className="text-[11px] font-medium text-success">
                  {t('tasks.project.earlyDoneBadge')}
                </span>
              )}
              <WarnStatusText row={remain} />
            </div>
            {item.content && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">{item.content}</p>
            )}
            {item.risk && (
              <p className="text-[11px] text-warning line-clamp-1">
                {t('tasks.project.risk')}: {item.risk}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: 'owner',
      header: t('tasks.detail.workItemOwner'),
      meta: {
        minWidth: '140px',
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'min-w-[140px] py-2 pr-3 pl-0 text-muted-foreground',
      },
      cell: ({ row }) => {
        const { item } = row.original
        const owner = resolveUser(item.owner) || '-'
        const agent = item.agent ? ` (${resolveUser(item.agent)})` : ''
        const ou = item.owner_ou ? resolveDept(item.owner_ou) : ''
        return (
          <div className="space-y-0.5 text-xs">
            <div className="text-foreground">
              {owner}
              {agent}
            </div>
            {ou && <div className="text-[11px] text-muted-foreground">{ou}</div>}
          </div>
        )
      },
    },
    {
      id: 'dates',
      header: t('tasks.detail.workItemDates'),
      meta: {
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'py-2 pr-3 pl-0 whitespace-nowrap text-muted-foreground tabular-nums',
      },
      cell: ({ row }) => {
        const { item, calc, share } = row.original
        return (
          <div className="space-y-0.5">
            <div>
              {item.start ? item.start.replace('T', ' ').slice(0, 16) : '-'} ~{' '}
              {item.end ? item.end.replace('T', ' ').slice(0, 16) : '-'}
            </div>
            {calc.gross > 0 && (
              <div className="text-[11px] text-muted-foreground">
                {t('tasks.project.itemDaysBadge', {
                  net: calc.net,
                  share: share.toFixed(1),
                })}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'progress',
      header: t('tasks.detail.workItemProgress'),
      meta: {
        width: '120px',
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'py-2 pr-3 pl-0 tabular-nums',
      },
      cell: ({ row }) => {
        const pg = row.original.stat?.topicProgress ?? row.original.item.progress ?? 0
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span>{pg}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={pg >= 100 ? 'h-full bg-success' : 'h-full bg-primary'}
                style={{ width: `${Math.min(100, Math.max(0, pg))}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: t('tasks.project.reportsCol'),
      meta: {
        align: 'right',
        headerClassName: 'py-2 px-0 text-primary font-semibold',
        cellClassName: 'py-2 px-0 whitespace-nowrap',
      },
      cell: ({ row }) => {
        const { item, stat } = row.original
        const isFiltered = activeFilterTopicId === item.id
        return (
          <div className="inline-flex items-center gap-1">
            <Button
              type="button"
              variant={isFiltered ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-[11px]"
              aria-pressed={isFiltered}
              aria-label={`${t('tasks.project.reportsCol')}: ${item.topic} (${stat?.count ?? 0})`}
              onClick={() => onFilterTopic(isFiltered ? '' : item.id)}
            >
              <MessageSquare className="size-3" aria-hidden="true" />
              <span className="tabular-nums">{stat?.count ?? 0}</span>
            </Button>
            {canReport && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => onReportTopic(item.id)}
              >
                <PenLine className="size-3" aria-hidden="true" />
                <span>{t('tasks.project.quickReport')}</span>
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      variant="embedded"
      data={rows}
      columns={columns}
      keyExtractor={(row) => row.item.id}
      emptyMessage={t('tasks.project.emptyFiltered')}
      enablePagination={rows.length > 10}
      initialPageSize={10}
      mobileBreakpoint="md"
      mobileContainerClassName="divide-y-0 space-y-2.5"
      mobileItemClassName={() => 'p-0'}
      headerClassName="bg-transparent"
      renderMobileCard={(row) => {
        const { item, originalIndex, remain, stat } = row
        const pg = stat?.topicProgress ?? item.progress ?? 0
        const isFiltered = activeFilterTopicId === item.id
        return (
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-medium text-foreground">
                  <span className="mr-1.5 font-semibold text-primary">#{originalIndex + 1}</span>
                  <span>{item.topic || '-'}</span>
                </div>
                <WarnStatusText row={remain} />
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
                {pg}%
              </span>
            </div>

            {item.content && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">{item.content}</p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-border/60 text-[11px] text-muted-foreground">
              <span>
                {resolveUser(item.owner) || '-'}
                {item.owner_ou ? ` • ${resolveDept(item.owner_ou)}` : ''}
              </span>
              <span className="tabular-nums">
                {item.start ? item.start.slice(0, 10) : '-'} ~ {item.end ? item.end.slice(0, 10) : '-'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <Button
                type="button"
                variant={isFiltered ? 'default' : 'outline'}
                size="sm"
                className="h-8 px-2.5 text-xs"
                aria-pressed={isFiltered}
                aria-label={`${t('tasks.project.reportsCol')}: ${item.topic} (${stat?.count ?? 0})`}
                onClick={() => onFilterTopic(isFiltered ? '' : item.id)}
              >
                <MessageSquare className="size-3.5" aria-hidden="true" />
                <span className="tabular-nums">{stat?.count ?? 0}</span>
              </Button>
              {canReport && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => onReportTopic(item.id)}
                >
                  <PenLine className="size-3.5" aria-hidden="true" />
                  <span>{t('tasks.project.quickReport')}</span>
                </Button>
              )}
            </div>
          </div>
        )
      }}
    />
  )
}
