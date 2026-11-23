import { useState } from 'react'
import { ArrowLeft, FileText, GraduationCap, Link2, Pencil, Trash2 } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RawLesson } from '@/schemas/lesson'
import { splitTextWithLinks } from '@/utils/linkify'
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
        <div className="mt-5 max-w-lg rounded-xl border border-warning/30 bg-warning/5 p-4 text-left text-xs leading-relaxed text-warning">
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
    <section className="space-y-3 sm:space-y-4">
      {onBackToList && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground select-none lg:hidden">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex min-h-9 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md pr-1 cursor-pointer"
          >
            <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{t('nav.lessons')}</span>
          </button>
          <span aria-hidden="true">›</span>
          <span className="font-semibold text-primary">#{lesson.id}</span>
        </div>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {actionError}
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:space-y-4 sm:p-5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">
              #{lesson.id}
            </span>
            {canEdit && (
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs sm:h-9 sm:px-3"
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
                  className="h-8 px-2.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:px-3"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>{t('common.delete')}</span>
                </Button>
              </div>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground break-words leading-snug">
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

        <div className="space-y-1.5">
          <h3 className="hidden text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:block">
            {t('lessons.fields.keywords')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden space-y-1.5 sm:block">
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

      <Tabs key={lesson.id} defaultValue="content" className="gap-3">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b border-border pb-1"
        >
          <TabsTrigger value="content" className="flex-none px-3 cursor-pointer">
            <FileText className="size-3.5" aria-hidden="true" />
            <span>{t('lessons.fields.content')}</span>
          </TabsTrigger>
          <TabsTrigger value="matched" className="flex-none px-3 cursor-pointer">
            <Link2 className="size-3.5" aria-hidden="true" />
            <span>{t('lessons.matchedTasks.heading', { count: matchedTasks.length })}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
            {lesson.content.trim() ? (
              splitTextWithLinks(lesson.content).map((segment, index) =>
                segment.type === 'link' ? (
                  <a
                    key={`${segment.href}-${index}`}
                    href={segment.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline break-all"
                  >
                    {segment.value}
                  </a>
                ) : (
                  <span key={index}>{segment.value}</span>
                ),
              )
            ) : (
              <span className="text-muted-foreground">{t('lessons.detail.noContent')}</span>
            )}
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
        </TabsContent>

        <TabsContent value="matched">
          <LessonMatchedTasks hits={matchedTasks} />
        </TabsContent>
      </Tabs>

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
