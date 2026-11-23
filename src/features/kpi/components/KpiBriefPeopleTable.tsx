import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { BRIEF_SAMPLE_MIN, type BriefPersonRow } from '../utils/kpi-brief-domain'

export interface KpiBriefPeopleTableProps {
  people: readonly BriefPersonRow[]
  selectedPersonKey: string
  meKey: string
  resolveDeptLabel: (raw: string) => string
  onSelectPerson: (key: string) => void
}

export function KpiBriefPeopleTable({
  people,
  selectedPersonKey,
  meKey,
  resolveDeptLabel,
  onSelectPerson,
}: KpiBriefPeopleTableProps) {
  const { t } = useTranslation()

  return (
    <Card className="p-4 space-y-3 min-w-0">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t('kpiBrief.people.title')}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('kpiBrief.people.subtitle')}</p>
      </div>

      {people.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('kpiBrief.empty')}
        </p>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="divide-y divide-border md:hidden">
            {people.map((p) => {
              const selected = selectedPersonKey === p.key
              const isMe = p.key === meKey
              const ontimePct = p.total > 0 ? (p.ontime / p.total) * 100 : 0
              const latePct = p.total > 0 ? (p.late / p.total) * 100 : 0
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectPerson(p.key)}
                  className={cn(
                    'w-full space-y-1.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'bg-primary-soft/40 px-2 rounded-lg' : 'hover:bg-muted/30',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-foreground">
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
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                      {p.rate}%
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="bg-success" style={{ width: `${ontimePct}%` }} />
                    <div className="bg-warning" style={{ width: `${latePct}%` }} />
                  </div>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {t('kpiBrief.people.mobileStats', {
                      total: p.total,
                      ontime: p.ontime,
                      late: p.late,
                      overdue: p.overdue,
                      ontimeRate: p.ontimeRate,
                    })}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-border text-[11px] font-medium text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">{t('kpiBrief.table.person')}</th>
                  <th className="px-2 py-2 text-right">{t('kpiBrief.table.total')}</th>
                  <th className="px-2 py-2 text-right">{t('kpiBrief.status.ontime')}</th>
                  <th className="px-2 py-2 text-right">{t('kpiBrief.status.late')}</th>
                  <th className="px-2 py-2 text-right">{t('kpiBrief.status.overdue')}</th>
                  <th className="w-[32%] px-2 py-2">{t('kpiBrief.table.completionRate')}</th>
                  <th className="px-2 py-2 text-right" aria-label={t('kpiBrief.table.completionRate')} />
                  <th className="px-2 py-2 text-right">{t('kpiBrief.table.ontimeRate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {people.map((p) => {
                  const selected = selectedPersonKey === p.key
                  const isMe = p.key === meKey
                  const ontimePct = p.total > 0 ? (p.ontime / p.total) * 100 : 0
                  const latePct = p.total > 0 ? (p.late / p.total) * 100 : 0
                  return (
                    <tr
                      key={p.key}
                      className={cn(
                        'transition-colors',
                        selected ? 'bg-primary-soft/45' : 'hover:bg-muted/40',
                      )}
                    >
                      <td className="px-2 py-2.5">
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => onSelectPerson(p.key)}
                          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                        >
                          <span className="flex flex-wrap items-center gap-1">
                            <span className="font-semibold text-foreground hover:text-primary">
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
                          <span className="block text-[11px] text-muted-foreground">
                            {p.username}
                            {p.deptRaw ? ` · ${resolveDeptLabel(p.deptRaw)}` : ''}
                          </span>
                        </button>
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold tabular-nums">
                        {p.total}
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-success">
                        {p.ontime}
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-warning">
                        {p.late}
                      </td>
                      <td
                        className={cn(
                          'px-2 py-2.5 text-right font-semibold tabular-nums',
                          p.overdue > 0 ? 'text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        {p.overdue}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="bg-success" style={{ width: `${ontimePct}%` }} />
                          <div className="bg-warning" style={{ width: `${latePct}%` }} />
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold tabular-nums text-foreground">
                        {p.rate}%
                      </td>
                      <td className="px-2 py-2.5 text-right font-medium tabular-nums text-muted-foreground">
                        {p.ontimeRate}%
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
  )
}
