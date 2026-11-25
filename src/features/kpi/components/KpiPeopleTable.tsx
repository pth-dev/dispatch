import type * as React from 'react'
import { Table2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import type { RawTask } from '@/schemas/task'
import { useKpiPeopleColumns } from '../hooks/use-kpi-people-columns'
import type { KpiBasis, PeopleKpiRow } from '../utils/kpi-people-domain'
import { KpiPersonTaskDetails } from './KpiPersonTaskDetails'

export type KpiPeopleTableProps = {
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
}: KpiPeopleTableProps): React.ReactElement {
  const { t } = useTranslation()
  const selectedCount = rows.filter((r) => selectedKeys.has(r.key)).length
  const allSelected = rows.length > 0 && selectedCount === rows.length
  const someSelected = selectedCount > 0 && selectedCount < rows.length

  const columns = useKpiPeopleColumns({
    allSelected,
    someSelected,
    selectedKeys,
    expandedKeys,
    resolveDeptLabel,
    onToggleSelect,
    onSelectAllVisible,
    onToggleExpand,
  })

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

      <DataTable
        variant="embedded"
        data={rows}
        columns={columns}
        keyExtractor={(r) => r.key}
        enablePagination
        initialPageSize={20}
        paginationClassName="px-4 pb-2.5 mt-0"
        tableClassName="min-w-[1380px]"
        emptyMessage={t('kpi.table.empty')}
        emptyClassName="px-4 py-10 text-sm"
        expandedKeys={expandedKeys}
        renderSubComponent={(r) => (
          <KpiPersonTaskDetails row={r} taskMap={taskMap} basis={basis} />
        )}
        rowClassName={(r) =>
          selectedKeys.has(r.key) ? 'bg-primary-soft/35 hover:bg-primary-soft/35' : 'hover:bg-muted/30'
        }
      />
    </Card>
  )
}
