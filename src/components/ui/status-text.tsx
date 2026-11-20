import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'
import type { DerivedTaskStatus, TaskStatus } from '@/schemas/task'

export type DerivedStatusKey = DerivedTaskStatus | 'paused' | 'urgent'
export type StatusKey = DerivedStatusKey | TaskStatus

/** Status colors are tokens only (brief §3.2): never a raw hex/palette value. */
export interface StatusMeta {
  /** Text color utility, e.g. `text-status-in-progress`. */
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
 * Single source of truth for real-API derived task status presentation.
 */
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

/**
 * Combined map keeping transitional Stage-2 keys until Step 5 removes legacy task screens.
 */
export const STATUS_META: Record<StatusKey, StatusMeta> = {
  ...DERIVED_STATUS_META,
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
}

function sortedDerivedStatuses(
  predicate: (meta: StatusMeta) => boolean,
): DerivedStatusKey[] {
  return (Object.keys(DERIVED_STATUS_META) as DerivedStatusKey[])
    .filter((status) => predicate(DERIVED_STATUS_META[status]))
    .sort((a, b) => DERIVED_STATUS_META[a].order - DERIVED_STATUS_META[b].order)
}

/** Real-API filter options, ordered. `urgent` is a row flag, not a status filter. */
export const DERIVED_FILTER_STATUSES = sortedDerivedStatuses(
  (meta) => meta.filterable === true,
) as Array<DerivedTaskStatus | 'paused'>

/** Real-API legend entries, ordered. */
export const DERIVED_LEGEND_STATUSES = sortedDerivedStatuses(
  (meta) => meta.inLegend === true,
)

/** @deprecated Transitional Stage-2 lists, replaced by DERIVED_* in Step 5. */
export const FILTER_STATUSES: TaskStatus[] = [
  'new',
  'draft',
  'in_progress',
  'pending',
  'approved',
  'done',
  'overdue',
  'rejected',
]

/** @deprecated Transitional Stage-2 legend, replaced by DERIVED_LEGEND_STATUSES in Step 5. */
export const LEGEND_STATUSES: StatusKey[] = ['new', 'in_progress', 'pending', 'done', 'overdue']

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
