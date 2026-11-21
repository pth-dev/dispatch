import * as React from 'react'
import { cn } from '@/utils/cn'

export type PageContainerWidth = 'default' | 'narrow' | 'full'
export type PageContainerSurface = 'card' | 'transparent'

const WIDTH_CLASSES: Record<PageContainerWidth, string> = {
  default: 'max-w-[1440px]',
  narrow: 'max-w-4xl',
  full: 'max-w-none',
}

interface PageContainerProps {
  width?: PageContainerWidth
  className?: string
  children: React.ReactNode
}

/**
 * Shared page shell inside AppShell <main>.
 * On desktop (lg+), locks to the fixed viewport height so headers stay pinned
 * and only the inner PageContainerBody scrolls. On mobile (< lg), flows naturally.
 */
export function PageContainer({
  width = 'default',
  className,
  children,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full min-w-0 flex-col gap-3 short:gap-2 lg:min-h-0 lg:flex-1 lg:overflow-hidden',
        WIDTH_CLASSES[width],
        className,
      )}
    >
      {children}
    </div>
  )
}

interface PageContainerBodyProps {
  surface?: PageContainerSurface
  scrollable?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Primary content container of a page.
 * - `surface="card"` renders a flat white card (bg-card + 1px border-border) that
 *   visually separates the page container from the light-gray AppShell canvas.
 * - `surface="transparent"` is for multi-pane pages where child panels own their own cards.
 * - `scrollable` enables vertical scrolling inside this container on desktop (lg+).
 */
export function PageContainerBody({
  surface = 'card',
  scrollable = false,
  className,
  children,
}: PageContainerBodyProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col lg:min-h-0 lg:flex-1',
        surface === 'card' && 'rounded-xl border border-border bg-card',
        scrollable
          ? 'lg:overflow-y-auto lg:scrollbar-gutter-stable'
          : 'lg:overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}
