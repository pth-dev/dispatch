import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileDropzone } from '@/components/ui/file-dropzone'
import {
  TaskReportFormSchema,
  type RawTask,
  type SplitMember,
  type TaskReportFormValues,
} from '@/schemas/task'
import type { SessionUser } from '@/schemas/auth'
import { isTaskPaused } from '@/utils/task-domain'
import { resolveApiErrorMessage } from '@/services'
import { SELECT_FIELD_CLASS } from '../api/task-catalog'
import { useSubmitReport } from '../api/queries'

type ReportComposerProps = {
  task: RawTask
  user: SessionUser
  splitMembers: SplitMember[]
}

export function ReportComposer({ task, user, splitMembers }: ReportComposerProps) {
  const { t, i18n } = useTranslation()
  const submitReport = useSubmitReport()
  const [files, setFiles] = React.useState<File[]>([])
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const selfSplitMember = splitMembers.find(
    (m) => m.assignee.trim().toLowerCase() === user.username.trim().toLowerCase(),
  )
  const defaultTargetId = selfSplitMember?.id ?? task.id

  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskReportFormValues>({
    resolver: zodResolver(TaskReportFormSchema),
    defaultValues: {
      content: '',
      progress: task.progress,
      km_link: '',
      status: isTaskPaused(task) ? 'paused' : 'running',
      pause_reason: task.pause_reason ?? '',
      target_id: defaultTargetId,
    },
  })

  const currentStatus = useWatch({ control, name: 'status' })
  const currentProgress = useWatch({ control, name: 'progress' })

  const handleStatusChange = (nextStatus: 'running' | 'paused') => {
    setValue('status', nextStatus)
    if (nextStatus === 'paused' && Number(currentProgress) === 100) {
      setValue('progress', 99)
    }
  }

  const onSubmit = async (values: TaskReportFormValues) => {
    setSubmitError(null)
    const formData = new FormData()
    formData.append('username', user.username)
    formData.append('fullname', user.fullname || user.username)
    formData.append('content', values.content.trim())
    formData.append('progress', String(values.progress))
    formData.append('km_link', values.km_link.trim())
    formData.append('status', values.status)
    if (values.status === 'paused' && values.pause_reason.trim()) {
      formData.append('pause_reason', values.pause_reason.trim())
    }
    if (splitMembers.length > 0 && values.target_id) {
      formData.append('target_id', String(values.target_id))
    }
    for (const file of files) {
      formData.append('files', file)
    }

    try {
      await submitReport.mutateAsync({ taskId: task.id, formData })
      reset({
        content: '',
        progress: values.progress,
        km_link: '',
        status: values.status,
        pause_reason: values.status === 'paused' ? values.pause_reason : '',
        target_id: values.target_id,
      })
      setFiles([])
    } catch (err) {
      setSubmitError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{t('tasks.report.composerTitle')}</h2>

      {submitError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-destructive">
          <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor="report-progress" className="block text-xs font-semibold text-foreground">
              {t('tasks.report.progressLabel')} (%)
            </label>
            <Input
              id="report-progress"
              type="number"
              min={0}
              max={currentStatus === 'paused' ? 99 : 100}
              aria-invalid={Boolean(errors.progress)}
              {...register('progress', { valueAsNumber: true })}
            />
            {errors.progress?.message && (
              <p className="text-xs text-destructive">{t(errors.progress.message)}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="report-status" className="block text-xs font-semibold text-foreground">
              {t('tasks.report.stateLabel')}
            </label>
            <select
              id="report-status"
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as 'running' | 'paused')}
              className={SELECT_FIELD_CLASS}
            >
              <option value="running">{t('tasks.report.stateRunning')}</option>
              <option value="paused">{t('tasks.report.statePaused')}</option>
            </select>
          </div>

          {splitMembers.length > 0 && !selfSplitMember && (
            <div className="space-y-1">
              <label htmlFor="report-target" className="block text-xs font-semibold text-foreground">
                {t('tasks.report.targetMember')}
              </label>
              <select
                id="report-target"
                {...register('target_id', { valueAsNumber: true })}
                className={SELECT_FIELD_CLASS}
              >
                {splitMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.id} • {m.assignee}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {currentStatus === 'paused' && (
          <div className="space-y-1">
            <label htmlFor="report-pause-reason" className="block text-xs font-semibold text-foreground">
              {t('tasks.report.pauseReason')}
            </label>
            <Input
              id="report-pause-reason"
              type="text"
              placeholder={t('tasks.report.pauseReasonPlaceholder')}
              {...register('pause_reason')}
            />
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="report-content" className="block text-xs font-semibold text-foreground">
            {t('tasks.report.contentLabel')}
          </label>
          <Textarea
            id="report-content"
            rows={3}
            placeholder={t('tasks.report.contentPlaceholder')}
            {...register('content')}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="report-kmlink" className="block text-xs font-semibold text-foreground">
              {t('tasks.report.kmLink')}
            </label>
            <Input
              id="report-kmlink"
              type="text"
              placeholder="https://..."
              {...register('km_link')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="report-files" className="block text-xs font-semibold text-foreground">
              {t('tasks.detail.attachments')}
            </label>
            <FileDropzone
              id="report-files"
              files={files}
              onFilesChange={setFiles}
              disabled={isSubmitting || submitReport.isPending}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || submitReport.isPending}>
            <Send className="size-4" aria-hidden="true" />
            <span>{t('tasks.report.submit')}</span>
          </Button>
        </div>
      </form>
    </section>
  )
}
