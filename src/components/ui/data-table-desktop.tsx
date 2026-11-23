import * as React from 'react'
import {
  flexRender,
  type HeaderGroup,
  type Row,
  type RowData,
} from '@tanstack/react-table'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import type {
  ColumnDef,
  DataTableColumnMeta,
  DataTableFeatures,
  DataTableVariant,
} from './data-table-types'
import { cn } from '@/utils'

const SKELETON_ROW_INDICES = [0, 1, 2, 3, 4, 5, 6, 7] as const

export function DataTableHeaderView<T extends RowData>({
  headerGroups,
  hasMinWidth,
  variant,
  headerClassName,
  headerRowClassName,
}: {
  headerGroups: HeaderGroup<DataTableFeatures, T>[]
  hasMinWidth: boolean
  variant: DataTableVariant
  headerClassName?: string
  headerRowClassName?: string
}): React.ReactElement {
  const isDefault = variant === 'default'
  const isPrint = variant === 'print'

  return (
    <TableHeader
      className={cn(
        isDefault && 'sticky top-0 z-20 bg-card border-b border-border',
        variant === 'embedded' &&
          'border-b border-border bg-muted/30 text-[11px] font-medium text-muted-foreground',
        isPrint && 'border-b border-border bg-muted/40',
        headerClassName,
      )}
    >
      {headerGroups.map((headerGroup) => (
        <TableRow
          key={headerGroup.id}
          className={cn('hover:bg-transparent', headerRowClassName)}
        >
          {headerGroup.headers.map((header) => {
            const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined
            return (
              <TableHead
                key={header.id}
                style={{
                  width: meta?.width,
                  minWidth: meta?.minWidth,
                  maxWidth: meta?.maxWidth,
                }}
                className={cn(
                  isDefault &&
                    'text-[13px] font-semibold text-primary px-3 py-2.5 select-none bg-card whitespace-nowrap',
                  variant === 'embedded' &&
                    'h-auto px-2.5 py-2 font-medium text-muted-foreground whitespace-nowrap',
                  isPrint && 'h-auto border border-border px-1.5 py-1 font-semibold text-foreground',
                  meta?.sticky === 'left' && 'sticky left-0 z-30',
                  meta?.sticky === 'left' &&
                    hasMinWidth &&
                    'shadow-[inset_-1px_0_0_var(--color-border)]',
                  meta?.align === 'center' && 'text-center',
                  meta?.align === 'right' && 'text-right',
                  meta?.headerClassName,
                )}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            )
          })}
        </TableRow>
      ))}
    </TableHeader>
  )
}

type DataTableBodyViewProps<T extends RowData> = {
  rows: Row<DataTableFeatures, T>[]
  columns: ColumnDef<T>[]
  isLoading: boolean
  emptyMessage: string
  emptyClassName?: string
  rowHeightClass: string
  hasMinWidth: boolean
  variant: DataTableVariant
  onRowClick?: (item: T) => void
  rowClassName?: (item: T, index: number) => string
  expandedKeys?: ReadonlySet<string>
  renderSubComponent?: (item: T, index: number) => React.ReactNode
  subRowClassName?: string
  subCellClassName?: string
  bodyClassName?: string
}

export function DataTableBodyView<T extends RowData>({
  rows,
  columns,
  isLoading,
  emptyMessage,
  emptyClassName,
  rowHeightClass,
  hasMinWidth,
  variant,
  onRowClick,
  rowClassName,
  expandedKeys,
  renderSubComponent,
  subRowClassName,
  subCellClassName,
  bodyClassName,
}: DataTableBodyViewProps<T>): React.ReactElement {
  const isDefault = variant === 'default'
  const isPrint = variant === 'print'

  if (isLoading) {
    return (
      <TableBody className={cn('divide-y divide-border', bodyClassName)}>
        {SKELETON_ROW_INDICES.map((rIdx) => (
          <TableRow
            key={`skel_row_${rIdx}`}
            className={cn('hover:bg-transparent', rowHeightClass)}
          >
            {columns.map((col, cIdx) => {
              const meta = col.meta as DataTableColumnMeta | undefined
              return (
                <TableCell
                  key={`skel_cell_${cIdx}`}
                  className={cn(
                    'px-3 py-2',
                    meta?.sticky === 'left' && 'sticky left-0 z-10 bg-card',
                    meta?.sticky === 'left' &&
                      hasMinWidth &&
                      'shadow-[inset_-1px_0_0_var(--color-border)]',
                  )}
                >
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    )
  }

  if (rows.length === 0) {
    return (
      <TableBody className={cn('divide-y divide-border', bodyClassName)}>
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className={cn(
              isDefault ? 'h-40' : 'py-8',
              'text-center text-sm text-muted-foreground',
              emptyClassName,
            )}
          >
            {emptyMessage}
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody className={cn(!isPrint && 'divide-y divide-border', bodyClassName)}>
      {rows.map((row, index) => {
        const item = row.original
        const isExpanded = Boolean(expandedKeys?.has(row.id) && renderSubComponent)
        return (
          <React.Fragment key={row.id}>
            <TableRow
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={cn(
                isDefault &&
                  'group transition-colors hover:bg-secondary text-xs text-foreground',
                isDefault && rowHeightClass,
                variant === 'embedded' && 'group transition-colors hover:bg-muted/40 text-xs',
                isPrint && 'hover:bg-transparent',
                onRowClick && 'cursor-pointer',
                rowClassName?.(item, index),
              )}
            >
              {row.getAllCells().map((cell) => {
                const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined
                return (
                  <TableCell
                    key={cell.id}
                    style={meta?.maxWidth ? { maxWidth: meta.maxWidth } : undefined}
                    className={cn(
                      isDefault && 'px-3 py-1.5 truncate',
                      variant === 'embedded' && 'px-2.5 py-2 whitespace-normal',
                      isPrint && 'border border-border px-1.5 py-1 whitespace-normal',
                      meta?.sticky === 'left' &&
                        'sticky left-0 z-10 bg-card transition-colors group-hover:bg-secondary',
                      meta?.sticky === 'left' &&
                        hasMinWidth &&
                        'shadow-[inset_-1px_0_0_var(--color-border)]',
                      meta?.align === 'center' && 'text-center',
                      meta?.align === 'right' && 'text-right',
                      meta?.cellClassName,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
            {isExpanded && renderSubComponent && (
              <TableRow className={cn('bg-muted/20 hover:bg-muted/20', subRowClassName)}>
                <TableCell
                  colSpan={row.getAllCells().length}
                  className={cn('p-3 whitespace-normal', subCellClassName)}
                >
                  {renderSubComponent(item, index)}
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        )
      })}
    </TableBody>
  )
}
