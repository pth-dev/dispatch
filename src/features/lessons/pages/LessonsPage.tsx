import { useTranslation } from 'react-i18next'

export function LessonsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">
        {t('nav.lessons')}
      </h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Bài học kinh nghiệm và quy định (sẽ triển khai trong Phase 4).
        </p>
      </div>
    </div>
  )
}

export default LessonsPage
