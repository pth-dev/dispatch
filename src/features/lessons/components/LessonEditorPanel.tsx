import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil, PlusCircle, Save } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  LESSON_TOPIC_MAX,
  LessonFormSchema,
  type LessonFormValues,
  type RawLesson,
} from '@/schemas/lesson'
import type { RawAttachment, RawTask } from '@/schemas/task'
import { useLessonImageStaging } from '../hooks/use-lesson-image-staging'
import {
  findShortLatinKeywords,
  matchTasksForKeywords,
  parseLessonImages,
  parseLessonKeywords,
} from '../utils/lesson-domain'
import type { LightboxImage } from './LessonImageLightbox'
import { LessonImageUploader } from './LessonImageUploader'
import { LessonKeywordInput } from './LessonKeywordInput'
import { LessonMarqueePreview } from './LessonMarqueePreview'
import { LessonMatchedTasks } from './LessonMatchedTasks'

type LessonEditorPanelProps = {
  mode: 'create' | 'edit'
  lesson: RawLesson | null
  allTasks: readonly RawTask[]
  isSaving: boolean
  actionError: string | null
  onSubmit: (payload: {
    values: LessonFormValues
    retainedImages: RawAttachment[]
    stagedFiles: File[]
  }) => Promise<void>
  onCancel: () => void
  onOpenImage: (image: LightboxImage) => void
}

const PREVIEW_TASKS_LIMIT = 20

export function LessonEditorPanel({
  mode,
  lesson,
  allTasks,
  isSaving,
  actionError,
  onSubmit,
  onCancel,
  onOpenImage,
}: LessonEditorPanelProps) {
  const { t } = useTranslation()
  const isEdit = mode === 'edit' && Boolean(lesson)

  const {
    retainedImages,
    stagedImages,
    imagesDirty,
    addFiles,
    removeStaged,
    removeRetained,
  } = useLessonImageStaging(isEdit && lesson ? parseLessonImages(lesson) : [])

  const [keywordDraft, setKeywordDraft] = useState('')
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [shortKeywordConfirm, setShortKeywordConfirm] = useState<{
    shortList: string[]
    values: LessonFormValues
  } | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(LessonFormSchema),
    defaultValues: {
      topic: isEdit && lesson ? lesson.topic : '',
      keywords: isEdit && lesson ? parseLessonKeywords(lesson) : [],
      content: isEdit && lesson ? lesson.content : '',
    },
  })

  const watchedTopic = useWatch({ control, name: 'topic' })
  const watchedKeywords = useWatch({ control, name: 'keywords' })
  const watchedContent = useWatch({ control, name: 'content' })

  const previewKeywords = keywordDraft.trim()
    ? [...watchedKeywords, keywordDraft.trim()]
    : watchedKeywords
  const previewHits = matchTasksForKeywords(allTasks, previewKeywords)
  const openHitsCount = previewHits.filter((item) => !item.isCompleted).length
  const hasUnsavedChanges = isDirty || imagesDirty || keywordDraft.trim().length > 0

  const executeSubmit = async (values: LessonFormValues) => {
    await onSubmit({
      values,
      retainedImages,
      stagedFiles: stagedImages.map((item) => item.file),
    })
  }

  const onValidSubmit = async (values: LessonFormValues) => {
    const shortList = findShortLatinKeywords(values.keywords)
    if (shortList.length > 0) {
      setShortKeywordConfirm({ shortList, values })
      return
    }
    await executeSubmit(values)
  }

  const handleConfirmShortKeywords = () => {
    if (!shortKeywordConfirm) return
    const values = shortKeywordConfirm.values
    setShortKeywordConfirm(null)
    void executeSubmit(values)
  }

  const handleRequestCancel = () => {
    if (hasUnsavedChanges) {
      setDiscardDialogOpen(true)
      return
    }
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-4" noValidate>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRequestCancel}
        className="lg:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>{t('lessons.actions.backToList')}</span>
      </Button>

      <div className="flex items-center gap-2">
        {isEdit ? (
          <Pencil className="size-5 text-primary" aria-hidden="true" />
        ) : (
          <PlusCircle className="size-5 text-primary" aria-hidden="true" />
        )}
        <h2 className="text-lg font-semibold text-foreground">
          {isEdit && lesson
            ? t('lessons.editor.editTitle', { id: lesson.id })
            : t('lessons.editor.createTitle')}
        </h2>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {actionError}
        </p>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="space-y-1.5">
          <label
            htmlFor="lesson-topic"
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {t('lessons.fields.topic')} <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <Controller
            name="topic"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="lesson-topic"
                maxLength={LESSON_TOPIC_MAX}
                disabled={isSaving}
                placeholder={t('lessons.editor.topicPlaceholder')}
                aria-invalid={Boolean(errors.topic)}
                aria-describedby={errors.topic?.message ? 'lesson-topic-error' : undefined}
                className="h-11 lg:h-10"
              />
            )}
          />
          {errors.topic?.message && (
            <p id="lesson-topic-error" role="alert" className="text-xs text-destructive">
              {t(errors.topic.message, { max: LESSON_TOPIC_MAX })}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="lesson-keywords"
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {t('lessons.fields.keywords')} <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <Controller
            name="keywords"
            control={control}
            render={({ field }) => (
              <LessonKeywordInput
                id="lesson-keywords"
                keywords={field.value}
                disabled={isSaving}
                error={errors.keywords?.message}
                onChange={field.onChange}
                onDraftChange={setKeywordDraft}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="lesson-content"
            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {t('lessons.fields.content')}
          </label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="lesson-content"
                rows={7}
                disabled={isSaving}
                placeholder={t('lessons.editor.contentPlaceholder')}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('lessons.fields.images')}
          </h3>
          <LessonImageUploader
            retainedImages={retainedImages}
            stagedImages={stagedImages}
            disabled={isSaving}
            onRemoveRetained={removeRetained}
            onAddFiles={addFiles}
            onRemoveStaged={removeStaged}
            onOpenImage={onOpenImage}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('lessons.preview.liveHeading')}
        </h3>
        <LessonMarqueePreview
          lessonId={isEdit && lesson ? lesson.id : undefined}
          topic={watchedTopic}
          keywords={previewKeywords}
          content={watchedContent}
        />
        {previewKeywords.length > 0 && (
          <p className="text-xs font-medium text-warning">
            {t('lessons.preview.hitSummary', {
              total: previewHits.length,
              open: openHitsCount,
            })}
          </p>
        )}
        {previewKeywords.length > 0 && previewHits.length > 0 && (
          <div className="max-h-56 overflow-y-auto pr-1">
            <LessonMatchedTasks hits={previewHits} maxItems={PREVIEW_TASKS_LIMIT} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={handleRequestCancel}
          className="h-11 lg:h-10 flex-1 sm:flex-none"
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSaving} className="h-11 lg:h-10 flex-1 sm:flex-none">
          <Save className="size-4" aria-hidden="true" />
          <span>
            {isSaving
              ? t('lessons.actions.saving')
              : isEdit
                ? t('lessons.actions.saveEdit')
                : t('lessons.actions.publish')}
          </span>
        </Button>
      </div>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lessons.discardDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lessons.discardDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onCancel}>
              {t('lessons.discardDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(shortKeywordConfirm)}
        onOpenChange={(open) => {
          if (!open) setShortKeywordConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('lessons.shortKeywordDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('lessons.shortKeywordDialog.description', {
                keywords: shortKeywordConfirm?.shortList.join(', ') ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmShortKeywords}>
              {t('lessons.shortKeywordDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
