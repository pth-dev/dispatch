import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useTable, type PaginationState, type RowData } from '@tanstack/react-table'
import { Table } from './table'
import { PaginationControl } from './pagination-control'
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
  enablePagination = false,
  initialPageSize = 10,
  paginationClassName,
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

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const totalCount = data.length
  const maxPageIndex = Math.max(0, Math.ceil(totalCount / pagination.pageSize) - 1)
  const safePageIndex = Math.min(pagination.pageIndex, maxPageIndex)
  const activePagination: PaginationState = enablePagination
    ? { pageIndex: safePageIndex, pageSize: pagination.pageSize }
    : { pageIndex: 0, pageSize: Math.max(1, totalCount) }

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
    state: { pagination: activePagination },
    onPaginationChange: setPagination,
    manualPagination: !enablePagination,
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

  const visibleRows = table.getRowModel().rows
  const showPaginationBar =
    enablePagination && !isLoading && variant !== 'print' && totalCount > pagination.pageSize

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
          rows={visibleRows}
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
            rows={visibleRows}
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

      {showPaginationBar && (
        <div
          className={cn(
            'shrink-0 border-t border-border/60 pt-2.5 mt-2',
            paginationClassName,
          )}
        >
          <PaginationControl
            page={safePageIndex + 1}
            pageSize={pagination.pageSize}
            total={totalCount}
            onPageChange={(nextPage) =>
              setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, nextPage - 1) }))
            }
            onPageSizeChange={(nextSize) =>
              setPagination({ pageIndex: 0, pageSize: nextSize })
            }
          />
        </div>
      )}
    </div>
  )
}
