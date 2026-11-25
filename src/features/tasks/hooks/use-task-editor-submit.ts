import * as React from 'react'
import type { UseFormSetError } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { APP_ROUTES } from '@/constants/app-routes'
import type {
  RawAttachment,
  RawTask,
  TaskEditorFormValues,
  WorkItem,
  WorkItemsRule,
} from '@/schemas/task'
import { parseAttachments, parseWorkItems } from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import { buildTaskFormData } from '../api/build-task-form-data'
import { useCreateTask, useUpdateTask } from '../api/queries'
import {
  createBlankWorkItem,
  serializeWorkItemsEnvelope,
  summarizeWorkItems,
} from '../utils/work-items-domain'

interface UseTaskEditorSubmitOptions {
  mode: 'create' | 'edit' | 'clone'
  sourceTask?: RawTask
  reporterUsername: string
  defaultOu?: string
  requireWorkItems?: boolean
  setError: UseFormSetError<TaskEditorFormValues>
}

export function useTaskEditorSubmit({
  mode,
  sourceTask,
  reporterUsername,
  defaultOu = '',
  requireWorkItems = false,
  setError,
}: UseTaskEditorSubmitOptions) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const initialEnvelope = sourceTask ? parseWorkItems(sourceTask.work_items) : null
  const [workItems, setWorkItems] = React.useState<WorkItem[]>(() => {
    if (initialEnvelope && initialEnvelope.items.length > 0) {
      return initialEnvelope.items
    }
    return requireWorkItems ? [createBlankWorkItem(defaultOu)] : []
  })
  const [workItemsRule, setWorkItemsRule] = React.useState<WorkItemsRule>(
    () => initialEnvelope?.rule ?? 'sun',
  )
  const [workItemsError, setWorkItemsError] = React.useState<string | null>(null)
  const [workItemsDirty, setWorkItemsDirty] = React.useState(false)

  const [newFiles, setNewFiles] = React.useState<File[]>([])
  const [retainedFiles, setRetainedFiles] = React.useState<RawAttachment[]>(() =>
    sourceTask ? parseAttachments(sourceTask.attachments) : [],
  )
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const handleWorkItemsChange = (next: WorkItem[]) => {
    setWorkItems(next)
    setWorkItemsDirty(true)
    setWorkItemsError(null)
  }

  const handleWorkItemsRuleChange = (next: WorkItemsRule) => {
    setWorkItemsRule(next)
    setWorkItemsDirty(true)
  }

  const handleRemoveRetainedFile = (path: string) => {
    setRetainedFiles((prev) => prev.filter((f) => f.path !== path))
  }

  const onSubmit = async (values: TaskEditorFormValues) => {
    setSubmitError(null)
    setWorkItemsError(null)

    const nonEmptyWorkItems = workItems.filter((item) => item.topic.trim().length > 0)
    if (requireWorkItems && nonEmptyWorkItems.length === 0) {
      const msg = t('tasks.project.validationAtLeastOne')
      setWorkItemsError(msg)
      setSubmitError(msg)
      return
    }
    if (nonEmptyWorkItems.length > 0) {
      const wiSummary = summarizeWorkItems(nonEmptyWorkItems, workItemsRule)
      if (wiSummary.errorCount > 0) {
        const msg = t('tasks.project.rangeError')
        setWorkItemsError(msg)
        setSubmitError(msg)
        return
      }
    }

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

    const serializedWorkItems = serializeWorkItemsEnvelope(workItems, workItemsRule)

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
      preservedWorkItems: serializedWorkItems || null,
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
    workItems,
    workItemsRule,
    workItemsError,
    workItemsDirty,
    setWorkItems: handleWorkItemsChange,
    setWorkItemsRule: handleWorkItemsRuleChange,
    newFiles,
    setNewFiles,
    retainedFiles,
    handleRemoveRetainedFile,
    submitError,
    isPending: createTask.isPending || updateTask.isPending,
    onSubmit,
  }
}
