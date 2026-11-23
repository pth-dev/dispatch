import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Copy, Lock, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusText } from '@/components/ui/status-text'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { APP_ROUTES } from '@/constants/app-routes'
import type { RawTask } from '@/schemas/task'
import { deriveTaskStatus, isTaskPaused, isUrgentLevel } from '@/utils/task-domain'

interface TaskDetailHeaderProps {
  task: RawTask
  allowEdit: boolean
  allowClone: boolean
  allowDelete: boolean
  isDeleting: boolean
  deleteError: string | null
  onConfirmDelete: () => void
}

export function TaskDetailHeader({
  task,
  allowEdit,
  allowClone,
  allowDelete,
  isDeleting,
  deleteError,
  onConfirmDelete,
}: TaskDetailHeaderProps) {
  const { t } = useTranslation()
  const derivedStatus = deriveTaskStatus(task)
  const paused = isTaskPaused(task)
  const urgent = isUrgentLevel(task.level)

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
        <Link
          to={APP_ROUTES.TASKS}
          className="flex items-center gap-1 font-medium hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.detail.backToList')}</span>
        </Link>
        <span>›</span>
        <span className="font-semibold text-primary">#{task.id}</span>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-primary">
                #{task.id}
              </span>
              <StatusText status={derivedStatus} />
              {paused && <StatusText status="paused" />}
              {urgent && <StatusText status="urgent" />}
              {task.confidential !== 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                  <Lock className="size-3.5" aria-hidden="true" />
                  <span>{t(`tasks.confidential.lv${task.confidential}`)}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-foreground break-words">
              {task.title}
            </h1>
            {paused && task.pause_reason && (
              <p className="text-xs text-warning">
                {t('tasks.report.pauseReason')}: {task.pause_reason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            {allowEdit && (
              <Button asChild variant="outline" size="sm" className="px-2.5 sm:px-3">
                <Link to={APP_ROUTES.TASK_EDIT(task.id)}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                  <span>{t('tasks.detail.edit')}</span>
                </Link>
              </Button>
            )}
            {allowClone && (
              <Button asChild variant="outline" size="sm" className="px-2.5 sm:px-3">
                <Link to={`${APP_ROUTES.TASK_NEW}?clone=${task.id}`}>
                  <Copy className="size-3.5" aria-hidden="true" />
                  <span>{t('tasks.detail.clone')}</span>
                </Link>
              </Button>
            )}
            {allowDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    className="px-2.5 sm:px-3"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span>{t('common.delete')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('tasks.detail.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('tasks.detail.deleteConfirmDesc', { id: String(task.id) })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onConfirmDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('common.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {deleteError && (
          <p role="alert" className="text-xs text-destructive">
            {deleteError}
          </p>
        )}
      </section>
    </>
  )
}
