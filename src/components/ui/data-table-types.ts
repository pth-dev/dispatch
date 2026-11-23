import type * as React from 'react'
import {
  tableFeatures,
  type CellData,
  type ColumnDef as TanStackColumnDef,
  type RowData,
} from '@tanstack/react-table'

export type DataTableColumnMeta = {
  width?: string
  minWidth?: string
  maxWidth?: string
  sticky?: 'left'
  align?: 'left' | 'center' | 'right'
  headerClassName?: string
  cellClassName?: string
}

export const DATA_TABLE_FEATURES = tableFeatures({
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
  error?: React.ReactNode
  minViewportHeightClass?: string
  containerClassName?: string
  tableClassName?: string
  headerClassName?: string
  headerRowClassName?: string
  bodyClassName?: string
  className?: string
}
