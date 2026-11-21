import * as React from 'react'
import { cn } from '@/utils/cn'

export interface PageHeaderProps {
  title: React.ReactNode
  badge?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  badge,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  const heading = (
    <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
      {title}
    </h1>
  )

  const hasBadge = badge !== undefined && badge !== null && badge !== false
  const hasSubtitle = subtitle !== undefined && subtitle !== null && subtitle !== false

  const titleRow = hasBadge ? (
    <div className="flex items-center gap-2.5">
      {heading}
      {badge}
    </div>
  ) : (
    heading
  )

  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      {hasSubtitle ? (
        <div className="space-y-1">
          {titleRow}
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      ) : (
        titleRow
      )}
      {actions}
    </div>
  )
}
