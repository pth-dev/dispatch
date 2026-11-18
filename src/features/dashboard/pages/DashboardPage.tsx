import { useTranslation } from 'react-i18next'

export function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">
        {t('nav.dashboard')}
      </h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Bảng điều khiển tổng quan (sẽ triển khai trong Phase 3).
        </p>
      </div>
    </div>
  )
}

export default DashboardPage
