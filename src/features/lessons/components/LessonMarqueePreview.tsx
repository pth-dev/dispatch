import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const EXCERPT_MAX_LENGTH = 160

type LessonMarqueePreviewProps = {
  lessonId?: number
  topic: string
  keywords: readonly string[]
  content?: string
}

function buildExcerpt(content: string | undefined): string {
  const compact = (content ?? '').replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  return compact.length > EXCERPT_MAX_LENGTH
    ? `${compact.slice(0, EXCERPT_MAX_LENGTH)}…`
    : compact
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

  const excerpt = buildExcerpt(content)
  const displayTopic = topic.trim() || t('lessons.preview.untitledTopic')

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-relaxed break-words">
        <span className="font-semibold">{t('lessons.preview.alertPrefix')}</span>{' '}
        <span className="font-semibold">
          [{t('lessons.preview.lessonTag')}
          {lessonId && lessonId > 0 ? ` #${lessonId}` : ''}] {displayTopic}
        </span>
        {' · '}
        <span>
          {t('lessons.fields.keywords')}: {keywords.join(', ')}
        </span>
        {excerpt && (
          <>
            {' · '}
            <span>{excerpt}</span>
          </>
        )}
      </p>
    </div>
  )
}
