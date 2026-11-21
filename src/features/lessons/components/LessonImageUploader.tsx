import { useEffect, useId, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LESSON_IMAGE_MAX_FILES, LESSON_IMAGE_MAX_MB } from '@/schemas/lesson'
import type { RawAttachment } from '@/schemas/task'
import { resolveFileUrl } from '@/utils/task-domain'
import type { StagedImageItem } from '../hooks/use-lesson-image-staging'
import type { LightboxImage } from './LessonImageLightbox'

type LessonImageUploaderProps = {
  retainedImages: RawAttachment[]
  stagedImages: StagedImageItem[]
  disabled?: boolean
  onRemoveRetained: (index: number) => void
  onAddFiles: (files: File[]) => string | null
  onRemoveStaged: (index: number) => void
  onOpenImage: (image: LightboxImage) => void
}

type LessonImageThumbnailProps = {
  src: string
  name: string
  tag: string
  isNew: boolean
  disabled: boolean
  onOpen: () => void
  onRemove: () => void
}

function LessonImageThumbnail({
  src,
  name,
  tag,
  isNew,
  disabled,
  onOpen,
  onRemove,
}: LessonImageThumbnailProps) {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        className={`block overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
          isNew ? 'border-primary/40' : 'border-border'
        }`}
      >
        <img src={src} alt={name} className="size-20 object-cover" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={t('lessons.editor.removeImage', { name })}
        className="absolute -top-2 -right-2 inline-flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:pointer-events-none disabled:opacity-50"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
      <span
        className={`pointer-events-none absolute right-0 bottom-0 left-0 truncate rounded-b-lg px-1 py-0.5 text-center text-[10px] font-medium ${
          isNew
            ? 'bg-primary text-primary-foreground'
            : 'bg-foreground/75 text-background'
        }`}
      >
        {tag}
      </span>
    </div>
  )
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export function LessonImageUploader({
  retainedImages,
  stagedImages,
  disabled = false,
  onRemoveRetained,
  onAddFiles,
  onRemoveStaged,
  onOpenImage,
}: LessonImageUploaderProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const onAddFilesRef = useRef(onAddFiles)

  useEffect(() => {
    onAddFilesRef.current = onAddFiles
  }, [onAddFiles])

  useEffect(() => {
    if (disabled) return
    const onPaste = (event: ClipboardEvent) => {
      const cd = event.clipboardData
      if (!cd || cd.files.length === 0) return
      const hasText = Boolean(cd.getData('text/plain')?.trim())
      if (isTextInputTarget(event.target) && hasText) return
      const imageFiles = Array.from(cd.files).filter((f) => /^image\//i.test(f.type))
      if (imageFiles.length === 0) return
      event.preventDefault()
      setUploadError(onAddFilesRef.current(imageFiles))
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [disabled])

  const handleIncoming = (files: File[]) => {
    if (disabled || files.length === 0) return
    setUploadError(onAddFiles(files))
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleIncoming(Array.from(e.dataTransfer.files ?? []))
  }

  return (
    <div className="space-y-2">
      <input
        id={inputId}
        type="file"
        multiple
        accept="image/*"
        disabled={disabled}
        onChange={(e) => {
          handleIncoming(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
          disabled
            ? 'cursor-not-allowed border-border bg-secondary/40 opacity-60'
            : isDragging
              ? 'cursor-pointer border-primary bg-primary/5'
              : 'cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-secondary/30'
        }`}
      >
        <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs font-medium text-foreground">
          {t('lessons.editor.imageDropHint')}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {t('lessons.editor.imageLimitHint', {
            maxMb: LESSON_IMAGE_MAX_MB,
            maxFiles: LESSON_IMAGE_MAX_FILES,
          })}
        </span>
      </label>

      {uploadError && (
        <p role="alert" className="text-xs text-destructive">
          {uploadError}
        </p>
      )}

      {(retainedImages.length > 0 || stagedImages.length > 0) && (
        <div className="flex flex-wrap gap-3 pt-1">
          {retainedImages.map((img, idx) => {
            const url = resolveFileUrl(img.path)
            if (!url) return null
            return (
              <LessonImageThumbnail
                key={`retained-${img.path}-${idx}`}
                src={url}
                name={img.name}
                tag={t('lessons.editor.imageSavedTag')}
                isNew={false}
                disabled={disabled}
                onOpen={() => onOpenImage({ src: url, name: img.name })}
                onRemove={() => onRemoveRetained(idx)}
              />
            )
          })}

          {stagedImages.map((item, idx) => (
            <LessonImageThumbnail
              key={`staged-${item.previewUrl}`}
              src={item.previewUrl}
              name={item.file.name}
              tag={t('lessons.editor.imageNewTag')}
              isNew
              disabled={disabled}
              onOpen={() => onOpenImage({ src: item.previewUrl, name: item.file.name })}
              onRemove={() => onRemoveStaged(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
