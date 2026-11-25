import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  pauseOnHover?: boolean
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
    <span className="inline-flex shrink-0 items-center whitespace-nowrap">
      {showSeparator && (
        <span className="px-5 text-destructive/45" aria-hidden="true">
          ◆
        </span>
      )}
      {interactive && hit.id > 0 ? (
        <Link
          to={`${APP_ROUTES.LESSONS}?id=${hit.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-block rounded-sm py-1 whitespace-nowrap text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        <span className="whitespace-nowrap text-destructive">{body}</span>
      )}
    </span>
  )
}

export function LessonMarqueeBanner({
  hits,
  compact = false,
  interactive = true,
  pauseOnHover = true,
  maxExcerptLength,
  className,
}: LessonMarqueeBannerProps) {
  const { t } = useTranslation()

  if (hits.length === 0) return null

  const maxLength =
    maxExcerptLength ?? (compact ? COMPACT_EXCERPT_MAX : DEFAULT_EXCERPT_MAX)

  const totalChars = hits.reduce((sum, hit) => {
    const topicLen = hit.topic.trim().length
    const kwLen = hit.matchedKeywords.join(', ').length
    const excerptLen = buildExcerpt(hit.content, maxLength).length
    return sum + topicLen + kwLen + excerptLen + 24
  }, 0)
  const durationSeconds = compact
    ? Math.max(28, Math.round(totalChars / 9))
    : Math.max(42, Math.round(totalChars / 7))

  return (
    <div
      data-testid="lesson-marquee"
      onClick={(e) => {
        if (interactive) e.stopPropagation()
      }}
      className={cn(
        'lesson-marquee-root flex items-center gap-2 overflow-hidden whitespace-nowrap rounded-xl border border-destructive/25 bg-destructive/5 text-xs text-destructive',
        pauseOnHover && 'lesson-marquee-root--pausable',
        compact ? 'h-7 px-2' : 'h-9 px-3',
        interactive && 'relative z-10',
        className,
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold">
        <AlertTriangle
          className={compact ? 'size-3 shrink-0' : 'size-4 shrink-0'}
          aria-hidden="true"
        />
        <span>{t('lessons.preview.alertPrefix')}</span>
      </span>

      <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
        <div
          style={{ animationDuration: `${durationSeconds}s` }}
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

type LessonRuleBadgeProps = {
  hits: readonly LessonMarqueeHit[]
}

/**
 * Compact single-row pill for data tables. Hovering reveals the animated
 * single-line policy marquee; clicking navigates directly to the first lesson.
 */
export function LessonRuleBadge({ hits }: LessonRuleBadgeProps) {
  const { t } = useTranslation()
  const first = hits[0]
  if (!first) return null

  const label =
    hits.length > 1
      ? `${t('lessons.preview.lessonTag')} (${hits.length})`
      : t('lessons.preview.lessonTag')

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={`${APP_ROUTES.LESSONS}?id=${first.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-destructive/25 bg-destructive/5 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          sideOffset={6}
          hideArrow
          className="w-[min(32rem,90vw)] max-w-none border border-destructive/25 bg-card p-1.5 text-foreground"
        >
          <LessonMarqueeBanner
            hits={hits}
            compact
            interactive={false}
            pauseOnHover={false}
            className="border-0"
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
