import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import type { BriefAggregate, BriefPersonRow, BriefYear } from '../utils/kpi-brief-domain'

export interface KpiBriefPeriodBarProps {
  year: BriefYear
  month: number
  personKey: string
  meKey: string
  years: readonly number[]
  monthCounts: Readonly<Record<number, number>>
  people: readonly BriefPersonRow[]
  allAggregate: BriefAggregate
  syncedLabel: string
  onYearChange: (year: BriefYear) => void
  onMonthChange: (month: number) => void
  onPersonChange: (key: string) => void
}

const CHIP_BASE =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function KpiBriefPeriodBar({
  year,
  month,
  personKey,
  meKey,
  years,
  monthCounts,
  people,
  allAggregate,
  syncedLabel,
  onYearChange,
  onMonthChange,
  onPersonChange,
}: KpiBriefPeriodBarProps) {
  const { t } = useTranslation()

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t('kpiBrief.filters.year')}
            value={String(year)}
            onChange={(e) => {
              const v = e.target.value
              onYearChange(v === 'all' ? 'all' : Number(v))
            }}
            className="h-11 lg:h-10 rounded-md border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {t('kpiBrief.filters.yearItem', { year: y })}
              </option>
            ))}
            <option value="all">{t('kpiBrief.filters.allYears')}</option>
          </select>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => onMonthChange(0)}
              aria-pressed={month === 0}
              className={cn(
                CHIP_BASE,
                month === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {t('kpiBrief.filters.allMonths')}
            </button>
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMonthChange(m)}
                aria-pressed={month === m}
                title={t('kpiBrief.filters.monthCount', { count: monthCounts[m] ?? 0 })}
                className={cn(
                  CHIP_BASE,
                  month === m
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {t('kpiBrief.filters.monthShort', { month: m })}
              </button>
            ))}
          </div>
        </div>

        {syncedLabel && (
          <p className="text-[11px] text-muted-foreground lg:ml-auto">{syncedLabel}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-start">
        <span className="pt-1.5 text-xs font-semibold text-muted-foreground shrink-0">
          {t('kpiBrief.filters.people')}
        </span>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => onPersonChange('')}
            aria-pressed={!personKey}
            className={cn(
              CHIP_BASE,
              !personKey
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <span>{t('kpiBrief.filters.allPeople')}</span>
            <span className="opacity-75 tabular-nums">{allAggregate.total}</span>
            {allAggregate.unfinished > 0 && (
              <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] tabular-nums">
                {allAggregate.unfinished}
              </Badge>
            )}
          </button>

          {people.map((p) => {
            const active = personKey === p.key
            const isMe = p.key === meKey
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onPersonChange(p.key)}
                aria-pressed={active}
                className={cn(
                  CHIP_BASE,
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <span>{p.fullname}</span>
                {isMe && (
                  <span
                    className={cn(
                      'rounded px-1 text-[10px]',
                      active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary-soft text-primary',
                    )}
                  >
                    {t('kpiBrief.meTag')}
                  </span>
                )}
                <span className="opacity-75 tabular-nums">{p.total}</span>
                {p.unfinished > 0 && (
                  <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] tabular-nums">
                    {p.unfinished}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
