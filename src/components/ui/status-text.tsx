import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'
import type { TaskStatus } from '@/schemas/task'

export type StatusKey = TaskStatus | 'urgent'

/** Status colors are tokens only (brief §3.2): never a raw hex/palette value. */
export interface StatusMeta {
  /** Text color utility, e.g. `text-status-pending`. */
  textClass: string
  /** Dot background utility matching `textClass`. */
  dotClass: string
  labelKey: string
  /** Display order in filters and legends. */
  order: number
  /** Included in the task-list status filter. */
  filterable?: boolean
  /** Included in the compact status legend. */
  inLegend?: boolean
}

/**
 * Single source of truth for task status presentation: copy key, token colors,
 * ordering and where each status appears.
 */
export const STATUS_META: Record<StatusKey, StatusMeta> = {
  new: {
    textClass: 'text-status-new',
    dotClass: 'bg-status-new',
    labelKey: 'status.new',
    order: 10,
    filterable: true,
    inLegend: true,
  },
  draft: {
    textClass: 'text-status-draft',
    dotClass: 'bg-status-draft',
    labelKey: 'status.draft',
    order: 20,
    filterable: true,
  },
  in_progress: {
    textClass: 'text-status-in-progress',
    dotClass: 'bg-status-in-progress',
    labelKey: 'status.in_progress',
    order: 30,
    filterable: true,
    inLegend: true,
  },
  pending: {
    textClass: 'text-status-pending',
    dotClass: 'bg-status-pending',
    labelKey: 'status.pending',
    order: 40,
    filterable: true,
    inLegend: true,
  },
  approved: {
    textClass: 'text-status-approved',
    dotClass: 'bg-status-approved',
    labelKey: 'status.approved',
    order: 50,
    filterable: true,
  },
  done: {
    textClass: 'text-status-done',
    dotClass: 'bg-status-done',
    labelKey: 'status.done',
    order: 60,
    filterable: true,
    inLegend: true,
  },
  overdue: {
    textClass: 'text-status-overdue',
    dotClass: 'bg-status-overdue',
    labelKey: 'status.overdue',
    order: 70,
    filterable: true,
    inLegend: true,
  },
  rejected: {
    textClass: 'text-status-rejected',
    dotClass: 'bg-status-rejected',
    labelKey: 'status.rejected',
    order: 80,
    filterable: true,
  },
  urgent: {
    textClass: 'text-status-urgent',
    dotClass: 'bg-status-urgent',
    labelKey: 'status.urgent',
    order: 90,
  },
}

function sortedStatuses(predicate: (meta: StatusMeta) => boolean): StatusKey[] {
  return (Object.keys(STATUS_META) as StatusKey[])
    .filter((status) => predicate(STATUS_META[status]))
    .sort((a, b) => STATUS_META[a].order - STATUS_META[b].order)
}

/** Filter dropdown options, ordered. `urgent` is a row flag, not a task status. */
export const FILTER_STATUSES = sortedStatuses(
  (meta) => meta.filterable === true,
) as TaskStatus[]

/** Compact legend entries, ordered. */
export const LEGEND_STATUSES = sortedStatuses((meta) => meta.inLegend === true)

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
  const meta = STATUS_META[status] || STATUS_META.new
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
