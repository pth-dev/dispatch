import { useTranslation } from 'react-i18next'

export function MessagesPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">
        {t('nav.messages')}
      </h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Bảng tin nhắn nội bộ (sẽ triển khai trong Phase 4).
        </p>
      </div>
    </div>
  )
}

export default MessagesPage
