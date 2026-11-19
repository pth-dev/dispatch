import { useState } from 'react'
import { Link, useBlocker, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Send, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTask, useDepartments } from '../api/queries'
import {
  TaskCreateFormSchema,
  type TaskCreateFormValues,
} from '@/schemas/task'
import { APP_ROUTES } from '@/constants/app-routes'

export function TaskCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateTask()
  const { data: departments = [] } = useDepartments()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaskCreateFormValues>({
    resolver: zodResolver(TaskCreateFormSchema),
    defaultValues: {
      title: '',
      description: '',
      department: 'it',
      assignee: '',
      dueDate: '',
      priority: 'normal',
    },
  })

  const selectedDepartmentId = useWatch({ control, name: 'department' })
  const assigneeValue = useWatch({ control, name: 'assignee' })
  const priorityValue = useWatch({ control, name: 'priority' })
  const selectedDepartment = departments.find((d) => d.id === selectedDepartmentId)
  const assignees = selectedDepartment?.members || []

  const [allowLeave, setAllowLeave] = useState(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !allowLeave && currentLocation.pathname !== nextLocation.pathname,
  )

  const onSubmit: SubmitHandler<TaskCreateFormValues> = (data) => {
    setAllowLeave(true)
    createMutation.mutate(data, {
      onSuccess: (newTask) => {
        navigate(APP_ROUTES.TASK_DETAIL(newTask.id))
      },
    })
  }

  const handleCancel = () => {
    navigate(APP_ROUTES.TASKS)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pb-24 lg:pb-6">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        <Link
          to={APP_ROUTES.TASKS}
          className="flex items-center gap-1 hover:text-foreground font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t('tasks.detail.backToList')}</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-primary">
          {t('tasks.createForm.title')}
        </span>
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
          {t('tasks.createForm.title')}
        </h1>
      </div>

      {/* ── Form Container ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Desktop 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column (2 cols): Main Task Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2.5">
                {t('tasks.createForm.infoSection')}
              </h2>

              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('tasks.createForm.taskName')} <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register('title')}
                  placeholder={t('tasks.createForm.taskNamePlaceholder')}
                  className="h-11 lg:h-10 text-xs"
                />
                {errors.title && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                    <AlertCircle className="size-3" />
                    <span>{t('tasks.validation.titleRequired')}</span>
                  </p>
                )}
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t('tasks.createForm.description')}
                </label>
                <Textarea
                  {...register('description')}
                  placeholder={t('tasks.createForm.descriptionPlaceholder')}
                  rows={6}
                  className="text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Assignment, Timeline & Priority */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4 text-xs">
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2.5">
                {t('tasks.createForm.assignmentSection')}
              </h2>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  {t('common.department')} <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedDepartmentId}
                  onValueChange={(val) => {
                    setValue('department', val)
                    setValue('assignee', '')
                  }}
                >
                  <SelectTrigger className="h-11 lg:h-10 text-xs">
                    <SelectValue placeholder={t('tasks.createForm.departmentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} className="text-xs">
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  {t('common.assignee')} <span className="text-destructive">*</span>
                </label>
                <Select
                  value={assigneeValue}
                  onValueChange={(val) => setValue('assignee', val)}
                >
                  <SelectTrigger className="h-11 lg:h-10 text-xs">
                    <SelectValue placeholder={t('tasks.createForm.assigneePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignees.map((member) => (
                      <SelectItem key={member} value={member} className="text-xs">
                        {member}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignee && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                    <AlertCircle className="size-3" />
                    <span>{t('tasks.validation.assigneeRequired')}</span>
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  {t('common.dueDate')} <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  {...register('dueDate')}
                  className="h-11 lg:h-10 text-xs"
                />
                {errors.dueDate && (
                  <p className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                    <AlertCircle className="size-3" />
                    <span>{t('tasks.validation.dueDateRequired')}</span>
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">
                  {t('tasks.createForm.priority')}
                </label>
                <Select
                  value={priorityValue}
                  onValueChange={(val: 'normal' | 'urgent') => setValue('priority', val)}
                >
                  <SelectTrigger className="h-11 lg:h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal" className="text-xs">
                      {t('tasks.createForm.priorityNormal')}
                    </SelectItem>
                    <SelectItem value="urgent" className="text-xs text-destructive font-medium">
                      {t('tasks.createForm.priorityUrgent')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop Action Bar (>= lg) ── */}
        <div className="hidden lg:flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-11 lg:h-10 px-5 text-xs"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="h-11 lg:h-10 px-5 text-xs bg-primary hover:bg-primary-hover text-primary-foreground gap-2"
          >
            <Send className="size-3.5" />
            <span>
              {isSubmitting || createMutation.isPending
                ? t('common.loading')
                : t('tasks.createForm.submit')}
            </span>
          </Button>
        </div>

        {/* ── Mobile Sticky Action Bar (< lg) ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="flex-1 h-11 lg:h-10 text-xs"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="flex-1 h-11 lg:h-10 text-xs bg-primary hover:bg-primary-hover text-primary-foreground gap-2"
          >
            <Send className="size-4" />
            <span>
              {isSubmitting || createMutation.isPending
                ? t('common.loading')
                : t('tasks.createForm.submit')}
            </span>
          </Button>
        </div>
      </form>

      <AlertDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.createForm.unsavedTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.createForm.unsavedDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.state === 'blocked' && blocker.reset()}>
              {t('tasks.createForm.stay')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blocker.state === 'blocked' && blocker.proceed()}
            >
              {t('tasks.createForm.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
export default TaskCreatePage
