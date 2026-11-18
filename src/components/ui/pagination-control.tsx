import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from './button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { cn } from '@/utils'

export interface PaginationControlProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (newPage: number) => void
  onPageSizeChange: (newSize: number) => void
  className?: string
}

export function PaginationControl({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationControlProps) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // Generate visible page numbers for desktop
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const delta = 1

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis')
      }
    }
    return pages
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-2 text-xs text-muted-foreground select-none',
        className,
      )}
    >
      {/* Left: Summary and Page Size Selector */}
      <div className="flex items-center gap-3">
        {/* Desktop display */}
        <span className="hidden sm:inline">
          {t('common.pagination.display', {
            size: pageSize,
            from,
            to,
            total,
          })}
        </span>

        {/* Mobile display */}
        <span className="inline sm:hidden">
          {t('common.pagination.page', { page, totalPages })} ({total})
        </span>

        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-border">
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={size.toString()} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground">/ trang</span>
        </div>
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8 hidden sm:inline-flex"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Desktop page number buttons */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ell_${idx}`} className="px-1 text-muted-foreground">
                  …
                </span>
              )
            }
            const isCurrent = p === page
            return (
              <Button
                key={p}
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                className={cn('size-8 p-0 text-xs', isCurrent && 'font-semibold')}
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {p}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8 hidden sm:inline-flex"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
