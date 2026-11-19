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
      className={cn(
        'flex items-center gap-3.5 text-xs text-muted-foreground select-none flex-wrap',
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
