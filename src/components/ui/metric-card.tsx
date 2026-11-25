import type { ReactNode } from 'react'
import { ChevronRight, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type MetricCardTone = 'default' | 'primary' | 'success' | 'warning' | 'destructive'

const VALUE_TONE_CLASS: Record<MetricCardTone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

export type MetricCardProps = {
  label: string
  value: ReactNode
  subtext?: ReactNode
  badge?: ReactNode
  tooltip?: string
  tone?: MetricCardTone
  icon?: ReactNode
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
}: MetricCardProps): ReactNode {
  const isActive = active === true
  const baseClass = cn(
    'flex flex-col rounded-xl border bg-card p-3 text-left transition-colors',
    isActive ? 'border-primary bg-primary-soft/40' : 'border-border',
    onClick &&
      'cursor-pointer hover:border-primary/50 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:active:scale-[0.99]',
    className,
  )

  const content = (
    <>
      <div className="flex min-h-8 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span
            className="text-xs font-medium text-muted-foreground leading-4 line-clamp-2"
            title={label}
          >
            {label}
          </span>
          {badge}
        </div>
        <div className="flex shrink-0 items-center gap-1 pt-0.5 text-muted-foreground">
          {tooltip ? (
            onClick ? (
              <Info className="size-3.5" aria-hidden="true" />
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label={label}
                    title={tooltip}
                    className="-m-1 inline-flex shrink-0 items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  >
                    <Info className="size-3.5" aria-hidden="true" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-2.5 text-xs leading-relaxed">
                  {tooltip}
                </PopoverContent>
              </Popover>
            )
          ) : icon ? (
            <span aria-hidden="true">{icon}</span>
          ) : null}
          {onClick && <ChevronRight className="size-3.5" aria-hidden="true" />}
        </div>
      </div>

      <div
        className={cn(
          'mt-1.5 flex flex-1 items-center text-xl xl:text-2xl font-semibold tracking-tight tabular-nums leading-none',
          VALUE_TONE_CLASS[tone],
        )}
      >
        {value}
      </div>

      {subtext != null && (
        <div
          className="mt-1.5 min-h-4 text-xs leading-4 text-muted-foreground truncate"
          title={typeof subtext === 'string' ? subtext : undefined}
        >
          {subtext}
        </div>
      )}
    </>
  )

  if (onClick) {
    const buttonEl = (
      <button type="button" onClick={onClick} aria-pressed={active} className={baseClass}>
        {content}
      </button>
    )
    if (!tooltip) return buttonEl
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{buttonEl}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-64">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <div className={baseClass}>{content}</div>
}
