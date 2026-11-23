import * as React from 'react'
import { ChevronDown, ChevronUp, Table2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import type { KpiGradeTone } from '@/utils/kpi-domain'
import type { KpiBasis, PeopleKpiRow } from '../utils/kpi-people-domain'
import { KpiPersonTaskDetails } from './KpiPersonTaskDetails'

const GRADE_BADGE_CLASS: Record<KpiGradeTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  primary: 'border-primary/30 bg-primary-soft/60 text-primary',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  muted: 'border-border bg-secondary text-muted-foreground',
}

export interface KpiPeopleTableProps {
  rows: readonly PeopleKpiRow[]
  taskMap: ReadonlyMap<string, RawTask>
  basis: KpiBasis
  selectedKeys: ReadonlySet<string>
  expandedKeys: ReadonlySet<string>
  resolveDeptLabel: (raw: string) => string
  onToggleSelect: (key: string, checked: boolean) => void
  onSelectAllVisible: (checked: boolean) => void
  onToggleExpand: (key: string) => void
}

function fmtPct(value: number, total: number): string {
  return total > 0 ? `${value}%` : 'N/A'
}

export function KpiPeopleTable({
  rows,
  taskMap,
  basis,
  selectedKeys,
  expandedKeys,
  resolveDeptLabel,
  onToggleSelect,
  onSelectAllVisible,
  onToggleExpand,
}: KpiPeopleTableProps) {
  const { t } = useTranslation()
  const selectedCount = rows.filter((r) => selectedKeys.has(r.key)).length
  const allSelected = rows.length > 0 && selectedCount === rows.length
  const someSelected = selectedCount > 0 && selectedCount < rows.length

  return (
    <Card className="overflow-hidden print:hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Table2 className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">{t('kpi.table.heading')}</h2>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {t('kpi.table.selectedCount', { selected: selectedCount, total: rows.length })}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectAllVisible(true)}
            disabled={rows.length === 0}
          >
            {t('kpi.table.selectAll')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectAllVisible(false)}
            disabled={selectedCount === 0}
          >
            {t('kpi.table.deselectAll')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/30 text-[11px] font-medium text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <Checkbox
                  aria-label={t('kpi.table.selectAll')}
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => onSelectAllVisible(checked === true)}
                />
              </th>
              <th className="px-2.5 py-2.5">{t('kpi.table.rank')}</th>
              <th className="px-2.5 py-2.5">{t('kpi.table.username')}</th>
              <th className="px-2.5 py-2.5">{t('kpi.table.fullname')}</th>
              <th className="px-2.5 py-2.5">{t('kpi.table.dept')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.total')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.completed')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.completionRate')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.ontime')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.ontimeRate')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.late')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.pending')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.overdue')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.response1h')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.paused')}</th>
              <th className="px-2.5 py-2.5 text-right">{t('kpi.table.score')}</th>
              <th className="px-2.5 py-2.5">{t('kpi.table.grade')}</th>
              <th className="px-2.5 py-2.5">{t('kpi.table.detail')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={18} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {t('kpi.table.empty')}
                </td>
              </tr>
            ) : (
              rows.map((r, index) => {
                const checked = selectedKeys.has(r.key)
                const expanded = expandedKeys.has(r.key)
                return (
                  <React.Fragment key={r.key}>
                    <tr
                      className={cn(
                        'transition-colors',
                        checked ? 'bg-primary-soft/35' : 'hover:bg-muted/30',
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <Checkbox
                          aria-label={r.username}
                          checked={checked}
                          onCheckedChange={(val) => onToggleSelect(r.key, val === true)}
                        />
                      </td>
                      <td className="px-2.5 py-2.5 font-medium tabular-nums text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-2.5 py-2.5 font-semibold text-foreground">{r.username}</td>
                      <td className="px-2.5 py-2.5 text-foreground">
                        {r.isUnregistered ? t('kpi.unregistered') : r.fullname || '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-muted-foreground">
                        {r.deptRaw ? resolveDeptLabel(r.deptRaw) : '-'}
                      </td>
                      <td className="px-2.5 py-2.5 text-right font-semibold tabular-nums text-primary">
                        {r.total}
                      </td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums">{r.completed}</td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums">
                        <span className="font-semibold text-success">
                          {fmtPct(r.completionRate, r.total)}
                        </span>
                        {r.total > 0 && (
                          <span className="block text-[10px] text-muted-foreground">
                            +{r.finalPart}
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums">{r.ontime}</td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums">
                        <span className="font-semibold text-primary">
                          {fmtPct(r.ontimeRate, r.total)}
                        </span>
                        {r.total > 0 && (
                          <span className="block text-[10px] text-muted-foreground">
                            +{r.ontimePart}
                          </span>
                        )}
                      </td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums text-warning">
                        <span className="font-medium">{r.late}</span>
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          ({fmtPct(r.lateRate, r.total)})
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums">{r.pending}</td>
                      <td
                        className={cn(
                          'px-2.5 py-2.5 text-right font-semibold tabular-nums',
                          r.overdue > 0 ? 'text-destructive' : 'text-muted-foreground',
                        )}
                      >
                        {r.overdue}
                      </td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums">
                        {fmtPct(r.responseRate, r.total)}
                      </td>
                      <td
                        className={cn(
                          'px-2.5 py-2.5 text-right tabular-nums',
                          r.paused > 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {r.paused}
                      </td>
                      <td className="px-2.5 py-2.5 text-right text-sm font-bold tabular-nums text-primary">
                        {r.score === null ? '-' : r.score}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2.5">
                        <Badge variant="outline" className={GRADE_BADGE_CLASS[r.grade.tone]}>
                          {r.grade.code} {t(`kpi.grade.${r.grade.code}`)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onToggleExpand(r.key)}
                          aria-expanded={expanded}
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          {expanded ? (
                            <ChevronUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="size-3.5" aria-hidden="true" />
                          )}
                          {expanded ? t('kpi.table.collapse') : t('kpi.table.expand')}
                        </Button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-muted/20">
                        <td colSpan={18} className="p-3">
                          <KpiPersonTaskDetails row={r} taskMap={taskMap} basis={basis} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
