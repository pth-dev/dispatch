import { AlertCircle, CheckCircle2, TriangleAlert, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminNotice } from './AdminUserFormModal'

type AdminNoticeBannerProps = {
  notice: AdminNotice | null
  onDismiss: () => void
}

export function AdminNoticeBanner({ notice, onDismiss }: AdminNoticeBannerProps) {
  const { t } = useTranslation()
  if (!notice) return null

  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
    >
      {notice.tone === 'success' ? (
        <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
      ) : notice.tone === 'warning' ? (
        <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
      ) : (
        <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
      )}
      <span className="flex-1">{notice.text}</span>
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
