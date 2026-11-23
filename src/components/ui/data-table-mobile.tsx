import type * as React from 'react'
import { cn } from '@/utils'

type DataTableMobileListProps<T> = {
  data: readonly T[]
  keyExtractor: (item: T, index: number) => string
  onRowClick?: (item: T) => void
  isLoading: boolean
  emptyMessage: string
  emptyClassName?: string
  mobileBreakpoint: 'md' | 'lg'
  renderMobileCard: (item: T, index: number) => React.ReactNode
  mobileContainerClassName?: string
  mobileItemClassName?: (item: T, index: number) => string
}

const SKELETON_CARD_INDICES = [0, 1, 2, 3, 4] as const

function MobileCardSkeleton() {
  return (
    <div className="p-3.5 space-y-2 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-4 bg-muted rounded w-20" />
      </div>
      <div className="h-5 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  )
}

export function DataTableMobileList<T>({
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage,
  emptyClassName,
  mobileBreakpoint,
  renderMobileCard,
  mobileContainerClassName,
  mobileItemClassName,
}: DataTableMobileListProps<T>): React.ReactElement {
  const hiddenClass = mobileBreakpoint === 'md' ? 'md:hidden' : 'lg:hidden'

  return (
    <div
      className={cn(
        'flex flex-col divide-y divide-border',
        hiddenClass,
        mobileContainerClassName,
      )}
    >
      {isLoading ? (
        SKELETON_CARD_INDICES.map((idx) => (
          <MobileCardSkeleton key={`skel_card_${idx}`} />
        ))
      ) : data.length === 0 ? (
        <div
          className={cn(
            'py-12 text-center text-sm text-muted-foreground',
            emptyClassName,
          )}
        >
          {emptyMessage}
        </div>
      ) : (
        data.map((item, index) => {
          const key = keyExtractor(item, index)
          const itemCls = mobileItemClassName?.(item, index)
          if (onRowClick) {
            return (
              <button
                key={key}
                type="button"
                onClick={() => onRowClick(item)}
                className={cn(
                  'w-full text-left p-3.5 hover:bg-muted/50 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition-colors cursor-pointer',
                  itemCls,
                )}
              >
                {renderMobileCard(item, index)}
              </button>
            )
          }
          return (
            <div key={key} className={cn(itemCls ?? 'p-3.5')}>
              {renderMobileCard(item, index)}
            </div>
          )
        })
      )}
    </div>
  )
}
