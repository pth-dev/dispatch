import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CircleAlert, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import {
  TaskEditorFormSchema,
  type RawAttachment,
  type RawTask,
  type TaskEditorFormValues,
} from '@/schemas/task'
import { canSetCross, canSetReaders } from '@/utils/permissions'
import { parseAttachments } from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import {
  useCreateTask,
  useMetaDepts,
  useMetaSites,
  usePocketTaskTypes,
  useUpdateTask,
  useUserDirectory,
} from '../../api/queries'
import {
  buildDefaultTaskEditorValues,
  buildTaskFormData,
} from '../../api/build-task-form-data'
import { useDuplicateTaskCheck } from '../../hooks/use-duplicate-task-check'
import { TaskBasicInfoSection } from './TaskBasicInfoSection'
import { TaskPeopleSection } from './TaskPeopleSection'
import { TaskScheduleSection } from './TaskScheduleSection'
import { TaskRequesterSection } from './TaskRequesterSection'

type TaskEditorFormProps = {
  mode: 'create' | 'edit' | 'clone'
  sourceTask?: RawTask
}

export function TaskEditorForm({ mode, sourceTask }: TaskEditorFormProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  const { data: metaDepts } = useMetaDepts()
  const { data: metaSites } = useMetaSites()
  const { data: directory = [] } = useUserDirectory()
  const { data: pocketTypes = [] } = usePocketTaskTypes()

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const depts = metaDepts?.depts ?? []
  const sites = metaSites?.sites ?? []
  const allowReaders = canSetReaders(user)
  const allowCross = canSetCross(user)

  const [newFiles, setNewFiles] = React.useState<File[]>([])
  const [retainedFiles, setRetainedFiles] = React.useState<RawAttachment[]>(() =>
    sourceTask ? parseAttachments(sourceTask.attachments) : [],
  )
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false)

  const {
    register,
    control,
    setValue,
    setError,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaskEditorFormValues>({
    resolver: zodResolver(TaskEditorFormSchema),
    defaultValues: buildDefaultTaskEditorValues(user, sourceTask),
  })

  const watchTitle = useWatch({ control, name: 'title' })
  const watchDueDate = useWatch({ control, name: 'due_date' })

  const dupWarning = useDuplicateTaskCheck({
    title: watchTitle,
    dueDate: watchDueDate,
    excludeId: mode === 'edit' ? sourceTask?.id : undefined,
  })

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
      reporter: user?.username ?? '',
      newFiles,
      retainedFiles,
      cloneFromId: mode === 'clone' ? sourceTask?.id : undefined,
      preservedWorkItems,
      preservedTypeDetail,
      preservedInstallReq: mode === 'edit' || mode === 'clone' ? sourceTask?.install_req ?? null : null,
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

  const navigateAway = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(
      mode === 'edit' && sourceTask ? APP_ROUTES.TASK_DETAIL(sourceTask.id) : APP_ROUTES.TASKS,
      { replace: true },
    )
  }

  const handleCancel = () => {
    if (isDirty || newFiles.length > 0) {
      setLeaveDialogOpen(true)
    } else {
      navigateAway()
    }
  }

  const pageTitle =
    mode === 'edit'
      ? t('tasks.createForm.editTitle', { id: String(sourceTask?.id ?? '') })
      : mode === 'clone'
        ? t('tasks.createForm.cloneTitle', { id: String(sourceTask?.id ?? '') })
        : t('tasks.createForm.title')

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-[1440px] space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        <Link to={APP_ROUTES.TASKS} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.detail.backToList')}</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-foreground">{pageTitle}</span>
      </div>

      <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
        {pageTitle}
      </h1>

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-destructive"
        >
          <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      {dupWarning && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-warning"
        >
          <TriangleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{dupWarning}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-4">
            <TaskBasicInfoSection
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              pocketTypes={pocketTypes}
              newFiles={newFiles}
              retainedFiles={retainedFiles}
              disabled={isSubmitting || createTask.isPending || updateTask.isPending}
              onNewFilesChange={setNewFiles}
              onRemoveRetainedFile={(path) =>
                setRetainedFiles((prev) => prev.filter((f) => f.path !== path))
              }
            />
            <TaskPeopleSection
              control={control}
              setValue={setValue}
              errors={errors}
              directory={directory}
              allowReaders={allowReaders}
              allowCross={allowCross}
            />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <TaskScheduleSection
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              depts={depts}
            />
            <TaskRequesterSection
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              depts={depts}
              sites={sites}
              directory={directory}
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createTask.isPending || updateTask.isPending}
          >
            {mode === 'edit' ? t('common.save') : t('tasks.createForm.submit')}
          </Button>
        </div>
      </form>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.createForm.unsavedTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.createForm.unsavedDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tasks.createForm.stay')}</AlertDialogCancel>
            <AlertDialogAction onClick={navigateAway}>
              {t('tasks.createForm.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
