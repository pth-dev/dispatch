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
 * Shared SaaS page shell inside AppShell <main> (inspired by next-shadcn-dashboard-starter
 * & shadcn-admin fixed-main pattern).
 * On desktop (lg+), locks to the fixed viewport height so page headers stay pinned
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
        'relative mx-auto flex w-full min-w-0 flex-col gap-3 short:gap-2 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:short:min-h-fit',
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
 * Primary content container of a page below the pinned header.
 * - `scrollable` defaults to `true` (safe-by-default for Dashboard, Detail, Form, Profile, etc.).
 *   Pass `scrollable={false}` only when inner panes/tables manage their own scroll (`/tasks`, `/lessons`).
 * - `surface` defaults to `'transparent'` so child cards sit cleanly on `bg-background` without
 *   card-in-card nesting. Pass `surface="card"` for single-surface pages like `/tasks`.
 */
export function PageContainerBody({
  surface = 'transparent',
  scrollable = true,
  className,
  children,
}: PageContainerBodyProps) {
  return (
    <div
      className={cn(
        'relative min-w-0 lg:min-h-0 lg:flex-1',
        surface === 'card' && 'overflow-hidden rounded-xl border border-border bg-card',
        scrollable
          ? 'block w-full lg:overflow-y-auto lg:scrollbar-gutter-stable lg:short:[contain:size]'
          : 'flex flex-col lg:overflow-hidden lg:short:min-h-fit lg:short:[&>*]:min-h-fit lg:short:[&>.grid]:min-h-[360px] lg:short:[&>.grid]:[contain:size]',
        scrollable && surface === 'transparent' && 'lg:pr-1',
        className,
      )}
    >
      {children}
    </div>
  )
}
