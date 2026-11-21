import { useTranslation } from 'react-i18next'
import { LessonMarqueeBanner } from '@/components/ui/lesson-marquee-banner'

type LessonMarqueePreviewProps = {
  lessonId?: number
  topic: string
  keywords: readonly string[]
  content?: string
}

export function LessonMarqueePreview({
  lessonId,
  topic,
  keywords,
  content,
}: LessonMarqueePreviewProps) {
  const { t } = useTranslation()

  if (keywords.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
        {t('lessons.preview.enterKeywordHint')}
      </p>
    )
  }

  return (
    <LessonMarqueeBanner
      hits={[
        {
          id: lessonId ?? 0,
          topic,
          matchedKeywords: [...keywords],
          content,
        },
      ]}
      interactive={false}
    />
  )
}
