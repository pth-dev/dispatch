import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { resolveApiErrorMessage } from '@/services/http'
import {
  useCreateLesson,
  useDeleteLesson,
  useUpdateLesson,
  type SaveLessonPayload,
  type UpdateLessonPayload,
} from '../api/queries'

export function useLessonActions() {
  const { t, i18n } = useTranslation()
  const createLesson = useCreateLesson()
  const updateLesson = useUpdateLesson()
  const deleteLesson = useDeleteLesson()
  const [actionError, setActionError] = useState<string | null>(null)

  const clearActionError = () => {
    setActionError(null)
  }

  const handleCreate = async (payload: SaveLessonPayload): Promise<number | null> => {
    setActionError(null)
    try {
      const result = await createLesson.mutateAsync(payload)
      return result.id ?? 0
    } catch (error) {
      setActionError(resolveApiErrorMessage(error, t, i18n.language))
      return null
    }
  }

  const handleUpdate = async (payload: UpdateLessonPayload): Promise<boolean> => {
    setActionError(null)
    try {
      await updateLesson.mutateAsync(payload)
      return true
    } catch (error) {
      setActionError(resolveApiErrorMessage(error, t, i18n.language))
      return false
    }
  }

  const handleDelete = async (id: number): Promise<boolean> => {
    setActionError(null)
    try {
      await deleteLesson.mutateAsync(id)
      return true
    } catch (error) {
      setActionError(resolveApiErrorMessage(error, t, i18n.language))
      return false
    }
  }

  return {
    isSaving: createLesson.isPending || updateLesson.isPending,
    isDeleting: deleteLesson.isPending,
    actionError,
    clearActionError,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
