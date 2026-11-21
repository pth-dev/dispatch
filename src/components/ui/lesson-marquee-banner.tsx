import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils'

export type LessonMarqueeHit = {
  id: number
  topic: string
  matchedKeywords: string[]
  content?: string
}

type LessonMarqueeBannerProps = {
  hits: readonly LessonMarqueeHit[]
  compact?: boolean
  interactive?: boolean
  maxExcerptLength?: number
  className?: string
}

const DEFAULT_EXCERPT_MAX = 160
const COMPACT_EXCERPT_MAX = 100

function buildExcerpt(content: string | undefined, maxLength: number): string {
  const plain = (content ?? '')
    .replace(/\|/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!plain) return ''
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain
}

function LessonMarqueeSegment({
  hit,
  showSeparator,
  interactive,
  maxLength,
}: {
  hit: LessonMarqueeHit
  showSeparator: boolean
  interactive: boolean
  maxLength: number
}) {
  const { t } = useTranslation()
  const displayTopic = hit.topic.trim() || t('lessons.preview.untitledTopic')
  const excerpt = buildExcerpt(hit.content, maxLength)
  const keywordsText = hit.matchedKeywords.join(', ')

  const body = (
    <>
      <span className="font-semibold">
        [{t('lessons.preview.lessonTag')}
        {hit.id > 0 ? ` #${hit.id}` : ''}] {displayTopic}
      </span>
      {keywordsText && (
        <>
          {' | '}
          <span>
            {t('lessons.fields.keywords')}: {keywordsText}
          </span>
        </>
      )}
      {excerpt && (
        <>
          {' | '}
          <span>
            {t('lessons.fields.content')}: {excerpt}
          </span>
        </>
      )}
    </>
  )

  return (
    <span className="inline-flex items-center">
      {showSeparator && (
        <span className="px-5 text-destructive/45" aria-hidden="true">
          ◆
        </span>
      )}
      {interactive && hit.id > 0 ? (
        <Link
          to={`${APP_ROUTES.LESSONS}?id=${hit.id}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-sm text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        <span className="text-destructive">{body}</span>
      )}
    </span>
  )
}

export function LessonMarqueeBanner({
  hits,
  compact = false,
  interactive = true,
  maxExcerptLength,
  className,
}: LessonMarqueeBannerProps) {
  const { t } = useTranslation()

  if (hits.length === 0) return null

  const maxLength =
    maxExcerptLength ?? (compact ? COMPACT_EXCERPT_MAX : DEFAULT_EXCERPT_MAX)

  return (
    <div
      data-testid="lesson-marquee"
      onClick={(e) => {
        if (interactive) e.stopPropagation()
      }}
      className={cn(
        'lesson-marquee-root flex items-center gap-2 overflow-hidden rounded-xl border border-destructive/25 bg-destructive/5 text-xs text-destructive',
        compact ? 'px-2 py-1' : 'px-3 py-2',
        interactive && 'relative z-10',
        className,
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
        <AlertTriangle
          className={compact ? 'size-3 shrink-0' : 'size-4 shrink-0'}
          aria-hidden="true"
        />
        <span>{t('lessons.preview.alertPrefix')}</span>
      </span>

      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            'lesson-marquee-track font-medium',
            compact && 'lesson-marquee-track--compact',
          )}
        >
          {hits.map((hit, index) => (
            <LessonMarqueeSegment
              key={`${hit.id}-${index}`}
              hit={hit}
              showSeparator={index > 0}
              interactive={interactive}
              maxLength={maxLength}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
