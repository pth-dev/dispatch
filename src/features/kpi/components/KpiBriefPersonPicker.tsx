import * as React from 'react'
import { Check, ChevronsUpDown, Search, Users, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/cn'
import type { BriefAggregate, BriefPersonRow } from '../utils/kpi-brief-domain'

export interface KpiBriefPersonPickerProps {
  people: readonly BriefPersonRow[]
  selectedPersonKey: string
  meKey: string
  allAggregate: BriefAggregate
  onSelectPerson: (key: string) => void
}

const MAX_QUICK_HOTSPOTS = 4

function PersonPickerOption({
  person,
  active,
  isMe,
  meLabel,
  onSelect,
}: {
  person: BriefPersonRow
  active: boolean
  isMe: boolean
  meLabel: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/50',
        active && 'bg-primary-soft/50 font-semibold',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Check
          className={cn('size-3.5 shrink-0 text-primary', active ? 'opacity-100' : 'opacity-0')}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1">
            <span className="truncate text-foreground">{person.fullname}</span>
            {isMe && (
              <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                {meLabel}
              </Badge>
            )}
          </span>
          {person.username && person.username !== person.fullname && (
            <span className="block truncate text-[10px] text-muted-foreground">
              {person.username}
            </span>
          )}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
        <span className="text-muted-foreground">{person.total}</span>
        {person.unfinished > 0 && (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 px-1.5 py-0 text-[10px] font-semibold text-destructive"
          >
            {person.unfinished}
          </Badge>
        )}
      </span>
    </button>
  )
}

export function KpiBriefPersonPicker({
  people,
  selectedPersonKey,
  meKey,
  allAggregate,
  onSelectPerson,
}: KpiBriefPersonPickerProps) {
  const { t } = useTranslation()
  const listId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [onlyUnfinished, setOnlyUnfinished] = React.useState(false)

  const selectedPerson = people.find((p) => p.key === selectedPersonKey) ?? null

  const sortedPeople = [...people].sort(
    (a, b) =>
      b.unfinished - a.unfinished ||
      b.total - a.total ||
      a.fullname.localeCompare(b.fullname),
  )

  const needle = search.trim().toLowerCase()
  const filteredPeople = sortedPeople.filter((p) => {
    if (onlyUnfinished && p.unfinished === 0) return false
    if (!needle) return true
    return (
      p.fullname.toLowerCase().includes(needle) ||
      p.username.toLowerCase().includes(needle)
    )
  })

  const hotspots = sortedPeople
    .filter((p) => p.unfinished > 0)
    .slice(0, MAX_QUICK_HOTSPOTS)

  const unfinishedPeopleCount = people.filter((p) => p.unfinished > 0).length

  function handleChoose(key: string) {
    onSelectPerson(key)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            className="h-10 max-w-full justify-between gap-2 bg-card px-3 font-medium"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className={cn('truncate text-foreground', selectedPerson && 'font-semibold')}>
                {selectedPerson
                  ? selectedPerson.fullname
                  : t('kpiBrief.filters.allPeopleLabel', { count: people.length })}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {selectedPerson ? selectedPerson.total : allAggregate.total}
              </span>
              {(selectedPerson ? selectedPerson.unfinished : allAggregate.unfinished) > 0 && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-destructive/30 bg-destructive/10 px-1.5 py-0 text-[11px] font-semibold tabular-nums text-destructive"
                >
                  {selectedPerson ? selectedPerson.unfinished : allAggregate.unfinished}
                </Badge>
              )}
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[340px] max-w-[92vw] p-2">
          <div className="space-y-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t('kpiBrief.filters.searchPersonPlaceholder')}
                placeholder={t('kpiBrief.filters.searchPersonPlaceholder')}
                className="h-9 pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 text-xs">
              <button
                type="button"
                aria-pressed={!onlyUnfinished}
                onClick={() => setOnlyUnfinished(false)}
                className={cn(
                  'flex-1 rounded px-2 py-1 font-medium transition-colors',
                  !onlyUnfinished
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('kpiBrief.filters.allPeople')} ({people.length})
              </button>
              <button
                type="button"
                aria-pressed={onlyUnfinished}
                onClick={() => setOnlyUnfinished(true)}
                className={cn(
                  'flex-1 rounded px-2 py-1 font-medium transition-colors',
                  onlyUnfinished
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t('kpiBrief.filters.hasUnfinished')} ({unfinishedPeopleCount})
              </button>
            </div>

            <div
              id={listId}
              role="listbox"
              aria-label={t('kpiBrief.filters.people')}
              className="max-h-64 overflow-y-auto divide-y divide-border/60 rounded-md border border-border"
            >
              <button
                type="button"
                role="option"
                aria-selected={!selectedPersonKey}
                onClick={() => handleChoose('')}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/50',
                  !selectedPersonKey && 'bg-primary-soft/50 font-semibold',
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Check
                    className={cn(
                      'size-3.5 shrink-0 text-primary',
                      selectedPersonKey ? 'opacity-0' : 'opacity-100',
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate text-foreground">{t('kpiBrief.filters.allPeople')}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 tabular-nums">
                  <span className="text-muted-foreground">{allAggregate.total}</span>
                  {allAggregate.unfinished > 0 && (
                    <Badge
                      variant="outline"
                      className="border-destructive/30 bg-destructive/10 px-1.5 py-0 text-[10px] font-semibold text-destructive"
                    >
                      {allAggregate.unfinished}
                    </Badge>
                  )}
                </span>
              </button>

              {filteredPeople.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {t('kpiBrief.filters.noPersonMatch')}
                </p>
              ) : (
                filteredPeople.map((p) => (
                  <PersonPickerOption
                    key={p.key}
                    person={p}
                    active={selectedPersonKey === p.key}
                    isMe={p.key === meKey}
                    meLabel={t('kpiBrief.meTag')}
                    onSelect={() => handleChoose(p.key)}
                  />
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedPerson && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onSelectPerson('')}
          className="h-9 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" aria-hidden="true" />
          {t('kpiBrief.clearFilter')}
        </Button>
      )}

      {hotspots.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            {t('kpiBrief.filters.hotspots')}
          </span>
          {hotspots.map((p) => {
            const active = selectedPersonKey === p.key
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectPerson(p.key)}
                className={cn(
                  'inline-flex max-w-[180px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50',
                )}
              >
                <span className="truncate">{p.fullname}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
                    active
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {p.unfinished}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
