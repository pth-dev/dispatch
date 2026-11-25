import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ListChecks } from 'lucide-react'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import type { WorkItem, WorkItemsEnvelope } from '@/schemas/task'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'

type WorkItemsReadOnlyProps = {
  envelope: WorkItemsEnvelope | null
}

function WorkItemMobileCard({
  item,
  index,
  resolveUser,
  ownerLabelText,
}: {
  item: WorkItem
  index: number
  resolveUser: (raw?: string | null) => string
  ownerLabelText: string
}): React.ReactElement {
  const ownerLabel = resolveUser(item.owner) || '-'
  const agentLabel = item.agent ? ` (${resolveUser(item.agent)})` : ''
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 font-medium text-foreground">
          <span className="mr-1.5 font-semibold text-primary">#{index + 1}</span>
          <span>{item.topic || '-'}</span>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground">
          {typeof item.progress === 'number' ? `${item.progress}%` : '-'}
        </span>
      </div>
      {item.content && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{item.content}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
        <span className="min-w-0 break-words">
          {ownerLabelText}: {ownerLabel}
          {agentLabel}
        </span>
        <span className="shrink-0 tabular-nums">
          {item.start || '-'} ~ {item.end || '-'}
        </span>
      </div>
    </div>
  )
}

export function WorkItemsReadOnly({
  envelope,
}: WorkItemsReadOnlyProps): React.ReactElement | null {
  const { t } = useTranslation()
  const { resolveUser } = useUserDisplayResolver()
  if (!envelope || envelope.items.length === 0) return null

  const columns: ColumnDef<WorkItem>[] = [
    {
      id: 'index',
      header: '#',
      meta: {
        width: '44px',
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'py-2 pr-3 pl-0 text-muted-foreground whitespace-nowrap tabular-nums',
      },
      cell: ({ row }) => row.index + 1,
    },
    {
      id: 'topic',
      header: t('tasks.detail.workItemTopic'),
      meta: {
        minWidth: '220px',
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'min-w-[220px] py-2 pr-3 pl-0',
      },
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-foreground">{row.original.topic || '-'}</div>
          {row.original.content && (
            <div className="text-[11px] text-muted-foreground line-clamp-2">
              {row.original.content}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'owner',
      header: t('tasks.detail.workItemOwner'),
      meta: {
        minWidth: '150px',
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'min-w-[150px] py-2 pr-3 pl-0 text-muted-foreground whitespace-nowrap',
      },
      cell: ({ row }) => {
        const owner = resolveUser(row.original.owner) || '-'
        const agent = row.original.agent ? ` (${resolveUser(row.original.agent)})` : ''
        const fullText = `${owner}${agent}`
        return <span title={fullText}>{fullText}</span>
      },
    },
    {
      id: 'dates',
      header: t('tasks.detail.workItemDates'),
      meta: {
        headerClassName: 'py-2 pr-3 pl-0 text-primary font-semibold',
        cellClassName: 'py-2 pr-3 pl-0 whitespace-nowrap text-muted-foreground tabular-nums',
      },
      cell: ({ row }) => `${row.original.start || '-'} ~ ${row.original.end || '-'}`,
    },
    {
      id: 'progress',
      header: t('tasks.detail.workItemProgress'),
      meta: {
        align: 'right',
        headerClassName: 'py-2 px-0 text-primary font-semibold',
        cellClassName: 'py-2 px-0 font-medium text-foreground whitespace-nowrap tabular-nums',
      },
      cell: ({ row }) =>
        typeof row.original.progress === 'number' ? `${row.original.progress}%` : '-',
    },
  ]

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListChecks className="size-4 text-primary" aria-hidden="true" />
          <span>{t('tasks.detail.workItemsTitle', { count: envelope.items.length })}</span>
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {t('tasks.detail.workItemsReadOnlyHint')}
        </span>
      </div>

      <DataTable
        variant="embedded"
        data={envelope.items}
        columns={columns}
        keyExtractor={(item) => String(item.id)}
        enablePagination
        initialPageSize={10}
        mobileBreakpoint="md"
        mobileContainerClassName="divide-y-0 space-y-2.5"
        mobileItemClassName={() => 'p-0'}
        headerClassName="bg-transparent"
        renderMobileCard={(item, idx) => (
          <WorkItemMobileCard
            item={item}
            index={idx}
            resolveUser={resolveUser}
            ownerLabelText={t('tasks.detail.workItemOwner')}
          />
        )}
      />
    </section>
  )
}
