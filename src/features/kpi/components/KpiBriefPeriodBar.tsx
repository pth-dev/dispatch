import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import type { BriefAggregate, BriefPersonRow, BriefYear } from '../utils/kpi-brief-domain'
import { KpiBriefPersonPicker } from './KpiBriefPersonPicker'

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
    <Card className="p-3.5 space-y-2.5">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t('kpiBrief.filters.year')}
            value={String(year)}
            onChange={(e) => {
              const v = e.target.value
              onYearChange(v === 'all' ? 'all' : Number(v))
            }}
            className="h-10 rounded-md border border-input bg-card px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      <div className="border-t border-border/60 pt-2.5">
        <KpiBriefPersonPicker
          people={people}
          selectedPersonKey={personKey}
          meKey={meKey}
          allAggregate={allAggregate}
          onSelectPerson={onPersonChange}
        />
      </div>
    </Card>
  )
}
