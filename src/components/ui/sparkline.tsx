import { cn } from '@/utils/cn'

export interface SparklineProps {
  data: readonly number[]
  ariaLabel?: string
  className?: string
}

export function Sparkline({ data, ariaLabel, className }: SparklineProps) {
  if (data.length < 2) {
    return <span className="inline-block w-20 text-center text-xs text-muted-foreground">—</span>
  }

  const maxValue = Math.max(1, ...data)
  const points = data
    .map((val, index) => {
      const x = (index * 100) / (data.length - 1)
      const y = 22 - (Math.max(0, val) * 20) / maxValue
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel || undefined}
      className={cn('h-6 w-20 shrink-0', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
