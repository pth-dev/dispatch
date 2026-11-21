import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DERIVED_FILTER_STATUSES, STATUS_META } from '@/components/ui/status-text'
import { TASK_SORT_MODES, type TaskListParams, type TaskSortMode } from '@/schemas/task'
import { cn } from '@/utils'
import { getDeptDisplayName } from '../api/meta'
import { useMetaDepts, useMetaSites } from '../api/queries'
import type { TaskFilterPatch } from '../hooks/use-task-list-params'
import { ActiveFilterChips } from './ActiveFilterChips'
import { AdvancedFilterFields } from './AdvancedFilterFields'

const SEARCH_DEBOUNCE_MS = 250

type SearchFieldProps = {
  id?: string
  value: string
  inputClassName: string
  clearClassName: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onClear: () => void
}

function SearchField({
  id,
  value,
  inputClassName,
  clearClassName,
  onChange,
  onKeyDown,
  onClear,
}: SearchFieldProps) {
  const { t } = useTranslation()
  return (
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="text"
        aria-label={t('common.search')}
        placeholder={t('tasks.filter.searchPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('tasks.filter.clearSearch')}
          className={clearClassName}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

type FilterBarProps = {
  params: TaskListParams
  activeFilterCount: number
  advancedFilterCount: number
  availableTaskTypes: string[]
  onPatch: (patch: TaskFilterPatch) => void
  onSortChange: (sort: TaskSortMode) => void
  onReset: () => void
  className?: string
}

export function FilterBar({
  params,
  activeFilterCount,
  advancedFilterCount,
  availableTaskTypes,
  onPatch,
  onSortChange,
  onReset,
  className,
}: FilterBarProps) {
  const { t, i18n } = useTranslation()
  const { data: metaDepts } = useMetaDepts()
  const { data: metaSites } = useMetaSites()
  const departments = metaDepts?.depts ?? []
  const sites = metaSites?.sites ?? []

  const urlSearch = params.search ?? ''
  const [prevUrlSearch, setPrevUrlSearch] = React.useState(urlSearch)
  const [searchDraft, setSearchDraft] = React.useState(urlSearch)
  const [dateRangeError, setDateRangeError] = React.useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false)
  const debounceRef = React.useRef<number | null>(null)

  // Sync draft when URL search changes externally (browser Back/Forward or chip removal)
  if (prevUrlSearch !== urlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearchDraft(urlSearch)
  }

  React.useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchDraft(value)
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      onPatch({ search: value.trim() || undefined })
    }, SEARCH_DEBOUNCE_MS)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    onPatch({ search: searchDraft.trim() || undefined })
  }

  const handleClearSearch = () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    setSearchDraft('')
    onPatch({ search: undefined })
  }

  const handleDateChange = (field: 'fromDate' | 'toDate', value: string) => {
    const nextFrom = field === 'fromDate' ? value : (params.fromDate ?? '')
    const nextTo = field === 'toDate' ? value : (params.toDate ?? '')
    if (nextFrom && nextTo && nextFrom > nextTo) {
      setDateRangeError(true)
      return
    }
    setDateRangeError(false)
    onPatch({ [field]: value || undefined })
  }

  const handleResetAdvanced = () => {
    setDateRangeError(false)
    onPatch({
      fromDate: undefined,
      toDate: undefined,
      site: undefined,
      level: undefined,
      taskType: undefined,
      confidential: undefined,
      flags: [],
    })
  }

  const handleResetAll = () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    setSearchDraft('')
    setDateRangeError(false)
    onReset()
    setMobileSheetOpen(false)
  }

  const handleChipPatch = (patch: TaskFilterPatch) => {
    if ('search' in patch && !patch.search) {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
      setSearchDraft('')
    }
    onPatch(patch)
  }

  const renderStatusSelect = (id: string) => (
    <Select
      value={params.status ?? 'all'}
      onValueChange={(v) => onPatch({ status: v === 'all' ? undefined : v })}
    >
      <SelectTrigger id={id} aria-label={t('common.status')} className="h-11 lg:h-10 text-xs">
        <SelectValue placeholder={t('status.all')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-xs">
          {t('status.all')}
        </SelectItem>
        <SelectItem value="incomplete" className="text-xs font-medium">
          {t('status.incomplete')}
        </SelectItem>
        <SelectItem value="completed" className="text-xs font-medium">
          {t('status.completed')}
        </SelectItem>
        <SelectSeparator />
        {DERIVED_FILTER_STATUSES.map((st) => (
          <SelectItem key={st} value={st} className="text-xs">
            {t(STATUS_META[st].labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const renderDeptSelect = (id: string) => (
    <Select
      value={params.department ?? 'all'}
      onValueChange={(v) => onPatch({ department: v === 'all' ? undefined : v })}
    >
      <SelectTrigger id={id} aria-label={t('common.department')} className="h-11 lg:h-10 text-xs">
        <SelectValue placeholder={t('department.all')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-xs">
          {t('department.all')}
        </SelectItem>
        {departments.map((dept) => (
          <SelectItem key={dept.value} value={dept.value} className="text-xs">
            {getDeptDisplayName(dept, i18n.language)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  const renderSortSelect = (id: string) => (
    <Select value={params.sort ?? 'default'} onValueChange={(v) => onSortChange(v as TaskSortMode)}>
      <SelectTrigger id={id} aria-label={t('tasks.sort.label')} className="h-11 lg:h-10 text-xs">
        <span className="flex items-center gap-1.5 truncate">
          <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {TASK_SORT_MODES.map((mode) => (
          <SelectItem key={mode} value={mode} className="text-xs">
            {t(`tasks.sort.${mode}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className={cn('w-full flex flex-col gap-2 select-none', className)}>
      {/* ── Tier 1 Desktop Bar (>= lg): 1 compact row, instant apply ── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_175px_170px_175px_auto] items-center gap-2.5">
        <SearchField
          id="filter-search"
          value={searchDraft}
          inputClassName="h-10 text-xs pl-9 pr-8"
          clearClassName="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onClear={handleClearSearch}
        />

        {renderStatusSelect('filter-status')}
        {renderDeptSelect('filter-department')}
        {renderSortSelect('filter-sort')}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-10 px-3 text-xs gap-1.5 shrink-0',
                advancedFilterCount > 0 && 'border-primary text-primary font-semibold',
              )}
            >
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              <span>{t('tasks.filter.advanced')}</span>
              {advancedFilterCount > 0 && (
                <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {advancedFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[380px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold text-foreground">
                {t('tasks.filter.advanced')}
              </span>
              {advancedFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAdvanced}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  <span>{t('common.reset')}</span>
                </button>
              )}
            </div>
            <AdvancedFilterFields
              idPrefix="adv-desktop"
              params={params}
              sites={sites}
              availableTaskTypes={availableTaskTypes}
              dateRangeError={dateRangeError}
              onPatch={onPatch}
              onDateChange={handleDateChange}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Tier 1 Mobile Bar (< lg): Search + Bottom Sheet ── */}
      <div className="flex lg:hidden items-center gap-2">
        <SearchField
          value={searchDraft}
          inputClassName="h-11 text-xs pl-9 pr-8"
          clearClassName="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onClear={handleClearSearch}
        />

        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'h-11 px-3 text-xs gap-1.5 shrink-0',
                activeFilterCount > 0 && 'border-primary text-primary font-semibold',
              )}
            >
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              <span>{t('common.filter')}</span>
              {activeFilterCount > 0 && (
                <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <SheetHeader className="text-left border-b border-border pb-3">
              <SheetTitle className="text-base font-semibold text-foreground">
                {t('common.filter')}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label htmlFor="adv-mobile-status" className="font-semibold text-muted-foreground">
                    {t('common.status')}
                  </label>
                  {renderStatusSelect('adv-mobile-status')}
                </div>
                <div className="space-y-1">
                  <label htmlFor="adv-mobile-dept" className="font-semibold text-muted-foreground">
                    {t('common.department')}
                  </label>
                  {renderDeptSelect('adv-mobile-dept')}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="adv-mobile-sort" className="font-semibold text-muted-foreground">
                  {t('tasks.sort.label')}
                </label>
                {renderSortSelect('adv-mobile-sort')}
              </div>

              <AdvancedFilterFields
                idPrefix="adv-mobile"
                params={params}
                sites={sites}
                availableTaskTypes={availableTaskTypes}
                dateRangeError={dateRangeError}
                onPatch={onPatch}
                onDateChange={handleDateChange}
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAll}
                className="flex-1 h-11 text-xs gap-1.5"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                <span>{t('common.reset')}</span>
              </Button>
              <Button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="flex-1 h-11 text-xs"
              >
                {t('common.close')}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Tier 3: Individual Removable Active Filter Chips ── */}
      <ActiveFilterChips
        params={params}
        departments={departments}
        sites={sites}
        onPatch={handleChipPatch}
        onReset={handleResetAll}
      />
    </div>
  )
}
