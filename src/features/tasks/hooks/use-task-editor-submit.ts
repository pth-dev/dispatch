import * as React from 'react'
import type { UseFormSetError } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { APP_ROUTES } from '@/constants/app-routes'
import type { RawAttachment, RawTask, TaskEditorFormValues } from '@/schemas/task'
import { parseAttachments } from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import { buildTaskFormData } from '../api/build-task-form-data'
import { useCreateTask, useUpdateTask } from '../api/queries'

interface UseTaskEditorSubmitOptions {
  mode: 'create' | 'edit' | 'clone'
  sourceTask?: RawTask
  reporterUsername: string
  setError: UseFormSetError<TaskEditorFormValues>
}

export function useTaskEditorSubmit({
  mode,
  sourceTask,
  reporterUsername,
  setError,
}: UseTaskEditorSubmitOptions) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [newFiles, setNewFiles] = React.useState<File[]>([])
  const [retainedFiles, setRetainedFiles] = React.useState<RawAttachment[]>(() =>
    sourceTask ? parseAttachments(sourceTask.attachments) : [],
  )
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const handleRemoveRetainedFile = (path: string) => {
    setRetainedFiles((prev) => prev.filter((f) => f.path !== path))
  }

  const onSubmit = async (values: TaskEditorFormValues) => {
    setSubmitError(null)

    if (mode === 'clone' && sourceTask) {
      if (values.recur_type === 'once') {
        const srcDay = (sourceTask.due_date ?? '').trim().slice(0, 10)
        const nextDay = values.due_date.trim().slice(0, 10)
        if (!nextDay || nextDay === srcDay) {
          setError('due_date', { message: 'tasks.validation.cloneDueDateMustChange' })
          setSubmitError(t('tasks.validation.cloneDueDateMustChange'))
          return
        }
      } else {
        const srcEnd = (sourceTask.recur_end ?? '').trim().slice(0, 10)
        const nextEnd = values.recur_end.trim().slice(0, 10)
        if (!nextEnd || nextEnd === srcEnd) {
          setError('recur_end', { message: 'tasks.validation.cloneRecurEndMustChange' })
          setSubmitError(t('tasks.validation.cloneRecurEndMustChange'))
          return
        }
      }
    }

    const preservedWorkItems =
      mode === 'edit' && sourceTask?.work_items
        ? typeof sourceTask.work_items === 'string'
          ? sourceTask.work_items
          : JSON.stringify(sourceTask.work_items)
        : null

    const preservedTypeDetail =
      mode === 'edit' && sourceTask?.type_detail
        ? typeof sourceTask.type_detail === 'string'
          ? sourceTask.type_detail
          : JSON.stringify(sourceTask.type_detail)
        : null

    const formData = buildTaskFormData({
      mode,
      values,
      reporter: reporterUsername,
      newFiles,
      retainedFiles,
      cloneFromId: mode === 'clone' ? sourceTask?.id : undefined,
      preservedWorkItems,
      preservedTypeDetail,
      preservedInstallReq:
        mode === 'edit' || mode === 'clone' ? sourceTask?.install_req ?? null : null,
    })

    try {
      if (mode === 'edit' && sourceTask) {
        await updateTask.mutateAsync({ id: sourceTask.id, formData })
        navigate(APP_ROUTES.TASK_DETAIL(sourceTask.id), { replace: true })
      } else {
        const res = await createTask.mutateAsync(formData)
        navigate(res.id ? APP_ROUTES.TASK_DETAIL(res.id) : APP_ROUTES.TASKS, { replace: true })
      }
    } catch (err) {
      setSubmitError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  return {
    newFiles,
    setNewFiles,
    retainedFiles,
    handleRemoveRetainedFile,
    submitError,
    isPending: createTask.isPending || updateTask.isPending,
    onSubmit,
  }
}
