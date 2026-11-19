import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'
import {
  ERROR_TONE_CLASS,
  getErrorStatusMeta,
  getReferenceCode,
  type ErrorStatusCode,
} from './error-status'

interface InlineErrorProps {
  status: ErrorStatusCode
  onRetry?: () => void
  className?: string
}

/**
 * In-content error block for recoverable failures (5xx, timeout, network).
 * Full-page statuses are handled by `ErrorState` through the router boundary.
 */
export function InlineError({ status, onRetry, className }: InlineErrorProps) {
  const { t } = useTranslation()
  const meta = getErrorStatusMeta(status)
  const Icon = meta.icon

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('mt-0.5 size-5 shrink-0', ERROR_TONE_CLASS[meta.tone])}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {t(`errors.status.${status}.title`)}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(`errors.status.${status}.description`)}
          </p>
          {meta.showReferenceCode && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {t('errors.referenceCode', { code: getReferenceCode() })}
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-11 lg:h-9 shrink-0 gap-1.5 text-xs"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
