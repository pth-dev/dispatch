import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LESSON_IMAGE_MAX_FILES, LESSON_IMAGE_MAX_MB } from '@/schemas/lesson'
import type { RawAttachment } from '@/schemas/task'

export type StagedImageItem = {
  file: File
  previewUrl: string
}

export function useLessonImageStaging(initialRetained: RawAttachment[]) {
  const { t } = useTranslation()
  const [retainedImages, setRetainedImages] = useState<RawAttachment[]>(() => initialRetained)
  const [stagedImages, setStagedImages] = useState<StagedImageItem[]>([])
  const [imagesDirty, setImagesDirty] = useState(false)
  const createdUrlsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const urls = createdUrlsRef.current
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url)
      }
      urls.clear()
    }
  }, [])

  const addFiles = (files: File[]): string | null => {
    const maxBytes = LESSON_IMAGE_MAX_MB * 1024 * 1024
    const valid: File[] = []
    let errorMsg: string | null = null

    for (const file of files) {
      if (!/^image\//i.test(file.type)) {
        errorMsg = t('lessons.editor.imageInvalidType', { name: file.name })
        continue
      }
      if (file.size > maxBytes) {
        errorMsg = t('lessons.editor.imageTooLarge', {
          name: file.name,
          maxMb: LESSON_IMAGE_MAX_MB,
        })
        continue
      }
      valid.push(file)
    }

    const room = Math.max(
      0,
      LESSON_IMAGE_MAX_FILES - retainedImages.length - stagedImages.length,
    )
    if (valid.length > room) {
      errorMsg = t('lessons.editor.imageMaxFiles', { maxFiles: LESSON_IMAGE_MAX_FILES })
    }

    const accepted = valid.slice(0, room)
    if (accepted.length > 0) {
      const nextItems = accepted.map((file) => {
        const previewUrl = URL.createObjectURL(file)
        createdUrlsRef.current.add(previewUrl)
        return { file, previewUrl }
      })
      setStagedImages((prev) => [...prev, ...nextItems])
      setImagesDirty(true)
    }

    return errorMsg
  }

  const removeStaged = (index: number) => {
    const target = stagedImages[index]
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
      createdUrlsRef.current.delete(target.previewUrl)
    }
    setStagedImages((prev) => prev.filter((_, idx) => idx !== index))
    setImagesDirty(true)
  }

  const removeRetained = (index: number) => {
    setRetainedImages((prev) => prev.filter((_, idx) => idx !== index))
    setImagesDirty(true)
  }

  return {
    retainedImages,
    stagedImages,
    imagesDirty,
    addFiles,
    removeStaged,
    removeRetained,
  }
}
