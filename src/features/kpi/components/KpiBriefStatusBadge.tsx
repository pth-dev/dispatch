import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import type { BriefStatus } from '../utils/kpi-brief-domain'

const STATUS_BADGE_CLASS: Record<BriefStatus, string> = {
  ontime: 'border-success/30 bg-success/10 text-success',
  late: 'border-warning/30 bg-warning/10 text-warning',
  overdue: 'border-destructive/30 bg-destructive/10 text-destructive',
  progress: 'border-primary/30 bg-primary-soft/60 text-primary',
  paused: 'border-border bg-secondary text-muted-foreground',
}

const STATUS_DOT_CLASS: Record<BriefStatus, string> = {
  ontime: 'bg-success',
  late: 'bg-warning',
  overdue: 'bg-destructive',
  progress: 'bg-primary',
  paused: 'bg-muted-foreground',
}

export function KpiBriefStatusBadge({
  status,
  className,
}: {
  status: BriefStatus
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Badge variant="outline" className={cn('gap-1.5', STATUS_BADGE_CLASS[status], className)}>
      <span
        className={cn('size-2 shrink-0 rounded-full', STATUS_DOT_CLASS[status])}
        aria-hidden="true"
      />
      {t(`kpiBrief.status.${status}`)}
    </Badge>
  )
}
