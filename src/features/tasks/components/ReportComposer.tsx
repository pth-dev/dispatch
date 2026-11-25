import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Loader2, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileDropzone } from '@/components/ui/file-dropzone'
import type { RawReport, RawTask, SplitMember, WorkItemsEnvelope } from '@/schemas/task'
import type { SessionUser } from '@/schemas/auth'
import { handleRichTextareaPaste } from '@/utils/rich-paste'
import { SELECT_FIELD_CLASS } from '../api/task-catalog'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'
import { useReportComposer } from '../hooks/use-report-composer'
import { ReportWorkTopicsPicker } from './ReportWorkTopicsPicker'

type ReportComposerProps = {
  task: RawTask
  user: SessionUser
  splitMembers: SplitMember[]
  workItems?: WorkItemsEnvelope | null
  reports?: RawReport[]
  selectTopicRef?: React.RefObject<((topicId: string) => void) | null>
}

export function ReportComposer({
  task,
  user,
  splitMembers,
  workItems = null,
  reports = [],
  selectTopicRef,
}: ReportComposerProps) {
  const { t } = useTranslation()
  const { resolveAssignees } = useUserDisplayResolver()
  const {
    form,
    currentStatus,
    selfSplitMember,
    reportStats,
    files,
    setFiles,
    appendPastedFiles,
    submitError,
    aiError,
    calcHint,
    topicDrafts,
    isAiPending,
    isSubmitPending,
    handleStatusChange,
    handleTopicToggle,
    handleTopicProgressChange,
    handleTopicEarlyChange,
    handleTopicPreset,
    handleCalcWeighted,
    handleAiGenerate,
    onSubmit,
  } = useReportComposer({ task, user, splitMembers, workItems, reports, selectTopicRef })

  const {
    register,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const hasWorkItems = Boolean(workItems && workItems.items.length > 0)
  const isBusy = isSubmitting || isSubmitPending

  return (
    <section id="report" className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t('tasks.report.composerTitle')}</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isAiPending || isBusy}
          onClick={() => void handleAiGenerate()}
        >
          {isAiPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
          )}
          <span>{isAiPending ? t('tasks.report.aiGenerating') : t('tasks.report.aiGenerate')}</span>
        </Button>
      </div>

      {(submitError || aiError) && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-destructive"
        >
          <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{submitError || aiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        {hasWorkItems && workItems && (
          <ReportWorkTopicsPicker
            envelope={workItems}
            reportStats={reportStats}
            currentUsername={user.username}
            drafts={topicDrafts}
            calcHint={calcHint}
            disabled={isBusy}
            onToggle={handleTopicToggle}
            onProgressChange={handleTopicProgressChange}
            onEarlyChange={handleTopicEarlyChange}
            onSelectPreset={handleTopicPreset}
            onCalcTotalProgress={handleCalcWeighted}
          />
        )}

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
                    #{m.id} • {resolveAssignees(m.assignee)}
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
            onPaste={(e) =>
              handleRichTextareaPaste(e, {
                currentValue: getValues('content'),
                onValueChange: (next) => setValue('content', next, { shouldDirty: true }),
                onPasteFiles: appendPastedFiles,
              })
            }
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="report-kmlink" className="block text-xs font-semibold text-foreground">
              {t('tasks.report.kmLink')}
            </label>
            <Input id="report-kmlink" type="text" placeholder="https://..." {...register('km_link')} />
          </div>

          <div className="space-y-1">
            <label htmlFor="report-files" className="block text-xs font-semibold text-foreground">
              {t('tasks.detail.attachments')}
            </label>
            <FileDropzone
              id="report-files"
              files={files}
              onFilesChange={setFiles}
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isBusy}>
            <Send className="size-4" aria-hidden="true" />
            <span>{t('tasks.report.submit')}</span>
          </Button>
        </div>
      </form>
    </section>
  )
}
