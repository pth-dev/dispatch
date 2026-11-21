import * as React from 'react'
import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Paperclip, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FileDropzone } from '@/components/ui/file-dropzone'
import type { PocketValueItem } from '@/schemas/meta'
import type { RawAttachment, TaskEditorFormValues } from '@/schemas/task'
import {
  CUSTOM_TASK_TYPE_VALUE,
  SELECT_FIELD_CLASS,
  STANDARD_TASK_TYPES,
  formatBilingualOption,
  isStandardTaskType,
} from '../../api/task-catalog'

type TaskBasicInfoSectionProps = {
  control: Control<TaskEditorFormValues>
  register: UseFormRegister<TaskEditorFormValues>
  setValue: UseFormSetValue<TaskEditorFormValues>
  errors: FieldErrors<TaskEditorFormValues>
  pocketTypes: PocketValueItem[]
  newFiles: File[]
  retainedFiles: RawAttachment[]
  disabled?: boolean
  compact?: boolean
  onNewFilesChange: (files: File[]) => void
  onRemoveRetainedFile: (path: string) => void
}

export function TaskBasicInfoSection({
  control,
  register,
  setValue,
  errors,
  pocketTypes,
  newFiles,
  retainedFiles,
  disabled = false,
  compact = false,
  onNewFilesChange,
  onRemoveRetainedFile,
}: TaskBasicInfoSectionProps) {
  const { t, i18n } = useTranslation()
  const taskType = useWatch({ control, name: 'task_type' })

  const personalTypes = pocketTypes.filter((item) => !isStandardTaskType(item.value))
  const knownPersonalValues = new Set(personalTypes.map((p) => p.value))
  const isKnownType =
    !taskType || isStandardTaskType(taskType) || knownPersonalValues.has(taskType)

  const [forceCustom, setForceCustom] = React.useState(false)
  const isCustomActive = forceCustom || !isKnownType
  const selectValue = isCustomActive ? CUSTOM_TASK_TYPE_VALUE : taskType

  const handleTaskTypeSelect = (next: string) => {
    if (next === CUSTOM_TASK_TYPE_VALUE) {
      setForceCustom(true)
      if (isStandardTaskType(taskType) || knownPersonalValues.has(taskType)) {
        setValue('task_type', '', { shouldDirty: true, shouldValidate: false })
      }
      return
    }
    setForceCustom(false)
    setValue('task_type', next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        {t('tasks.createForm.infoSection')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label htmlFor="task-title" className="block text-xs font-semibold text-foreground">
            {t('tasks.createForm.taskName')} *
          </label>
          <Input
            id="task-title"
            aria-invalid={Boolean(errors.title)}
            placeholder={t('tasks.createForm.taskNamePlaceholder')}
            {...register('title')}
          />
          {errors.title?.message && (
            <p className="text-xs text-destructive">{t(errors.title.message)}</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="task-type-select" className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.taskType')} *
          </label>
          <select
            id="task-type-select"
            aria-invalid={Boolean(errors.task_type)}
            value={selectValue}
            onChange={(e) => handleTaskTypeSelect(e.target.value)}
            className={SELECT_FIELD_CLASS}
          >
            <option value="">{t('tasks.fields.taskTypeSelectPlaceholder')}</option>
            <optgroup label={t('tasks.fields.taskTypeStandardGroup')}>
              {STANDARD_TASK_TYPES.map((item) => (
                <option key={item} value={item}>
                  {formatBilingualOption(item, i18n.language)}
                </option>
              ))}
            </optgroup>
            {personalTypes.length > 0 && (
              <optgroup label={t('tasks.fields.taskTypePersonalGroup')}>
                {personalTypes.map((item) => (
                  <option key={item.id} value={item.value}>
                    {item.value}
                  </option>
                ))}
              </optgroup>
            )}
            <option value={CUSTOM_TASK_TYPE_VALUE}>{t('tasks.fields.taskTypeCustomOption')}</option>
          </select>

          {isCustomActive && (
            <Input
              id="task-type-custom"
              aria-label={t('tasks.fields.taskTypeCustomPlaceholder')}
              aria-invalid={Boolean(errors.task_type)}
              placeholder={t('tasks.fields.taskTypeCustomPlaceholder')}
              {...register('task_type')}
            />
          )}
          {errors.task_type?.message && (
            <p className="text-xs text-destructive">{t(errors.task_type.message)}</p>
          )}
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

        {!compact && (
          <>
            <div className="space-y-1.5">
              <label htmlFor="task-kmlink" className="block text-xs font-semibold text-foreground">
                {t('tasks.report.kmLink')}
              </label>
              <Input id="task-kmlink" placeholder="https://..." {...register('km_link')} />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="task-files" className="block text-xs font-semibold text-foreground">
                {t('tasks.detail.attachments')}
              </label>
              <FileDropzone
                id="task-files"
                files={newFiles}
                onFilesChange={onNewFilesChange}
                disabled={disabled}
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
                        onClick={() => onRemoveRetainedFile(att.path)}
                        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive cursor-pointer"
                        aria-label={t('common.delete')}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
