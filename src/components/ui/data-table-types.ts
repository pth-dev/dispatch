import type * as React from 'react'
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  type CellData,
  type ColumnDef as TanStackColumnDef,
  type RowData,
} from '@tanstack/react-table'

export type DataTableColumnMeta = {
  width?: string
  minWidth?: string
  maxWidth?: string
  sticky?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  headerClassName?: string
  cellClassName?: string
}

export const DATA_TABLE_FEATURES = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnMeta: {} as DataTableColumnMeta,
})

export type DataTableFeatures = typeof DATA_TABLE_FEATURES

export type ColumnDef<
  TData extends RowData,
  TValue extends CellData = CellData,
> = TanStackColumnDef<DataTableFeatures, TData, TValue>

export type DataTableVariant = 'default' | 'embedded' | 'print'

export type DataTableProps<T extends RowData> = {
  data: readonly T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T, index: number) => string
  onRowClick?: (item: T) => void
  isLoading?: boolean
  emptyMessage?: string
  emptyClassName?: string
  density?: 'compact' | 'comfortable'
  variant?: DataTableVariant
  mobileBreakpoint?: 'md' | 'lg'
  renderMobileCard?: (item: T, index: number) => React.ReactNode
  mobileContainerClassName?: string
  mobileItemClassName?: (item: T, index: number) => string
  rowClassName?: (item: T, index: number) => string
  expandedKeys?: ReadonlySet<string>
  renderSubComponent?: (item: T, index: number) => React.ReactNode
  subRowClassName?: string
  subCellClassName?: string
  /** Enables built-in TanStack Table client-side pagination with PaginationControl footer. */
  enablePagination?: boolean
  /** Initial page size when `enablePagination` is true (defaults to 10). */
  initialPageSize?: number
  /** Custom class for the built-in pagination footer bar. */
  paginationClassName?: string
  error?: React.ReactNode
  minViewportHeightClass?: string
  containerClassName?: string
  tableClassName?: string
  headerClassName?: string
  headerRowClassName?: string
  bodyClassName?: string
  className?: string
}
