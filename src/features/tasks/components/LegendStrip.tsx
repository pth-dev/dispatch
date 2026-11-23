import { useTranslation } from 'react-i18next'
import { LEGEND_STATUSES, StatusText } from '@/components/ui/status-text'
import { cn } from '@/utils'

interface LegendStripProps {
  className?: string
}

export function LegendStrip({ className }: LegendStripProps) {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground select-none',
        className,
      )}
      aria-label={t('common.status')}
    >
      {LEGEND_STATUSES.map((status) => (
        <StatusText key={status} status={status} />
      ))}
    </div>
  )
}
