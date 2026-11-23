import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useTable, type RowData } from '@tanstack/react-table'
import { Table } from './table'
import { DataTableMobileList } from './data-table-mobile'
import { DataTableBodyView, DataTableHeaderView } from './data-table-desktop'
import {
  DATA_TABLE_FEATURES,
  type ColumnDef,
  type DataTableColumnMeta,
  type DataTableProps,
  type DataTableVariant,
} from './data-table-types'
import { useAppStore } from '@/app/store'
import { cn } from '@/utils'

export type { ColumnDef, DataTableColumnMeta, DataTableProps, DataTableVariant }

export function DataTable<T extends RowData>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage,
  emptyClassName,
  density: propDensity,
  variant = 'default',
  mobileBreakpoint = 'lg',
  renderMobileCard,
  mobileContainerClassName,
  mobileItemClassName,
  rowClassName,
  expandedKeys,
  renderSubComponent,
  subRowClassName,
  subCellClassName,
  error,
  minViewportHeightClass,
  containerClassName,
  tableClassName,
  headerClassName,
  headerRowClassName,
  bodyClassName,
  className,
}: DataTableProps<T>): React.ReactElement {
  const { t } = useTranslation()
  const storeDensity = useAppStore((state) => state.density)
  const density = propDensity || storeDensity

  const isDefault = variant === 'default'
  const resolvedMinViewport =
    minViewportHeightClass !== undefined
      ? minViewportHeightClass
      : isDefault
        ? 'lg:min-h-[297px]'
        : ''

  const rowHeightClass = density === 'compact' ? 'h-11 py-2' : 'h-[50px] py-3'
  const hasMinWidth = columns.some((col) => Boolean(col.meta?.minWidth))
  const resolvedEmptyMessage = emptyMessage || t('common.empty')

  const table = useTable({
    features: DATA_TABLE_FEATURES,
    data,
    columns,
    getRowId: (originalRow, index) => keyExtractor(originalRow, index),
  })

  if (error) {
    return (
      <div className={cn('w-full flex flex-col min-h-0', className)}>{error}</div>
    )
  }

  const desktopShowClass = renderMobileCard
    ? mobileBreakpoint === 'md'
      ? 'hidden md:block'
      : 'hidden lg:block'
    : 'block'

  return (
    <div
      className={cn(
        'w-full flex flex-col min-h-0',
        resolvedMinViewport,
        className,
      )}
    >
      {renderMobileCard && (
        <DataTableMobileList
          data={data}
          keyExtractor={keyExtractor}
          onRowClick={onRowClick}
          isLoading={isLoading}
          emptyMessage={resolvedEmptyMessage}
          emptyClassName={emptyClassName}
          mobileBreakpoint={mobileBreakpoint}
          renderMobileCard={renderMobileCard}
          mobileContainerClassName={mobileContainerClassName}
          mobileItemClassName={mobileItemClassName}
        />
      )}

      <div
        className={cn(
          isDefault &&
            'w-full overflow-auto flex-1 min-h-0 lg:short:[contain:size] border border-border rounded-lg bg-card',
          variant === 'embedded' && 'w-full overflow-x-auto',
          variant === 'print' && 'w-full',
          resolvedMinViewport,
          desktopShowClass,
          containerClassName,
        )}
      >
        <Table
          className={cn(
            'w-full border-collapse text-xs',
            isDefault && (hasMinWidth ? 'table-auto' : 'table-fixed'),
            variant === 'print' && 'text-[11px]',
            tableClassName,
          )}
        >
          <DataTableHeaderView
            headerGroups={table.getHeaderGroups()}
            hasMinWidth={hasMinWidth}
            variant={variant}
            headerClassName={headerClassName}
            headerRowClassName={headerRowClassName}
          />
          <DataTableBodyView
            rows={table.getRowModel().rows}
            columns={columns}
            isLoading={isLoading}
            emptyMessage={resolvedEmptyMessage}
            emptyClassName={emptyClassName}
            rowHeightClass={rowHeightClass}
            hasMinWidth={hasMinWidth}
            variant={variant}
            onRowClick={onRowClick}
            rowClassName={rowClassName}
            expandedKeys={expandedKeys}
            renderSubComponent={renderSubComponent}
            subRowClassName={subRowClassName}
            subCellClassName={subCellClassName}
            bodyClassName={bodyClassName}
          />
        </Table>
      </div>
    </div>
  )
}
