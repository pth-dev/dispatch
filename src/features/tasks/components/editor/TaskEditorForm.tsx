import * as React from 'react'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronsDown, CircleAlert, TriangleAlert, Wrench, Zap } from 'lucide-react'
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
  type RawTask,
  type TaskEditorFormValues,
} from '@/schemas/task'
import { canSetCross, canSetReaders, isComputerRoomUser } from '@/utils/permissions'
import {
  useMetaDepts,
  useMetaSites,
  usePocketTaskTypes,
  useUserDirectory,
} from '../../api/queries'
import {
  buildDailyRepairTaskValues,
  buildDefaultTaskEditorValues,
  getDefaultDueDateTime,
} from '../../api/build-task-form-data'
import { useDeptNameResolver } from '../../hooks/use-dept-name-resolver'
import { useSiteNameResolver } from '../../hooks/use-site-name-resolver'
import { useDuplicateTaskCheck } from '../../hooks/use-duplicate-task-check'
import { useTaskEditorSubmit } from '../../hooks/use-task-editor-submit'
import { TaskBasicInfoSection } from './TaskBasicInfoSection'
import { TaskCreateModeBar, type TaskCreateVariant } from './TaskCreateModeBar'
import { TaskHistoryCloneDialog } from './TaskHistoryCloneDialog'
import { TaskPeopleSection } from './TaskPeopleSection'
import { TaskScheduleSection } from './TaskScheduleSection'
import { TaskRequesterSection } from './TaskRequesterSection'

type TaskEditorFormProps = {
  mode: 'create' | 'edit' | 'clone'
  sourceTask?: RawTask
  initialVariant?: 'full' | 'quick' | 'daily'
  openHistoryOnMount?: boolean
}

export function TaskEditorForm({
  mode,
  sourceTask,
  initialVariant = 'full',
  openHistoryOnMount = false,
}: TaskEditorFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  const { data: metaDepts } = useMetaDepts()
  const { data: metaSites } = useMetaSites()
  const { data: directory = [] } = useUserDirectory()
  const { data: pocketTypes = [] } = usePocketTaskTypes()
  const resolveDept = useDeptNameResolver()
  const resolveSite = useSiteNameResolver()

  const depts = metaDepts?.depts ?? []
  const sites = metaSites?.sites ?? []
  const allowReaders = canSetReaders(user)
  const allowCross = canSetCross(user)
  const showDailyRepair = isComputerRoomUser(user)

  const [variant, setVariant] = React.useState<'full' | 'quick' | 'daily'>(
    mode === 'create' ? initialVariant : 'full',
  )
  const [historyOpen, setHistoryOpen] = React.useState(openHistoryOnMount && mode === 'create')
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false)

  const defaultValues = (() => {
    if (sourceTask) return buildDefaultTaskEditorValues(user, sourceTask)
    if (initialVariant === 'daily') return buildDailyRepairTaskValues(user)
    const base = buildDefaultTaskEditorValues(user)
    if (initialVariant === 'quick' && user?.username) {
      return { ...base, assign_person: [user.username] }
    }
    return base
  })()

  const {
    register,
    control,
    setValue,
    getValues,
    setError,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaskEditorFormValues>({
    resolver: zodResolver(TaskEditorFormSchema),
    defaultValues,
  })

  const {
    newFiles,
    setNewFiles,
    retainedFiles,
    handleRemoveRetainedFile,
    submitError,
    isPending,
    onSubmit,
  } = useTaskEditorSubmit({
    mode,
    sourceTask,
    reporterUsername: user?.username ?? '',
    setError,
  })

  const watchTitle = useWatch({ control, name: 'title' })
  const watchDueDate = useWatch({ control, name: 'due_date' })

  const dupWarning = useDuplicateTaskCheck({
    title: watchTitle,
    dueDate: watchDueDate,
    excludeId: mode === 'edit' ? sourceTask?.id : undefined,
  })

  const isQuickMode = mode === 'create' && variant === 'quick'
  const isDailyMode = mode === 'create' && variant === 'daily'
  const activeModeVariant: TaskCreateVariant = mode === 'clone' ? 'clone' : variant

  const handleSelectFull = () => {
    if (mode === 'clone') {
      navigate(APP_ROUTES.TASK_NEW, { replace: true })
      return
    }
    setVariant('full')
  }

  const handleSelectQuick = () => {
    if (mode === 'clone') {
      navigate(`${APP_ROUTES.TASK_NEW}?mode=quick`, { replace: true })
      return
    }
    if (getValues('recur_type') !== 'once') {
      setValue('recur_type', 'once', { shouldDirty: false })
    }
    if (!getValues('due_date')) {
      setValue('due_date', getDefaultDueDateTime(), { shouldDirty: false })
    }
    if (getValues('assign_person').length === 0 && user?.username) {
      setValue('assign_person', [user.username], { shouldDirty: false })
    }
    setVariant('quick')
  }

  const handleSelectDailyRepair = () => {
    navigate(`${APP_ROUTES.TASK_NEW}?mode=daily`, { replace: true })
  }

  const handleInvalidSubmit = (fieldErrors: FieldErrors<TaskEditorFormValues>) => {
    if (!isQuickMode) return
    const hiddenFieldHasError = Boolean(
      fieldErrors.req_depts ||
        fieldErrors.req_contact ||
        fieldErrors.site ||
        fieldErrors.recur_weekdays ||
        fieldErrors.recur_monthdays,
    )
    if (hiddenFieldHasError) {
      setVariant('full')
    }
  }

  const handlePickHistoricalTask = (picked: RawTask) => {
    navigate(`${APP_ROUTES.TASK_NEW}?clone=${picked.id}`, { replace: true })
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
        : isQuickMode
          ? t('tasks.createModes.quick')
          : isDailyMode
            ? t('tasks.createModes.dailyRepair')
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
          {pageTitle}
        </h1>

        {mode !== 'edit' && (
          <TaskCreateModeBar
            activeVariant={activeModeVariant}
            showDailyRepair={showDailyRepair}
            onSelectFull={handleSelectFull}
            onSelectQuick={handleSelectQuick}
            onOpenHistoryPicker={() => setHistoryOpen(true)}
            onSelectDailyRepair={handleSelectDailyRepair}
          />
        )}
      </div>

      {isQuickMode && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs text-foreground"
        >
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Zap className="size-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
            <span>
              {t('tasks.createModes.quickHint', {
                dept: resolveDept(user?.dept),
                site: user?.site ? resolveSite(user.site) : '-',
              })}
            </span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setVariant('full')}>
            <ChevronsDown className="size-3.5" aria-hidden="true" />
            <span>{t('tasks.createModes.expandFull')}</span>
          </Button>
        </div>
      )}

      {isDailyMode && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-foreground"
        >
          <Wrench className="size-4 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
          <span>{t('tasks.createModes.dailyHint')}</span>
        </div>
      )}

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

      <form
        onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
        className="space-y-4"
        noValidate
      >
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
              disabled={isSubmitting || isPending}
              compact={isQuickMode}
              onNewFilesChange={setNewFiles}
              onRemoveRetainedFile={handleRemoveRetainedFile}
            />
            <TaskPeopleSection
              control={control}
              setValue={setValue}
              errors={errors}
              directory={directory}
              allowReaders={allowReaders}
              allowCross={allowCross}
              hideViewers={isQuickMode}
            />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <TaskScheduleSection
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              depts={depts}
              compact={isQuickMode}
            />
            {!isQuickMode && (
              <TaskRequesterSection
                control={control}
                register={register}
                setValue={setValue}
                errors={errors}
                depts={depts}
                sites={sites}
                directory={directory}
              />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting || isPending}>
            {mode === 'edit' ? t('common.save') : t('tasks.createForm.submit')}
          </Button>
        </div>
      </form>

      {mode !== 'edit' && (
        <TaskHistoryCloneDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          onPickTask={handlePickHistoricalTask}
        />
      )}

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
