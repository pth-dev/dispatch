import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'
import type { TaskStatus } from '@/schemas/task'

export interface StatusMeta {
  color: string
  labelKey: string
}

export const STATUS_META: Record<TaskStatus | 'urgent', StatusMeta> = {
  new: {
    color: '#6B7280',
    labelKey: 'status.new',
  },
  draft: {
    color: '#6B7280',
    labelKey: 'status.draft',
  },
  in_progress: {
    color: '#1F6FEB',
    labelKey: 'status.in_progress',
  },
  pending: {
    color: '#B45309',
    labelKey: 'status.pending',
  },
  approved: {
    color: '#1F6FEB',
    labelKey: 'status.approved',
  },
  done: {
    color: '#15803D',
    labelKey: 'status.done',
  },
  overdue: {
    color: '#D32F2F',
    labelKey: 'status.overdue',
  },
  rejected: {
    color: '#D32F2F',
    labelKey: 'status.rejected',
  },
  urgent: {
    color: '#D32F2F',
    labelKey: 'status.urgent',
  },
}

export interface StatusTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: TaskStatus | 'urgent'
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
        className,
      )}
      style={{ color: meta.color }}
      {...props}
    >
      {showDot && (
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{ backgroundColor: meta.color }}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  )
}
