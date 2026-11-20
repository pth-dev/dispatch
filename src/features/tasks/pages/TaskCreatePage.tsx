import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CircleAlert, Paperclip, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  type ConfidentialLevel,
  type RawAttachment,
  type RawTask,
  type TaskEditorFormValues,
} from '@/schemas/task'
import { canSetCross, canSetReaders } from '@/utils/permissions'
import { parseAttachments } from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import {
  checkDuplicateTask,
  useCreateTask,
  useMetaDepts,
  useMetaSites,
  usePocketTaskTypes,
  useTaskById,
  useUpdateTask,
  useUserDirectory,
} from '../api/queries'
import { getDeptDisplayName, getSiteDisplayName } from '../api/meta'
import {
  buildDefaultTaskEditorValues,
  buildTaskFormData,
} from '../api/build-task-form-data'

const LEVEL_OPTIONS = [
  '一般件 (指定時間內完成) / Bình thường',
  '緊急件 (優先處理) / Khẩn cấp',
  '最速件 (立即處理) / Hỏa tốc',
]

const RISK_OPTIONS = ['無 / Không', '低 / Thấp', '中 / Trung bình', '高 / Cao']

const SECRECY_ORDER: ConfidentialLevel[] = [0, 1, 3, 2]

export function TaskCreatePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const editId = id ? Number(id) : undefined
  const cloneId = searchParams.get('clone') ? Number(searchParams.get('clone')) : undefined
  const mode: 'create' | 'edit' | 'clone' = editId ? 'edit' : cloneId ? 'clone' : 'create'

  const sourceId = editId ?? cloneId ?? 0
  const { data: sourceTask, isLoading: loadingSource } = useTaskById(sourceId)
  const { t } = useTranslation()

  if (sourceId > 0 && loadingSource) {
    return (
      <div className="flex-1 p-6 text-xs text-muted-foreground">{t('common.loading')}</div>
    )
  }

  return (
    <TaskEditorForm
      key={`${mode}-${sourceTask?.id ?? 'new'}`}
      mode={mode}
      sourceTask={sourceTask}
    />
  )
}

interface TaskEditorFormProps {
  mode: 'create' | 'edit' | 'clone'
  sourceTask?: RawTask
}

function TaskEditorForm({ mode, sourceTask }: TaskEditorFormProps) {
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
  const [dupMatchKey, setDupMatchKey] = React.useState<string | null>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false)

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaskEditorFormValues>({
    resolver: zodResolver(TaskEditorFormSchema) as never,
    defaultValues: buildDefaultTaskEditorValues(user, sourceTask),
  })

  const watchTitle = useWatch({ control, name: 'title' })
  const watchDueDate = useWatch({ control, name: 'due_date' })
  const watchRecurType = useWatch({ control, name: 'recur_type' })
  const watchReqDepts = useWatch({ control, name: 'req_depts' })
  const watchSites = useWatch({ control, name: 'site' })
  const watchAssignees = useWatch({ control, name: 'assign_person' })
  const watchCrossDept = useWatch({ control, name: 'cross_dept' })
  const watchConfidential = useWatch({ control, name: 'confidential' })
  const watchReaders = useWatch({ control, name: 'readers' })
  const watchCrossViewers = useWatch({ control, name: 'cross_viewers' })

  const currentDupKey =
    watchTitle.trim() && watchDueDate.trim().slice(0, 10)
      ? `${watchTitle.trim()}|${watchDueDate.trim().slice(0, 10)}`
      : ''
  const dupWarning =
    currentDupKey && dupMatchKey === currentDupKey ? t('errors.codes.DUP_TITLE_DUE') : null

  // Live debounced duplicate check (title + due date)
  React.useEffect(() => {
    const title = watchTitle.trim()
    const dueDay = watchDueDate.trim().slice(0, 10)
    if (!title || !dueDay) return

    const targetKey = `${title}|${dueDay}`
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void checkDuplicateTask({
        title,
        due: dueDay,
        exclude: mode === 'edit' ? sourceTask?.id : undefined,
        signal: controller.signal,
      })
        .then((res) => {
          setDupMatchKey(res.duplicate ? targetKey : null)
        })
        .catch(() => {
          // Non-blocking live check
        })
    }, 400)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [watchTitle, watchDueDate, mode, sourceTask?.id])

  const toggleMulti = (
    field: 'req_depts' | 'site' | 'assign_person' | 'readers' | 'cross_viewers',
    current: string[],
    value: string,
  ) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
  }

  const onSubmit = async (values: TaskEditorFormValues) => {
    setSubmitError(null)

    if (mode === 'clone' && sourceTask) {
      const srcDay = (sourceTask.due_date ?? '').trim().slice(0, 10)
      const nextDay = values.due_date.trim().slice(0, 10)
      if (!nextDay || nextDay === srcDay) {
        setSubmitError(t('tasks.validation.cloneDueDateMustChange'))
        return
      }
    }

    const preservedWorkItems =
      mode === 'edit' && sourceTask?.work_items
        ? typeof sourceTask.work_items === 'string'
          ? sourceTask.work_items
          : JSON.stringify(sourceTask.work_items)
        : ''

    const preservedTypeDetail =
      mode === 'edit' && sourceTask?.type_detail
        ? typeof sourceTask.type_detail === 'string'
          ? sourceTask.type_detail
          : JSON.stringify(sourceTask.type_detail)
        : ''

    const formData = buildTaskFormData({
      mode,
      values,
      reporter: user?.username ?? '',
      newFiles,
      retainedFiles,
      cloneFromId: mode === 'clone' ? sourceTask?.id : undefined,
      preservedWorkItems,
      preservedTypeDetail,
    })

    try {
      if (mode === 'edit' && sourceTask) {
        await updateTask.mutateAsync({ id: sourceTask.id, formData })
        navigate(APP_ROUTES.TASK_DETAIL(sourceTask.id), { replace: true })
      } else {
        const res = await createTask.mutateAsync(formData)
        if (res.id) {
          navigate(APP_ROUTES.TASK_DETAIL(res.id), { replace: true })
        } else {
          navigate(APP_ROUTES.TASKS, { replace: true })
        }
      }
    } catch (err) {
      setSubmitError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  const handleCancel = () => {
    if (isDirty || newFiles.length > 0) {
      setLeaveDialogOpen(true)
    } else {
      navigate(-1)
    }
  }

  const pageTitle =
    mode === 'edit'
      ? t('tasks.createForm.editTitle', { id: String(sourceTask?.id ?? '') })
      : mode === 'clone'
        ? t('tasks.createForm.cloneTitle', { id: String(sourceTask?.id ?? '') })
        : t('tasks.createForm.title')

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-4xl space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        <Link to={APP_ROUTES.TASKS} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowLeft className="size-3.5" />
          <span>{t('tasks.detail.backToList')}</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-primary">{pageTitle}</span>
      </div>

      <h1 className="text-xl lg:text-2xl font-semibold text-foreground">{pageTitle}</h1>

      {submitError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-destructive">
          <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      {dupWarning && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-warning">
          <TriangleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{dupWarning}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-20 lg:pb-6" noValidate>
        {/* Basic Info */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">{t('tasks.createForm.infoSection')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="task-title" className="block text-xs font-semibold text-foreground">
                {t('tasks.createForm.taskName')} *
              </label>
              <Input
                id="task-title"
                placeholder={t('tasks.createForm.taskNamePlaceholder')}
                {...register('title')}
              />
              {errors.title?.message && (
                <p className="text-xs text-destructive">{t(errors.title.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-type" className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.taskType')} *
              </label>
              <Input
                id="task-type"
                list="pocket-task-types"
                placeholder={t('tasks.fields.taskTypePlaceholder')}
                {...register('task_type')}
              />
              <datalist id="pocket-task-types">
                {pocketTypes.map((item) => (
                  <option key={item.id} value={item.value} />
                ))}
              </datalist>
              {errors.task_type?.message && (
                <p className="text-xs text-destructive">{t(errors.task_type.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-contact" className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.reqContact')} *
              </label>
              <Input id="task-contact" list="directory-users" {...register('req_contact')} />
              <datalist id="directory-users">
                {directory.map((u) => (
                  <option key={u.username} value={u.username}>
                    {u.fullname ? `${u.username} - ${u.fullname}` : u.username}
                  </option>
                ))}
              </datalist>
              {errors.req_contact?.message && (
                <p className="text-xs text-destructive">{t(errors.req_contact.message)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-level" className="block text-xs font-semibold text-foreground">
                {t('tasks.createForm.priority')}
              </label>
              <select
                id="task-level"
                {...register('level')}
                className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
              >
                {LEVEL_OPTIONS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-risk" className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.riskStatus')}
              </label>
              <select
                id="task-risk"
                {...register('risk_status')}
                className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
              >
                {RISK_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="task-content" className="block text-xs font-semibold text-foreground">
                {t('tasks.createForm.description')}
              </label>
              <Textarea
                id="task-content"
                rows={4}
                placeholder={t('tasks.createForm.descriptionPlaceholder')}
                {...register('content')}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="task-precautions" className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.precautions')}
              </label>
              <Textarea id="task-precautions" rows={2} {...register('precautions')} />
            </div>
          </div>
        </section>

        {/* Assignment, Sites, Schedule */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            {t('tasks.createForm.assignmentSection')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Requesting Departments */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.reqDepts')} *
              </span>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
                {depts.map((dept) => (
                  <label key={dept.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={watchReqDepts.includes(dept.value)}
                      onCheckedChange={() => toggleMulti('req_depts', watchReqDepts, dept.value)}
                    />
                    <span>{getDeptDisplayName(dept, i18n.language)}</span>
                  </label>
                ))}
              </div>
              {errors.req_depts?.message && (
                <p className="text-xs text-destructive">{t(errors.req_depts.message)}</p>
              )}
            </div>

            {/* Sites */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.site')} *
              </span>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
                {sites.map((site) => (
                  <label key={site.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={watchSites.includes(site.value)}
                      onCheckedChange={() => toggleMulti('site', watchSites, site.value)}
                    />
                    <span>{getSiteDisplayName(site, i18n.language)}</span>
                  </label>
                ))}
              </div>
              {errors.site?.message && (
                <p className="text-xs text-destructive">{t(errors.site.message)}</p>
              )}
            </div>

            {/* Assigned Unit */}
            <div className="space-y-1.5">
              <label htmlFor="task-assigned-unit" className="block text-xs font-semibold text-foreground">
                {t('common.department')} *
              </label>
              <select
                id="task-assigned-unit"
                {...register('assigned_unit')}
                className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="">{t('tasks.createForm.departmentPlaceholder')}</option>
                {depts.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {getDeptDisplayName(dept, i18n.language)}
                  </option>
                ))}
              </select>
              {errors.assigned_unit?.message && (
                <p className="text-xs text-destructive">{t(errors.assigned_unit.message)}</p>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-1.5">
              <label htmlFor="task-recur-type" className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.recurType')}
              </label>
              <select
                id="task-recur-type"
                {...register('recur_type')}
                className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="once">{t('tasks.fields.recurOnce')}</option>
                <option value="weekly">{t('tasks.fields.recurWeekly')}</option>
                <option value="monthly">{t('tasks.fields.recurMonthly')}</option>
              </select>
            </div>

            {watchRecurType === 'once' ? (
              <div className="space-y-1.5">
                <label htmlFor="task-due-date" className="block text-xs font-semibold text-foreground">
                  {t('common.dueDate')} *
                </label>
                <Input id="task-due-date" type="datetime-local" {...register('due_date')} />
                {errors.due_date?.message && (
                  <p className="text-xs text-destructive">{t(errors.due_date.message)}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="task-recur-time" className="block text-xs font-semibold text-foreground">
                  {t('tasks.fields.recurTime')}
                </label>
                <Input id="task-recur-time" type="time" {...register('recur_time')} />
              </div>
            )}

            {/* Confidentiality */}
            <div className="space-y-1.5">
              <label htmlFor="task-confidential" className="block text-xs font-semibold text-foreground">
                {t('tasks.confidential.label')}
              </label>
              <select
                id="task-confidential"
                value={watchConfidential}
                onChange={(e) =>
                  setValue('confidential', Number(e.target.value) as ConfidentialLevel, {
                    shouldDirty: true,
                  })
                }
                className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
              >
                {SECRECY_ORDER.map((lv) => (
                  <option key={lv} value={lv}>
                    {t(`tasks.confidential.lv${lv}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignees (multi-select, >=2 triggers backend auto-split) */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  {t('common.assignee')} ({watchAssignees.length}/20)
                </span>
                {watchAssignees.length >= 2 && (
                  <span className="text-primary">{t('tasks.fields.autoSplitHint')}</span>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
                {directory.map((person) => (
                  <label key={person.username} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={watchAssignees.includes(person.username)}
                      onCheckedChange={() =>
                        toggleMulti('assign_person', watchAssignees, person.username)
                      }
                    />
                    <span className="truncate">
                      {person.fullname ? `${person.fullname} (${person.username})` : person.username}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Readers & Cross-dept Viewers */}
            {allowReaders && (
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-foreground">
                  {t('tasks.fields.readers')} ({watchReaders.length})
                </span>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
                  {directory.map((person) => (
                    <label key={person.username} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={watchReaders.includes(person.username)}
                        onCheckedChange={() =>
                          toggleMulti('readers', watchReaders, person.username)
                        }
                      />
                      <span className="truncate">{person.fullname || person.username}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {allowCross && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                  <Checkbox
                    checked={watchCrossDept}
                    onCheckedChange={(checked) =>
                      setValue('cross_dept', checked === true, { shouldDirty: true })
                    }
                  />
                  <span>{t('tasks.fields.crossDept')}</span>
                </label>
                {watchCrossDept && (
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
                    {directory.map((person) => (
                      <label key={person.username} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={watchCrossViewers.includes(person.username)}
                          onCheckedChange={() =>
                            toggleMulti('cross_viewers', watchCrossViewers, person.username)
                          }
                        />
                        <span className="truncate">{person.fullname || person.username}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KM Link & Attachments */}
            <div className="space-y-1.5">
              <label htmlFor="task-kmlink" className="block text-xs font-semibold text-foreground">
                {t('tasks.report.kmLink')}
              </label>
              <Input id="task-kmlink" placeholder="https://..." {...register('km_link')} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-files" className="block text-xs font-semibold text-foreground">
                {t('tasks.detail.attachments')}
              </label>
              <input
                id="task-files"
                type="file"
                multiple
                onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground"
              />
              {retainedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {retainedFiles.map((att) => (
                    <span
                      key={att.path}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs"
                    >
                      <Paperclip className="size-3 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate max-w-[160px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRetainedFiles((prev) => prev.filter((f) => f.path !== att.path))
                        }
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        aria-label={t('common.delete')}
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Actions Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-end gap-3 border-t border-border bg-card p-3 lg:static lg:border-0 lg:bg-transparent lg:p-0">
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
            <AlertDialogAction onClick={() => navigate(-1)}>
              {t('tasks.createForm.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default TaskCreatePage
