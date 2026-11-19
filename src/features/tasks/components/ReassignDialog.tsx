import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import { DEPARTMENTS } from '@/mocks/data/departments'
import {
  TaskReassignFormSchema,
  type TaskReassignFormValues,
  type Task,
} from '@/schemas/task'

interface ReassignDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (values: TaskReassignFormValues) => void
  isSubmitting?: boolean
}

export function ReassignDialog({
  task,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting = false,
}: ReassignDialogProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskReassignFormValues>({
    resolver: zodResolver(TaskReassignFormSchema),
    defaultValues: {
      department: task?.department || 'it',
      assignee: '',
      reason: '',
    },
  })

  const selectedDepartmentId = useWatch({ control, name: 'department' })
  const selectedAssignee = useWatch({ control, name: 'assignee' })
  const selectedDepartment = DEPARTMENTS.find((d) => d.id === selectedDepartmentId)
  const assignees = selectedDepartment?.members || []

  React.useEffect(() => {
    if (task && open) {
      reset({
        department: task.department || 'it',
        assignee: '',
        reason: '',
      })
    }
  }, [task, open, reset])

  const onSubmit = (data: TaskReassignFormValues) => {
    onConfirm(data)
  }

  const renderFormContent = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
      {/* Current Task Code and Assignee Info */}
      <div className="bg-muted p-3 rounded-lg space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">{task?.id}</span>
          <span className="text-foreground font-medium truncate">{task?.title}</span>
        </div>
        <p className="text-muted-foreground text-[11px]">
          {t('tasks.reassign.currentAssignee', { name: task?.assignee || '-' })}
        </p>
      </div>

      {/* Target Department */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground">
          {t('tasks.reassign.targetDepartment')} *
        </label>
        <Select
          value={selectedDepartmentId}
          onValueChange={(val) => {
            setValue('department', val)
            setValue('assignee', '')
          }}
        >
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder={t('tasks.reassign.departmentPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept.id} value={dept.id} className="text-xs">
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Assignee */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground">
          {t('tasks.reassign.targetAssignee')} *
        </label>
        <Select
          value={selectedAssignee}
          onValueChange={(val) => setValue('assignee', val)}
        >
          <SelectTrigger className="h-10 text-xs">
            <SelectValue placeholder={t('tasks.reassign.assigneePlaceholder')} />
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
          <p className="text-destructive text-[11px] font-medium">{t('tasks.reassign.assigneeError')}</p>
        )}
      </div>

      {/* Reassign Reason */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground">
          {t('tasks.reassign.reason')} *
        </label>
        <Textarea
          {...register('reason')}
          placeholder={t('tasks.reassign.reasonPlaceholder')}
          rows={3}
          className="text-xs"
        />
        {errors.reason && (
          <p className="text-destructive text-[11px] font-medium">
            {t('tasks.reassign.reasonError')}
          </p>
        )}
      </div>

      <div className="pt-2 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="h-9 px-4 text-xs"
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 px-4 text-xs bg-primary hover:bg-primary-hover text-white"
        >
          {isSubmitting ? t('common.loading') : t('tasks.reassign.confirm')}
        </Button>
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl p-5 space-y-4 max-h-[90vh]">
          <SheetHeader className="text-left border-b border-border pb-3">
            <SheetTitle className="text-base font-semibold text-foreground">
              {t('tasks.reassign.title')}
            </SheetTitle>
          </SheetHeader>
          {renderFormContent()}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-base font-semibold text-foreground">
            {t('tasks.reassign.title')}
          </DialogTitle>
        </DialogHeader>
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  )
}
