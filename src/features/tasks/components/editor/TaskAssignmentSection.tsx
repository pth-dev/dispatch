import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Paperclip, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { DirectoryUser } from '@/schemas/auth'
import type { DeptItem, SiteItem } from '@/schemas/meta'
import type { RawAttachment, TaskEditorFormValues } from '@/schemas/task'
import { getDeptDisplayName, getSiteDisplayName } from '../../api/meta'

type MultiField = 'req_depts' | 'site' | 'assign_person' | 'readers' | 'cross_viewers'

interface TaskAssignmentSectionProps {
  control: Control<TaskEditorFormValues>
  register: UseFormRegister<TaskEditorFormValues>
  setValue: UseFormSetValue<TaskEditorFormValues>
  errors: FieldErrors<TaskEditorFormValues>
  depts: DeptItem[]
  sites: SiteItem[]
  directory: DirectoryUser[]
  allowReaders: boolean
  allowCross: boolean
  retainedFiles: RawAttachment[]
  onNewFilesChange: (files: File[]) => void
  onRemoveRetainedFile: (path: string) => void
}

export function TaskAssignmentSection({
  control,
  register,
  setValue,
  errors,
  depts,
  sites,
  directory,
  allowReaders,
  allowCross,
  retainedFiles,
  onNewFilesChange,
  onRemoveRetainedFile,
}: TaskAssignmentSectionProps) {
  const { t, i18n } = useTranslation()

  const watchReqDepts = useWatch({ control, name: 'req_depts' })
  const watchSites = useWatch({ control, name: 'site' })
  const watchAssignees = useWatch({ control, name: 'assign_person' })
  const watchCrossDept = useWatch({ control, name: 'cross_dept' })
  const watchReaders = useWatch({ control, name: 'readers' })
  const watchCrossViewers = useWatch({ control, name: 'cross_viewers' })

  const toggleMulti = (field: MultiField, current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-foreground">
          {t('tasks.fields.reqDepts')} *
        </span>
        <div className="relative max-h-36 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
          {depts.map((dept) => (
            <label key={dept.value} className="relative flex items-center gap-2 cursor-pointer">
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

      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-foreground">
          {t('tasks.fields.site')} *
        </span>
        <div className="relative max-h-36 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
          {sites.map((site) => (
            <label key={site.value} className="relative flex items-center gap-2 cursor-pointer">
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

      <div className="md:col-span-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {t('common.assignee')} ({watchAssignees.length}/20)
          </span>
          {watchAssignees.length >= 2 && (
            <span className="text-primary">{t('tasks.fields.autoSplitHint')}</span>
          )}
        </div>
        <div className="relative max-h-40 overflow-y-auto rounded-lg border border-border p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
          {directory.map((person) => (
            <label key={person.username} className="relative flex items-center gap-2 cursor-pointer">
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

      {allowReaders && (
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.readers')} ({watchReaders.length})
          </span>
          <div className="relative max-h-32 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
            {directory.map((person) => (
              <label key={person.username} className="relative flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={watchReaders.includes(person.username)}
                  onCheckedChange={() => toggleMulti('readers', watchReaders, person.username)}
                />
                <span className="truncate">{person.fullname || person.username}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {allowCross && (
        <div className="space-y-1.5">
          <label className="relative flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
            <Checkbox
              checked={watchCrossDept}
              onCheckedChange={(checked) =>
                setValue('cross_dept', checked === true, { shouldDirty: true })
              }
            />
            <span>{t('tasks.fields.crossDept')}</span>
          </label>
          {watchCrossDept && (
            <div className="relative max-h-32 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
              {directory.map((person) => (
                <label key={person.username} className="relative flex items-center gap-2 cursor-pointer">
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
          onChange={(e) => onNewFilesChange(Array.from(e.target.files ?? []))}
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
                  onClick={() => onRemoveRetainedFile(att.path)}
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
  )
}
