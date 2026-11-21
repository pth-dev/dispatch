import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { useAppStore } from '@/app/store'
import { cn } from '@/utils'

export interface ColumnDef<T> {
  id: string
  header: React.ReactNode
  width?: string
  minWidth?: string
  maxWidth?: string
  sticky?: 'left'
  align?: 'left' | 'center' | 'right'
  className?: string
  cell: (item: T, index: number) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  isLoading?: boolean
  emptyMessage?: string
  density?: 'compact' | 'comfortable'
  renderMobileCard?: (item: T, index: number) => React.ReactNode
  /** Replaces the table body with an inline error block (5xx/network/timeout). */
  error?: React.ReactNode
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage,
  density: propDensity,
  renderMobileCard,
  error,
  className,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const storeDensity = useAppStore((state) => state.density)
  const density = propDensity || storeDensity

  const rowHeightClass = density === 'compact' ? 'h-11 py-2' : 'h-[50px] py-3'
  const hasMinWidth = columns.some((col) => Boolean(col.minWidth))

  if (error) {
    return (
      <div className={cn('w-full flex flex-col min-h-0', className)}>{error}</div>
    )
  }

  // Mobile rendering (cards fallback if renderMobileCard provided)
  return (
    <div className={cn('w-full flex flex-col min-h-0', className)}>
      {/* ── Mobile Card View (< lg) ── */}
      {renderMobileCard && (
        <div className="flex lg:hidden flex-col divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={`skel_card_${idx}`} className="p-3.5 space-y-2 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-20" />
                </div>
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {emptyMessage || t('common.empty')}
            </div>
          ) : (
            data.map((item, index) =>
              onRowClick ? (
                <button
                  key={keyExtractor(item)}
                  type="button"
                  onClick={() => onRowClick(item)}
                  className="w-full text-left p-3.5 hover:bg-muted/50 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition-colors cursor-pointer"
                >
                  {renderMobileCard(item, index)}
                </button>
              ) : (
                <div key={keyExtractor(item)} className="p-3.5">
                  {renderMobileCard(item, index)}
                </div>
              ),
            )
          )}
        </div>
      )}

      {/* ── Desktop Table View (>= lg, or fallback if no mobile card renderer) ── */}
      <div
        className={cn(
          'w-full overflow-auto flex-1 min-h-0 border border-border rounded-lg bg-card',
          renderMobileCard ? 'hidden lg:block' : 'block',
        )}
      >
        <Table className={cn('w-full border-collapse', hasMinWidth ? 'table-auto' : 'table-fixed')}>
          <TableHeader className="sticky top-0 z-20 bg-card border-b border-border">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                  className={cn(
                    'text-[13px] font-semibold text-primary px-3 py-2.5 select-none bg-card whitespace-nowrap',
                    col.sticky === 'left' && 'sticky left-0 z-30',
                    col.sticky === 'left' &&
                      hasMinWidth &&
                      'shadow-[inset_-1px_0_0_var(--color-border)]',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, rIdx) => (
                <TableRow
                  key={`skel_row_${rIdx}`}
                  className={cn('hover:bg-transparent', rowHeightClass)}
                >
                  {columns.map((col, cIdx) => (
                    <TableCell
                      key={`skel_cell_${cIdx}`}
                      className={cn(
                        'px-3 py-2',
                        col.sticky === 'left' && 'sticky left-0 z-10 bg-card',
                        col.sticky === 'left' &&
                          hasMinWidth &&
                          'shadow-[inset_-1px_0_0_var(--color-border)]',
                      )}
                    >
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-40 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage || t('common.empty')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'group transition-colors hover:bg-secondary text-xs text-foreground',
                    rowHeightClass,
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      style={col.maxWidth ? { maxWidth: col.maxWidth } : undefined}
                      className={cn(
                        'px-3 py-1.5 truncate',
                        col.sticky === 'left' &&
                          'sticky left-0 z-10 bg-card transition-colors group-hover:bg-secondary',
                        col.sticky === 'left' &&
                          hasMinWidth &&
                          'shadow-[inset_-1px_0_0_var(--color-border)]',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.className,
                      )}
                    >
                      {col.cell(item, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
