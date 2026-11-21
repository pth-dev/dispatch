import { useState } from 'react'
import { ArrowLeft, GraduationCap, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { RawLesson } from '@/schemas/lesson'
import { resolveFileUrl } from '@/utils/task-domain'
import {
  formatLessonAuthor,
  formatLessonDateTime,
  parseLessonImages,
  parseLessonKeywords,
  type MatchedLessonTask,
} from '../utils/lesson-domain'
import type { LightboxImage } from './LessonImageLightbox'
import { LessonMarqueePreview } from './LessonMarqueePreview'
import { LessonMatchedTasks } from './LessonMatchedTasks'

type LessonDetailPanelProps = {
  lesson: RawLesson | null
  matchedTasks: readonly MatchedLessonTask[]
  canEdit: boolean
  isDeleting: boolean
  actionError: string | null
  onEdit: (id: number) => void
  onDelete: (id: number) => Promise<void>
  onOpenImage: (image: LightboxImage) => void
  onBackToList?: () => void
}

export function LessonDetailPanel({
  lesson,
  matchedTasks,
  canEdit,
  isDeleting,
  actionError,
  onEdit,
  onDelete,
  onOpenImage,
  onBackToList,
}: LessonDetailPanelProps) {
  const { t } = useTranslation()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  if (!lesson) {
    return (
      <section className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center">
        <GraduationCap className="mb-3 size-11 text-primary/60" aria-hidden="true" />
        <p className="text-base font-semibold text-foreground">
          {t('lessons.empty.selectPrompt')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('lessons.empty.selectSubprompt')}
        </p>
        <div className="mt-5 max-w-lg rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-left text-xs leading-relaxed text-destructive">
          {t('lessons.ruleNotice')}
        </div>
      </section>
    )
  }

  const keywords = parseLessonKeywords(lesson)
  const images = parseLessonImages(lesson)
  const hasUpdatedInfo =
    Boolean(lesson.updatedAt) && lesson.updatedAt !== lesson.createdAt

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false)
    await onDelete(lesson.id)
  }

  return (
    <section className="space-y-4">
      {onBackToList && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBackToList}
          className="lg:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{t('lessons.actions.backToList')}</span>
        </Button>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {actionError}
        </p>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <span className="inline-flex rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
              #{lesson.id}
            </span>
            <h2 className="text-xl font-semibold text-foreground break-words">
              {lesson.topic}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('lessons.detail.createdMeta', {
                author: formatLessonAuthor(lesson.created_name, lesson.created_by),
                dept: lesson.dept || '-',
                time: formatLessonDateTime(lesson.createdAt),
              })}
              {hasUpdatedInfo && (
                <>
                  {' · '}
                  {t('lessons.detail.updatedMeta', {
                    author: lesson.updated_by || '-',
                    time: formatLessonDateTime(lesson.updatedAt),
                  })}
                </>
              )}
            </p>
          </div>

          {canEdit && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(lesson.id)}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                <span>{t('common.edit')}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteOpen(true)}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                <span>{t('common.delete')}</span>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('lessons.fields.keywords')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-destructive/25 bg-destructive/5 px-2 py-0.5 text-xs font-medium text-destructive"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('lessons.preview.label')}
          </h3>
          <LessonMarqueePreview
            lessonId={lesson.id}
            topic={lesson.topic}
            keywords={keywords}
            content={lesson.content}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('lessons.fields.content')}
        </h3>
        <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {lesson.content.trim() ? (
            lesson.content
          ) : (
            <span className="text-muted-foreground">{t('lessons.detail.noContent')}</span>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('lessons.fields.imagesCount', { count: images.length })}
          </h3>
          <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
            {images.map((img, index) => {
              const url = resolveFileUrl(img.path)
              if (!url) return null
              return (
                <button
                  key={`${img.path}-${index}`}
                  type="button"
                  onClick={() => onOpenImage({ src: url, name: img.name })}
                  className="overflow-hidden rounded-lg border border-border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <img
                    src={url}
                    alt={img.name || lesson.topic}
                    loading="lazy"
                    className="size-24 object-cover"
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('lessons.matchedTasks.heading', { count: matchedTasks.length })}
        </h3>
        <LessonMatchedTasks hits={matchedTasks} />
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lessons.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lessons.deleteDialog.description', {
                id: lesson.id,
                topic: lesson.topic,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
