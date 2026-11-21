import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function TodoNoticeBanner() {
  const { t } = useTranslation()

  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-foreground"
    >
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-warning"
        aria-hidden="true"
      />
      <p className="leading-relaxed">
        <span className="font-semibold text-warning">
          {t('todo.noticePrefix')}{' '}
        </span>
        {t('todo.noticeBody')}
      </p>
    </div>
  )
}
