import * as React from 'react'
import { cn } from '@/utils/cn'

export type BarSegmentTone = 'primary' | 'success' | 'warning' | 'destructive' | 'muted'

const SEGMENT_TONE_CLASS: Record<BarSegmentTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground/40',
}

export interface HorizontalBarRowProps {
  label: string
  /** Primary segment percentage (0..100). */
  percent: number
  tone?: BarSegmentTone
  /** Optional second stacked segment percentage (0..100), e.g. late-completed after on-time. */
  secondaryPercent?: number
  secondaryTone?: BarSegmentTone
  valueText?: React.ReactNode
  onClick?: () => void
  className?: string
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function HorizontalBarRow({
  label,
  percent,
  tone = 'primary',
  secondaryPercent = 0,
  secondaryTone = 'warning',
  valueText,
  onClick,
  className,
}: HorizontalBarRowProps) {
  const first = clampPercent(percent)
  const second = clampPercent(Math.min(100 - first, secondaryPercent))

  const body = (
    <>
      <span
        className="w-28 sm:w-36 shrink-0 truncate text-xs font-medium text-foreground"
        title={label}
      >
        {label}
      </span>
      <div
        className="flex h-2 flex-1 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(first + second)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {first > 0 && (
          <div
            className={cn('h-full transition-all', SEGMENT_TONE_CLASS[tone])}
            style={{ width: `${first}%` }}
          />
        )}
        {second > 0 && (
          <div
            className={cn('h-full transition-all', SEGMENT_TONE_CLASS[secondaryTone])}
            style={{ width: `${second}%` }}
          />
        )}
      </div>
      {valueText != null && (
        <span className="shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums">
          {valueText}
        </span>
      )}
    </>
  )

  const rowClass = cn(
    'flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors',
    onClick
      ? 'min-h-11 lg:min-h-9 cursor-pointer hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      : 'min-h-9',
    className,
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowClass}>
        {body}
      </button>
    )
  }

  return <div className={rowClass}>{body}</div>
}
