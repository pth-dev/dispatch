import { cn } from '@/utils/cn'

export interface DonutSegment {
  id: string
  label: string
  value: number
  /** CSS color variable, e.g. `var(--color-success)` or `var(--color-chart-1)`. */
  colorVar: string
  selectable?: boolean
}

export interface DonutChartProps {
  segments: readonly DonutSegment[]
  centerLabel?: string
  ariaLabel: string
  activeSegmentId?: string | null
  onSelectSegment?: (segmentId: string) => void
  legendColumns?: 1 | 2
  className?: string
}

interface ComputedDonutArc extends DonutSegment {
  ratio: number
  percent: number
  length: number
  offset: number
}

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function buildDonutArcs(segments: readonly DonutSegment[], total: number): ComputedDonutArc[] {
  let offset = 0
  return segments.map((seg) => {
    const safeVal = Math.max(0, seg.value)
    const ratio = total > 0 ? safeVal / total : 0
    const length = ratio * CIRCUMFERENCE
    const currentOffset = offset
    offset += length
    return {
      ...seg,
      ratio,
      percent: total > 0 ? Math.round(ratio * 1000) / 10 : 0,
      length,
      offset: currentOffset,
    }
  })
}

function DonutArc({
  arc,
  dimmed,
  onSelect,
}: {
  arc: ComputedDonutArc
  dimmed: boolean
  onSelect?: (segmentId: string) => void
}) {
  if (arc.length <= 0) return null
  const canSelect = Boolean(onSelect && arc.selectable !== false)
  return (
    <circle
      cx="55"
      cy="55"
      r={RADIUS}
      fill="none"
      stroke={arc.colorVar}
      strokeWidth="14"
      strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
      strokeDashoffset={-arc.offset}
      className={cn(
        'transition-opacity',
        canSelect && 'cursor-pointer',
        dimmed && 'opacity-30',
      )}
      onClick={canSelect && onSelect ? () => onSelect(arc.id) : undefined}
    />
  )
}

function DonutLegendItem({
  arc,
  active,
  onSelect,
}: {
  arc: ComputedDonutArc
  active: boolean
  onSelect?: (segmentId: string) => void
}) {
  const canSelect = Boolean(onSelect && arc.selectable !== false)
  const itemClass = cn(
    'flex min-h-11 lg:min-h-9 items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-xs transition-colors',
    active ? 'border-primary bg-primary-soft/50' : 'border-transparent',
    canSelect &&
      'cursor-pointer hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  )
  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: arc.colorVar }}
          aria-hidden="true"
        />
        <span className="truncate font-medium text-foreground">{arc.label}</span>
      </span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        <strong className="font-semibold text-foreground">{arc.value}</strong> ({arc.percent}%)
      </span>
    </>
  )

  return canSelect && onSelect ? (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(arc.id)}
      className={itemClass}
    >
      {inner}
    </button>
  ) : (
    <div className={itemClass}>{inner}</div>
  )
}

export function DonutChart({
  segments,
  centerLabel,
  ariaLabel,
  activeSegmentId = null,
  onSelectSegment,
  legendColumns = 2,
  className,
}: DonutChartProps) {
  const total = segments.reduce((sum, seg) => sum + Math.max(0, seg.value), 0)
  const arcs = buildDonutArcs(segments, total)

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 110 110" role="img" aria-label={ariaLabel} className="size-full -rotate-90">
          <circle
            cx="55"
            cy="55"
            r={RADIUS}
            fill="none"
            stroke="var(--color-secondary)"
            strokeWidth="14"
          />
          {arcs.map((arc) => (
            <DonutArc
              key={arc.id}
              arc={arc}
              dimmed={activeSegmentId != null && activeSegmentId !== arc.id}
              onSelect={onSelectSegment}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {total}
          </span>
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
        </div>
      </div>

      <div
        className={cn(
          'grid w-full grid-cols-1 gap-1.5',
          legendColumns === 2 && 'sm:grid-cols-2',
        )}
      >
        {arcs.map((arc) => (
          <DonutLegendItem
            key={arc.id}
            arc={arc}
            active={activeSegmentId === arc.id}
            onSelect={onSelectSegment}
          />
        ))}
      </div>
    </div>
  )
}
