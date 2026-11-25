import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@/components/ui/data-table'
import { cn } from '@/utils/cn'
import { BRIEF_SAMPLE_MIN, type BriefPersonRow } from '../utils/kpi-brief-domain'

export function useKpiBriefPeopleColumns({
  selectedPersonKey,
  meKey,
  resolveDeptLabel,
  onSelectPerson,
}: {
  selectedPersonKey: string
  meKey: string
  resolveDeptLabel: (raw: string) => string
  onSelectPerson: (key: string) => void
}): ColumnDef<BriefPersonRow>[] {
  const { t } = useTranslation()

  return [
    {
      id: 'person',
      header: t('kpiBrief.table.person'),
      meta: {
        minWidth: '150px',
        headerClassName: 'px-2 py-2',
        cellClassName: 'min-w-[150px] px-2 py-2',
      },
      cell: ({ row }) => {
        const p = row.original
        const selected = selectedPersonKey === p.key
        const isMe = p.key === meKey
        return (
          <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelectPerson(p.key)}
            className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <span className="flex flex-wrap items-center gap-1">
              <span className="font-semibold text-foreground hover:text-primary whitespace-nowrap">
                {p.fullname}
              </span>
              {isMe && (
                <Badge variant="secondary" className="text-[10px]">
                  {t('kpiBrief.meTag')}
                </Badge>
              )}
              {p.total < BRIEF_SAMPLE_MIN && (
                <Badge variant="outline" className="border-warning/40 text-[10px] text-warning">
                  {t('kpiBrief.lowSample')}
                </Badge>
              )}
            </span>
            <span className="block text-[11px] text-muted-foreground whitespace-nowrap">
              {p.username}
              {p.deptRaw ? ` · ${resolveDeptLabel(p.deptRaw)}` : ''}
            </span>
          </button>
        )
      },
    },
    {
      id: 'total',
      header: t('kpiBrief.table.total'),
      meta: {
        align: 'right',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2 font-semibold tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => row.original.total,
    },
    {
      id: 'ontime',
      header: t('kpiBrief.status.ontime'),
      meta: {
        align: 'right',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2 font-semibold tabular-nums text-success whitespace-nowrap',
      },
      cell: ({ row }) => row.original.ontime,
    },
    {
      id: 'late',
      header: t('kpiBrief.status.late'),
      meta: {
        align: 'right',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2 font-semibold tabular-nums text-warning whitespace-nowrap',
      },
      cell: ({ row }) => row.original.late,
    },
    {
      id: 'overdue',
      header: t('kpiBrief.status.overdue'),
      meta: {
        align: 'right',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2 font-semibold tabular-nums whitespace-nowrap',
      },
      cell: ({ row }) => (
        <span className={cn(row.original.overdue > 0 ? 'text-destructive' : 'text-muted-foreground')}>
          {row.original.overdue}
        </span>
      ),
    },
    {
      id: 'completionBar',
      header: t('kpiBrief.table.completionRate'),
      meta: {
        width: '22%',
        minWidth: '96px',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2',
      },
      cell: ({ row }) => {
        const p = row.original
        const ontimePct = p.total > 0 ? (p.ontime / p.total) * 100 : 0
        const latePct = p.total > 0 ? (p.late / p.total) * 100 : 0
        return (
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            aria-hidden="true"
          >
            <div className="bg-success" style={{ width: `${ontimePct}%` }} />
            <div className="bg-warning" style={{ width: `${latePct}%` }} />
          </div>
        )
      },
    },
    {
      id: 'completionRate',
      header: () => <span className="sr-only">{t('kpiBrief.table.completionRate')}</span>,
      meta: {
        align: 'right',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2 font-bold tabular-nums text-foreground whitespace-nowrap',
      },
      cell: ({ row }) => `${row.original.rate}%`,
    },
    {
      id: 'ontimeRate',
      header: t('kpiBrief.table.ontimeRate'),
      meta: {
        align: 'right',
        headerClassName: 'px-1.5 py-2',
        cellClassName: 'px-1.5 py-2 font-medium tabular-nums text-muted-foreground whitespace-nowrap',
      },
      cell: ({ row }) => `${row.original.ontimeRate}%`,
    },
  ]
}
