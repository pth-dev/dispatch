import * as React from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileEdit,
  User,
  Building,
  Calendar,
  Paperclip,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusText } from '@/components/ui/status-text'
import { useTask, useApproveTask, useRejectTask } from '../api/queries'
import { APP_ROUTES } from '@/constants/app-routes'

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

export function TaskApprovePage() {
  const { id = '' } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: task, isLoading, error } = useTask(id)
  const approveMutation = useApproveTask()
  const rejectMutation = useRejectTask()

  const [approvalNote, setApprovalNote] = React.useState('')
  const [checkedOverrides, setCheckedOverrides] = React.useState<Record<string, boolean>>({})

  // Dialog states
  const [confirmApproveOpen, setConfirmApproveOpen] = React.useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectAction, setRejectAction] = React.useState<'request_revision' | 'reject'>('request_revision')
  const [rejectReason, setRejectReason] = React.useState('')
  const [reasonError, setReasonError] = React.useState('')

  const isItemChecked = (item: { id: string; completed: boolean }) => {
    return checkedOverrides[item.id] !== undefined
      ? checkedOverrides[item.id]
      : item.completed
  }

  const toggleCheck = (item: { id: string; completed: boolean }) => {
    const currentVal = isItemChecked(item)
    setCheckedOverrides((prev) => ({ ...prev, [item.id]: !currentVal }))
  }

  const allChecked =
    task?.checklist && task.checklist.length > 0
      ? task.checklist.every((item) => isItemChecked(item))
      : true

  const checkedCount =
    task?.checklist?.filter((item) => isItemChecked(item)).length || 0

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-28 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
        <AlertTriangle className="size-10 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">
          {t('errors.notFoundTitle')}
        </h2>
        <Button asChild variant="outline">
          <Link to={APP_ROUTES.TASKS}>{t('tasks.detail.backToList')}</Link>
        </Button>
      </div>
    )
  }


  const handleConfirmApprove = () => {
    approveMutation.mutate(
      { id: task.id, data: { note: approvalNote, checklistPassed: true } },
      {
        onSuccess: () => {
          navigate(APP_ROUTES.TASK_DETAIL(task.id))
        },
      },
    )
  }

  const handleOpenRejectDialog = (action: 'request_revision' | 'reject') => {
    setRejectAction(action)
    setRejectReason('')
    setReasonError('')
    setRejectDialogOpen(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setReasonError('Vui lòng nhập lý do tối thiểu 5 ký tự')
      return
    }

    rejectMutation.mutate(
      {
        id: task.id,
        data: {
          action: rejectAction,
          reason: rejectReason.trim(),
        },
      },
      {
        onSuccess: () => {
          navigate(APP_ROUTES.TASK_DETAIL(task.id))
        },
      },
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 lg:p-6 space-y-4 pb-28 lg:pb-6">
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
        <Link
          to={APP_ROUTES.TASK_DETAIL(task.id)}
          className="hover:text-foreground"
        >
          {task.id}
        </Link>
        <span>›</span>
        <span className="font-semibold text-primary">
          {t('tasks.approve.title')}
        </span>
      </div>

      {/* ── Stacked Header ── */}
      <div className="bg-card rounded-xl border border-border p-4 lg:p-5 space-y-3 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-primary-soft text-primary font-bold px-2 py-0.5 rounded text-xs">
                {task.id}
              </span>
              <h1 className="text-lg lg:text-xl font-semibold text-foreground">
                {t('tasks.approve.title')}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-2xl">
              Nhiệm vụ: {task.title}
            </p>
            <div className="pt-1">
              <StatusText status={task.status} />
            </div>
          </div>

          {/* Desktop Actions (>= lg) */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => handleOpenRejectDialog('request_revision')}
            >
              <FileEdit className="size-3.5 text-amber-600" />
              <span>{t('tasks.approve.requestChanges')}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => handleOpenRejectDialog('reject')}
            >
              <XCircle className="size-3.5 text-destructive" />
              <span>{t('tasks.approve.reject')}</span>
            </Button>

            <Button
              size="sm"
              disabled={!allChecked}
              className="h-9 gap-1.5 text-xs bg-primary hover:bg-primary-hover text-white disabled:opacity-50"
              onClick={() => setConfirmApproveOpen(true)}
            >
              <CheckCircle2 className="size-3.5" />
              <span>{t('tasks.approve.confirmApprove')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Layout: 2 Columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 cols): Checklist and Notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Checklist Card */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-semibold text-foreground">
                {t('tasks.approve.checklistTitle')}
              </h3>
              <span className="text-xs text-muted-foreground">
                Đã kiểm tra: {checkedCount}/{task.checklist?.length || 0}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {task.checklist?.map((item) => {
                const checked = isItemChecked(item)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item)}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-border/80 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleCheck(item)}
                      className="mt-0.5"
                    />
                    <div className="text-xs space-y-0.5">
                      <p className="font-medium text-foreground">{item.text}</p>
                      <span className="text-[11px] text-muted-foreground">
                        Bắt buộc kiểm tra trước khi phê duyệt nghiệm thu
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Approval Note */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            <label className="text-sm font-semibold text-foreground">
              {t('tasks.approve.noteLabel')}
            </label>
            <Textarea
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder={t('tasks.approve.notePlaceholder')}
              rows={4}
              className="text-xs"
            />
          </div>
        </div>

        {/* Right Column (1 col): Task Info & Deliverables */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-foreground">
              Thông tin hồ sơ nghiệm thu
            </h3>

            <div className="space-y-2.5 divide-y divide-border/60">
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="size-3.5" />
                  {t('common.assignee')}:
                </span>
                <span className="font-medium text-foreground">{task.assignee}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Building className="size-3.5" />
                  {t('common.department')}:
                </span>
                <span className="font-medium text-foreground">
                  {task.departmentName || task.department}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  Hạn hoàn thành:
                </span>
                <span className="font-medium text-foreground">
                  {formatDateVN(task.dueDate)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  Ngày nộp nghiệm thu:
                </span>
                <span className="font-medium text-primary">15/11/2026</span>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-2 text-xs">
            <h3 className="text-sm font-semibold text-foreground">
              Tệp tài liệu nghiệm thu
            </h3>
            {task.attachments && task.attachments.length > 0 ? (
              <div className="space-y-1.5">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="size-3.5 text-primary shrink-0" />
                      <span className="truncate font-medium">{att.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 pl-2">
                      {att.size}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs italic">
                Chưa có tài liệu đính kèm
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Action Bar (< lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border p-3 shadow-lg space-y-2">
        <Button
          disabled={!allChecked}
          className="w-full h-11 text-xs bg-primary hover:bg-primary-hover text-white disabled:opacity-50"
          onClick={() => setConfirmApproveOpen(true)}
        >
          <CheckCircle2 className="size-4 mr-1.5" />
          <span>{t('tasks.approve.confirmApprove')}</span>
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-10 text-xs text-amber-700 border-amber-300"
            onClick={() => handleOpenRejectDialog('request_revision')}
          >
            {t('tasks.approve.requestChanges')}
          </Button>
          <Button
            variant="outline"
            className="h-10 text-xs text-destructive border-destructive/30"
            onClick={() => handleOpenRejectDialog('reject')}
          >
            {t('tasks.approve.reject')}
          </Button>
        </div>
      </div>

      {/* ── Confirm Approve Modal (Default tone, not red) ── */}
      <Dialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <DialogContent className="max-w-md p-6 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {t('tasks.approve.confirmDialog.approveTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('tasks.approve.confirmDialog.approveDesc')}
          </p>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmApproveOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject / Request Revision Modal ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md p-6 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {rejectAction === 'reject'
                ? t('tasks.approve.confirmDialog.rejectTitle')
                : t('tasks.approve.requestChanges')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-xs">
            <label className="font-semibold text-foreground">
              {t('tasks.approve.confirmDialog.rejectDesc')} *
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value)
                if (reasonError) setReasonError('')
              }}
              placeholder={t('tasks.approve.confirmDialog.reasonPlaceholder')}
              rows={3}
              className="text-xs"
            />
            {reasonError && (
              <p className="text-destructive text-[11px] font-medium">{reasonError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              variant={rejectAction === 'reject' ? 'destructive' : 'default'}
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default TaskApprovePage
