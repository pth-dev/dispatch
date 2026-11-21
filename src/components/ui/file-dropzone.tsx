import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Paperclip, UploadCloud, X } from 'lucide-react'
import { cn } from '@/utils'

const DEFAULT_MAX_FILE_MB = 50

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileKey(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`
}

type FileChipProps = {
  file: File
  disabled: boolean
  onRemove: () => void
}

function FileChip({ file, disabled, onRemove }: FileChipProps) {
  const { t } = useTranslation()
  return (
    <li className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs text-foreground">
      <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="max-w-[160px] truncate">{file.name}</span>
      <span className="text-[11px] text-muted-foreground">({formatFileSize(file.size)})</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={t('common.fileUpload.removeFile', { name: file.name })}
        className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer disabled:pointer-events-none"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </li>
  )
}

type FileDropzoneProps = {
  id: string
  files: File[]
  onFilesChange: (files: File[]) => void
  maxFileMb?: number
  disabled?: boolean
  className?: string
}

/**
 * Flat, accessible drag-and-drop multi-file uploader matching the Điều Phối
 * light-only design system (1px dashed border, no shadow/gradient, semantic tokens).
 */
export function FileDropzone({
  id,
  files,
  onFilesChange,
  maxFileMb = DEFAULT_MAX_FILE_MB,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const dragDepthRef = React.useRef(0)

  const maxBytes = maxFileMb * 1024 * 1024

  const mergeFiles = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return
    const valid = incoming.filter((f) => f.size <= maxBytes)
    setErrorMsg(
      valid.length < incoming.length
        ? t('common.fileUpload.fileTooLarge', { maxMb: maxFileMb })
        : null,
    )
    if (valid.length === 0) return

    const existingKeys = new Set(files.map(getFileKey))
    const uniqueNew = valid.filter((f) => !existingKeys.has(getFileKey(f)))
    if (uniqueNew.length > 0) {
      onFilesChange([...files, ...uniqueNew])
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    dragDepthRef.current += 1
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = 0
    setIsDragging(false)
    mergeFiles(Array.from(e.dataTransfer.files ?? []))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    mergeFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  const handleRemove = (targetKey: string) => {
    onFilesChange(files.filter((f) => getFileKey(f) !== targetKey))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 py-3 text-center transition-colors',
          disabled
            ? 'cursor-not-allowed border-border bg-muted/40 opacity-60'
            : 'cursor-pointer border-border bg-card hover:border-primary/60 hover:bg-secondary/40 focus-within:ring-2 focus-within:ring-ring',
          isDragging && !disabled && 'border-primary bg-primary-soft',
        )}
      >
        <input
          id={id}
          type="file"
          multiple
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
        />
        <UploadCloud
          className={cn('size-5', isDragging ? 'text-primary' : 'text-muted-foreground')}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-foreground">
          {t('common.fileUpload.dropHint')}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {t('common.fileUpload.maxSizeHint', { maxMb: maxFileMb })}
        </span>
      </label>

      {errorMsg && (
        <p role="alert" className="text-xs text-destructive">
          {errorMsg}
        </p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {files.map((file) => {
            const key = getFileKey(file)
            return (
              <FileChip
                key={key}
                file={file}
                disabled={disabled}
                onRemove={() => handleRemove(key)}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}
