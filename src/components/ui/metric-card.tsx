import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export type MetricCardTone = 'default' | 'primary' | 'success' | 'warning' | 'destructive'

const VALUE_TONE_CLASS: Record<MetricCardTone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

export interface MetricCardProps {
  label: string
  value: React.ReactNode
  subtext?: React.ReactNode
  tone?: MetricCardTone
  icon?: React.ReactNode
  onClick?: () => void
  active?: boolean
  className?: string
}

export function MetricCard({
  label,
  value,
  subtext,
  tone = 'default',
  icon,
  onClick,
  active,
  className,
}: MetricCardProps) {
  const isActive = active === true
  const baseClass = cn(
    'flex flex-col justify-between gap-1.5 rounded-xl border bg-card p-3.5 text-left transition-colors',
    isActive ? 'border-primary bg-primary-soft/40' : 'border-border',
    onClick &&
      'cursor-pointer hover:border-primary/50 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]',
    className,
  )

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground leading-snug line-clamp-2">
          {label}
        </span>
        {icon ? (
          <span className="shrink-0 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        ) : onClick ? (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
        ) : null}
      </div>

      <div className={cn('text-2xl font-semibold tracking-tight tabular-nums leading-none', VALUE_TONE_CLASS[tone])}>
        {value}
      </div>

      {subtext != null && (
        <div className="text-xs text-muted-foreground leading-snug truncate">{subtext}</div>
      )}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={baseClass}>
        {content}
      </button>
    )
  }

  return <div className={baseClass}>{content}</div>
}
