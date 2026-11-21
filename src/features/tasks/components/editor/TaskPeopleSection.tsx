import * as React from 'react'
import { useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { DirectoryUser } from '@/schemas/auth'
import type { TaskEditorFormValues } from '@/schemas/task'
import { MAX_ASSIGNEES } from '../../api/task-catalog'

type PeopleMultiField = 'assign_person' | 'readers' | 'cross_viewers'

interface TaskPeopleSectionProps {
  control: Control<TaskEditorFormValues>
  setValue: UseFormSetValue<TaskEditorFormValues>
  errors: FieldErrors<TaskEditorFormValues>
  directory: DirectoryUser[]
  allowReaders: boolean
  allowCross: boolean
}

export function TaskPeopleSection({
  control,
  setValue,
  errors,
  directory,
  allowReaders,
  allowCross,
}: TaskPeopleSectionProps) {
  const { t } = useTranslation()
  const [assigneeQuery, setAssigneeQuery] = React.useState('')

  const watchAssignees = useWatch({ control, name: 'assign_person' })
  const watchCrossDept = useWatch({ control, name: 'cross_dept' })
  const watchReaders = useWatch({ control, name: 'readers' })
  const watchCrossViewers = useWatch({ control, name: 'cross_viewers' })

  const toggleMulti = (field: PeopleMultiField, current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
  }

  const normalizedQuery = assigneeQuery.trim().toLowerCase()
  const filteredDirectory = normalizedQuery
    ? directory.filter((p) => {
        const name = (p.fullname ?? '').toLowerCase()
        const uname = p.username.toLowerCase()
        return name.includes(normalizedQuery) || uname.includes(normalizedQuery)
      })
    : directory

  const directoryByUsername = new Map(directory.map((u) => [u.username, u]))

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base font-semibold text-foreground">
          {t('tasks.createForm.peopleSection')}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t('common.assignee')} ({watchAssignees.length}/{MAX_ASSIGNEES})
        </span>
      </div>

      <div className="space-y-2.5">
        {errors.assign_person?.message && (
          <p role="alert" className="text-xs text-destructive">
            {t(errors.assign_person.message)}
          </p>
        )}
        {watchAssignees.length >= 2 && (
          <p className="text-xs text-primary">{t('tasks.fields.autoSplitHint')}</p>
        )}

        {watchAssignees.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {watchAssignees.map((uname) => {
              const person = directoryByUsername.get(uname)
              const label = person?.fullname ? `${person.fullname} (${uname})` : uname
              return (
                <span
                  key={uname}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-foreground"
                >
                  <span className="truncate max-w-[180px]">{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleMulti('assign_person', watchAssignees, uname)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                    aria-label={t('common.delete')}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={assigneeQuery}
            onChange={(e) => setAssigneeQuery(e.target.value)}
            placeholder={t('tasks.fields.assigneeSearchPlaceholder')}
            aria-label={t('tasks.fields.assigneeSearchPlaceholder')}
            className="pl-8"
          />
        </div>

        <div className="relative max-h-48 overflow-y-auto rounded-lg border border-border p-2.5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 text-xs">
          {filteredDirectory.length === 0 ? (
            <p className="col-span-full py-2 text-center text-muted-foreground">
              {t('tasks.fields.noMatchingUsers')}
            </p>
          ) : (
            filteredDirectory.map((person) => (
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
            ))
          )}
        </div>
      </div>

      {(allowReaders || allowCross) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
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
        </div>
      )}
    </section>
  )
}
