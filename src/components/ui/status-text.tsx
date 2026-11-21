import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'
import type { DerivedTaskStatus } from '@/schemas/task'

export type DerivedStatusKey = DerivedTaskStatus | 'paused' | 'urgent'
export type StatusKey = DerivedStatusKey

/** Status colors are tokens only (brief §3.2): never a raw hex/palette value. */
export interface StatusMeta {
  textClass: string
  dotClass: string
  labelKey: string
  order: number
  filterable?: boolean
  inLegend?: boolean
}

export const DERIVED_STATUS_META: Record<DerivedStatusKey, StatusMeta> = {
  not_started: {
    textClass: 'text-status-not-started',
    dotClass: 'bg-status-not-started',
    labelKey: 'status.not_started',
    order: 10,
    filterable: true,
    inLegend: true,
  },
  in_progress: {
    textClass: 'text-status-in-progress',
    dotClass: 'bg-status-in-progress',
    labelKey: 'status.in_progress',
    order: 20,
    filterable: true,
    inLegend: true,
  },
  delayed_pending: {
    textClass: 'text-status-delayed-pending',
    dotClass: 'bg-status-delayed-pending',
    labelKey: 'status.delayed_pending',
    order: 30,
    filterable: true,
    inLegend: true,
  },
  completed_ontime: {
    textClass: 'text-status-completed-ontime',
    dotClass: 'bg-status-completed-ontime',
    labelKey: 'status.completed_ontime',
    order: 40,
    filterable: true,
    inLegend: true,
  },
  late_completed: {
    textClass: 'text-status-late-completed',
    dotClass: 'bg-status-late-completed',
    labelKey: 'status.late_completed',
    order: 50,
    filterable: true,
    inLegend: true,
  },
  paused: {
    textClass: 'text-status-paused',
    dotClass: 'bg-status-paused',
    labelKey: 'status.paused',
    order: 60,
    filterable: true,
    inLegend: true,
  },
  urgent: {
    textClass: 'text-status-urgent',
    dotClass: 'bg-status-urgent',
    labelKey: 'status.urgent',
    order: 90,
  },
}

export const STATUS_META = DERIVED_STATUS_META

function sortedDerivedStatuses(
  predicate: (meta: StatusMeta) => boolean,
): DerivedStatusKey[] {
  return (Object.keys(DERIVED_STATUS_META) as DerivedStatusKey[])
    .filter((status) => predicate(DERIVED_STATUS_META[status]))
    .sort((a, b) => DERIVED_STATUS_META[a].order - DERIVED_STATUS_META[b].order)
}

export const DERIVED_FILTER_STATUSES = sortedDerivedStatuses(
  (meta) => meta.filterable === true,
)

export const DERIVED_LEGEND_STATUSES = sortedDerivedStatuses(
  (meta) => meta.inLegend === true,
)

export const FILTER_STATUSES = DERIVED_FILTER_STATUSES
export const LEGEND_STATUSES = DERIVED_LEGEND_STATUSES

export interface StatusTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusKey
  showDot?: boolean
  label?: string
}

export function StatusText({
  status,
  showDot = true,
  label,
  className,
  ...props
}: StatusTextProps) {
  const { t } = useTranslation()
  const meta = STATUS_META[status] || STATUS_META.not_started
  const displayLabel = label || t(meta.labelKey)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap select-none',
        meta.textClass,
        className,
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('size-1.5 rounded-full shrink-0', meta.dotClass)}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  )
}
