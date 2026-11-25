import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/utils/cn'
import { useKpiBriefPeopleColumns } from '../hooks/use-kpi-brief-people-columns'
import { BRIEF_SAMPLE_MIN, type BriefPersonRow } from '../utils/kpi-brief-domain'

export type KpiBriefPeopleTableProps = {
  people: readonly BriefPersonRow[]
  selectedPersonKey: string
  meKey: string
  resolveDeptLabel: (raw: string) => string
  onSelectPerson: (key: string) => void
}

function BriefPersonMobileCard({
  person,
  selected,
  isMe,
  onSelectPerson,
  meTagLabel,
  lowSampleLabel,
  statsLabel,
}: {
  person: BriefPersonRow
  selected: boolean
  isMe: boolean
  onSelectPerson: (key: string) => void
  meTagLabel: string
  lowSampleLabel: string
  statsLabel: string
}): React.ReactElement {
  const ontimePct = person.total > 0 ? (person.ontime / person.total) * 100 : 0
  const latePct = person.total > 0 ? (person.late / person.total) * 100 : 0

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelectPerson(person.key)}
      className={cn(
        'w-full space-y-1.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'bg-primary-soft/40 px-2 rounded-lg' : 'hover:bg-muted/30',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">{person.fullname}</span>
          {isMe && (
            <Badge variant="secondary" className="text-[10px]">
              {meTagLabel}
            </Badge>
          )}
          {person.total < BRIEF_SAMPLE_MIN && (
            <Badge variant="outline" className="border-warning/40 text-[10px] text-warning">
              {lowSampleLabel}
            </Badge>
          )}
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
          {person.rate}%
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="bg-success" style={{ width: `${ontimePct}%` }} />
        <div className="bg-warning" style={{ width: `${latePct}%` }} />
      </div>
      <p className="text-[11px] tabular-nums text-muted-foreground">{statsLabel}</p>
    </button>
  )
}

export function KpiBriefPeopleTable({
  people,
  selectedPersonKey,
  meKey,
  resolveDeptLabel,
  onSelectPerson,
}: KpiBriefPeopleTableProps): React.ReactElement {
  const { t } = useTranslation()
  const columns = useKpiBriefPeopleColumns({
    selectedPersonKey,
    meKey,
    resolveDeptLabel,
    onSelectPerson,
  })

  return (
    <Card className="p-4 space-y-3 min-w-0">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t('kpiBrief.people.title')}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('kpiBrief.people.subtitle')}</p>
      </div>

      {people.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t('kpiBrief.empty')}</p>
      ) : (
        <DataTable
          variant="embedded"
          data={people}
          columns={columns}
          keyExtractor={(p) => p.key}
          enablePagination
          initialPageSize={10}
          mobileBreakpoint="md"
          mobileItemClassName={() => 'p-0'}
          tableClassName="min-w-[580px]"
          headerClassName="bg-transparent"
          rowClassName={(p) =>
            selectedPersonKey === p.key ? 'bg-primary-soft/45 hover:bg-primary-soft/45' : 'hover:bg-muted/40'
          }
          renderMobileCard={(p) => (
            <BriefPersonMobileCard
              person={p}
              selected={selectedPersonKey === p.key}
              isMe={p.key === meKey}
              onSelectPerson={onSelectPerson}
              meTagLabel={t('kpiBrief.meTag')}
              lowSampleLabel={t('kpiBrief.lowSample')}
              statsLabel={t('kpiBrief.people.mobileStats', {
                total: p.total,
                ontime: p.ontime,
                late: p.late,
                overdue: p.overdue,
                ontimeRate: p.ontimeRate,
              })}
            />
          )}
        />
      )}
    </Card>
  )
}
