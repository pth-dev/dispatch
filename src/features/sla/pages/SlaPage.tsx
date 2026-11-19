import { useTranslation } from 'react-i18next'

export function SlaPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">
        {t('pages.sla.title')}
      </h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {t('pages.sla.description')}
        </p>
      </div>
    </div>
  )
}

export default SlaPage
