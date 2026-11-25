import { Info, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { DirectoryUser } from '@/schemas/auth'
import type { DeptItem } from '@/schemas/meta'
import { getDeptDisplayName } from '@/features/tasks/api/meta'
import type { KpiBasis, KpiQuickRange, KpiSortKey } from '../utils/kpi-people-domain'

const SORT_OPTIONS: readonly KpiSortKey[] = [
  'score',
  'total',
  'completion',
  'ontime',
  'overdue',
  'late',
  'response',
  'username',
]

const QUICK_RANGES: readonly KpiQuickRange[] = ['month', 'quarter', 'year']

export interface KpiPeopleFiltersProps {
  query: string
  dept: string
  startStr: string
  endStr: string
  basis: KpiBasis
  sort: KpiSortKey
  showEmpty: boolean
  printWithDetail: boolean
  depts: readonly DeptItem[]
  scopedPeople: readonly DirectoryUser[]
  onQueryChange: (val: string) => void
  onDeptChange: (val: string) => void
  onStartChange: (val: string) => void
  onEndChange: (val: string) => void
  onBasisChange: (val: KpiBasis) => void
  onSortChange: (val: KpiSortKey) => void
  onQuickRange: (range: KpiQuickRange) => void
  onShowEmptyChange: (val: boolean) => void
  onPrintWithDetailChange: (val: boolean) => void
  onReset: () => void
}

const SELECT_CLASS =
  'flex h-11 lg:h-10 w-full rounded-md border border-input bg-card px-2.5 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function KpiPeopleFilters({
  query,
  dept,
  startStr,
  endStr,
  basis,
  sort,
  showEmpty,
  printWithDetail,
  depts,
  scopedPeople,
  onQueryChange,
  onDeptChange,
  onStartChange,
  onEndChange,
  onBasisChange,
  onSortChange,
  onQuickRange,
  onShowEmptyChange,
  onPrintWithDetailChange,
  onReset,
}: KpiPeopleFiltersProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card className="p-4 space-y-3 print:hidden">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1">
          <label htmlFor="kpi-search" className="text-xs font-medium text-muted-foreground">
            {t('kpi.filters.personLabel')}
          </label>
          <Input
            id="kpi-search"
            list="kpi-people-datalist"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('kpi.filters.personPlaceholder')}
            className="bg-card"
          />
          <datalist id="kpi-people-datalist">
            {scopedPeople.slice(0, 500).map((u) => (
              <option key={u.username} value={u.username}>
                {u.fullname}
              </option>
            ))}
          </datalist>
        </div>

        <div className="space-y-1">
          <label htmlFor="kpi-dept" className="text-xs font-medium text-muted-foreground">
            {t('kpi.filters.deptLabel')}
          </label>
          <select
            id="kpi-dept"
            value={dept}
            onChange={(e) => onDeptChange(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">{t('kpi.filters.allDepts')}</option>
            {depts.map((d) => (
              <option key={d.value} value={d.value}>
                {getDeptDisplayName(d, i18n.language)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="kpi-start" className="text-xs font-medium text-muted-foreground">
            {t('kpi.filters.startDate')}
          </label>
          <Input
            id="kpi-start"
            type="date"
            value={startStr}
            onChange={(e) => onStartChange(e.target.value)}
            className="bg-card"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="kpi-end" className="text-xs font-medium text-muted-foreground">
            {t('kpi.filters.endDate')}
          </label>
          <Input
            id="kpi-end"
            type="date"
            value={endStr}
            onChange={(e) => onEndChange(e.target.value)}
            className="bg-card"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="kpi-basis" className="text-xs font-medium text-muted-foreground">
            {t('kpi.filters.basisLabel')}
          </label>
          <select
            id="kpi-basis"
            value={basis}
            onChange={(e) => onBasisChange(e.target.value as KpiBasis)}
            className={SELECT_CLASS}
          >
            <option value="final">{t('kpi.basis.final')}</option>
            <option value="created">{t('kpi.basis.created')}</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="kpi-sort" className="text-xs font-medium text-muted-foreground">
            {t('kpi.filters.sortLabel')}
          </label>
          <select
            id="kpi-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as KpiSortKey)}
            className={SELECT_CLASS}
          >
            {SORT_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {t(`kpi.sort.${key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-medium text-muted-foreground">
          {t('kpi.filters.quickRange')}
        </span>
        {QUICK_RANGES.map((range) => (
          <Button
            key={range}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onQuickRange(range)}
          >
            {t(`kpi.quickRange.${range}`)}
          </Button>
        ))}

        <label className="ml-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={showEmpty}
            onCheckedChange={(checked) => onShowEmptyChange(checked === true)}
          />
          <span>{t('kpi.filters.showEmpty')}</span>
        </label>

        <label className="ml-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={printWithDetail}
            onCheckedChange={(checked) => onPrintWithDetailChange(checked === true)}
          />
          <span>{t('kpi.filters.printWithDetail')}</span>
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t('kpi.filters.reset')}
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-soft/40 p-3 text-xs leading-relaxed text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{t('kpi.formulaBanner')}</p>
      </div>
    </Card>
  )
}
