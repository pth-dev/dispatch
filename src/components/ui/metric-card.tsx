import * as React from 'react'
import { ChevronRight, Info } from 'lucide-react'
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
  badge?: React.ReactNode
  tooltip?: string
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
  badge,
  tooltip,
  tone = 'default',
  icon,
  onClick,
  active,
  className,
}: MetricCardProps) {
  const isActive = active === true
  const baseClass = cn(
    'flex flex-col rounded-xl border bg-card p-3.5 text-left transition-colors',
    isActive ? 'border-primary bg-primary-soft/40' : 'border-border',
    onClick &&
      'cursor-pointer hover:border-primary/50 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]',
    className,
  )

  const content = (
    <>
      <div className={cn('flex items-start justify-between gap-2', badge ? 'min-h-14' : 'min-h-8')}>
        {badge ? (
          <div className="min-w-0 flex flex-col items-start gap-1">
            <span
              className="min-h-8 text-xs font-medium text-muted-foreground leading-snug line-clamp-2"
              title={label}
            >
              {label}
            </span>
            {badge}
          </div>
        ) : (
          <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-medium text-muted-foreground leading-snug line-clamp-2"
              title={label}
            >
              {label}
            </span>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
          {tooltip ? (
            <span title={tooltip} aria-label={tooltip} className="inline-flex items-center">
              <Info className="size-3.5" aria-hidden="true" />
            </span>
          ) : icon ? (
            <span aria-hidden="true">{icon}</span>
          ) : onClick ? (
            <ChevronRight className="size-3.5 mt-0.5" aria-hidden="true" />
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'mt-2 flex flex-1 items-center text-2xl font-semibold tracking-tight tabular-nums leading-none',
          VALUE_TONE_CLASS[tone],
        )}
      >
        {value}
      </div>

      {subtext != null && (
        <div
          className="mt-2 text-xs text-muted-foreground leading-snug truncate"
          title={typeof subtext === 'string' ? subtext : undefined}
        >
          {subtext}
        </div>
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
