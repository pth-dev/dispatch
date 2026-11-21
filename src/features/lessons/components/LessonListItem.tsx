import { AlertCircle, GraduationCap, Image as ImageIcon, Link2, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RawLesson } from '@/schemas/lesson'
import { resolveFileUrl } from '@/utils/task-domain'
import {
  formatLessonAuthor,
  formatLessonDateTime,
  parseLessonImages,
  parseLessonKeywords,
} from '../utils/lesson-domain'

const MAX_VISIBLE_KEYWORDS = 3

type LessonListItemProps = {
  lesson: RawLesson
  selected: boolean
  hitCount: number
  openHitCount: number
  onSelect: (id: number) => void
}

export function LessonListItem({
  lesson,
  selected,
  hitCount,
  openHitCount,
  onSelect,
}: LessonListItemProps) {
  const { t } = useTranslation()
  const keywords = parseLessonKeywords(lesson)
  const images = parseLessonImages(lesson)
  const firstImageUrl = images[0] ? resolveFileUrl(images[0].path) : ''
  const visibleKeywords = keywords.slice(0, MAX_VISIBLE_KEYWORDS)
  const extraCount = keywords.length - visibleKeywords.length

  return (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={() => onSelect(lesson.id)}
      className={`w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40'
      }`}
    >
      <div className="flex items-start gap-3">
        {firstImageUrl ? (
          <img
            src={firstImageUrl}
            alt={images[0]?.name || lesson.topic}
            loading="lazy"
            className="size-12 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              #{lesson.id}
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {lesson.topic}
            </span>
          </div>

          {visibleKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visibleKeywords.map((kw) => (
                <span
                  key={kw}
                  className="max-w-44 truncate rounded border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
                >
                  {kw}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  +{extraCount}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3" aria-hidden="true" />
              {formatLessonAuthor(lesson.created_name, lesson.created_by)}
            </span>
            <span>{formatLessonDateTime(lesson.updatedAt || lesson.createdAt)}</span>
            {images.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="size-3" aria-hidden="true" />
                {images.length}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 ${
                openHitCount > 0 ? 'font-medium text-warning' : ''
              }`}
            >
              {openHitCount > 0 ? (
                <AlertCircle className="size-3" aria-hidden="true" />
              ) : (
                <Link2 className="size-3" aria-hidden="true" />
              )}
              {openHitCount > 0
                ? t('lessons.list.hitSummaryOpen', {
                    total: hitCount,
                    open: openHitCount,
                  })
                : t('lessons.list.hitSummary', { total: hitCount })}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
