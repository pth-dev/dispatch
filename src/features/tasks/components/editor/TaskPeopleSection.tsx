import * as React from 'react'
import { useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { DirectoryUser } from '@/schemas/auth'
import type { TaskEditorFormValues } from '@/schemas/task'
import { sameDept } from '@/utils/task-domain'
import { MAX_ASSIGNEES } from '../../api/task-catalog'
import { formatUserWithCode } from '../../hooks/use-user-display-resolver'
import { TaskViewersSubsection } from './TaskViewersSubsection'

interface TaskPeopleSectionProps {
  control: Control<TaskEditorFormValues>
  setValue: UseFormSetValue<TaskEditorFormValues>
  errors: FieldErrors<TaskEditorFormValues>
  directory: DirectoryUser[]
  allowReaders: boolean
  allowCross: boolean
  hideViewers?: boolean
}

export function TaskPeopleSection({
  control,
  setValue,
  errors,
  directory,
  allowReaders,
  allowCross,
  hideViewers = false,
}: TaskPeopleSectionProps) {
  const { t } = useTranslation()
  const [assigneeQuery, setAssigneeQuery] = React.useState('')
  const [filterByDept, setFilterByDept] = React.useState(false)

  const watchAssignees = useWatch({ control, name: 'assign_person' })
  const watchAssignedUnit = useWatch({ control, name: 'assigned_unit' })

  const toggleAssignee = (username: string) => {
    const next = watchAssignees.includes(username)
      ? watchAssignees.filter((v) => v !== username)
      : [...watchAssignees, username]
    setValue('assign_person', next, { shouldDirty: true, shouldValidate: true })
  }

  const normalizedQuery = assigneeQuery.trim().toLowerCase()
  const filteredDirectory = directory
    .filter((p) => {
      if (filterByDept && watchAssignedUnit && !sameDept(p.dept, watchAssignedUnit)) {
        return false
      }
      if (!normalizedQuery) return true
      const name = (p.fullname ?? '').toLowerCase()
      const uname = p.username.toLowerCase()
      const dept = (p.dept ?? '').toLowerCase()
      return (
        name.includes(normalizedQuery) ||
        uname.includes(normalizedQuery) ||
        dept.includes(normalizedQuery)
      )
    })
    .sort((a, b) => {
      if (!watchAssignedUnit) return 0
      const aMatch = sameDept(a.dept, watchAssignedUnit) ? 0 : 1
      const bMatch = sameDept(b.dept, watchAssignedUnit) ? 0 : 1
      return aMatch - bMatch
    })

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
              const label = formatUserWithCode(uname, undefined, directory)
              return (
                <span
                  key={uname}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-foreground"
                >
                  <span className="truncate max-w-[180px]">{label}</span>
                  <button
                    type="button"
                    onClick={() => toggleAssignee(uname)}
                    className="inline-flex size-7 lg:size-6 items-center justify-center rounded-full text-muted-foreground hover:text-destructive cursor-pointer"
                    aria-label={`${t('common.delete')} ${label}`}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1">
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

          {watchAssignedUnit && (
            <label className="relative flex items-center gap-2 text-xs text-muted-foreground cursor-pointer shrink-0">
              <Checkbox
                checked={filterByDept}
                onCheckedChange={(checked) => setFilterByDept(checked === true)}
              />
              <span>{t('tasks.fields.filterByAssignedDept')}</span>
            </label>
          )}
        </div>

        <div className="relative max-h-48 overflow-y-auto rounded-lg border border-border p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
          {filteredDirectory.length === 0 ? (
            <p className="col-span-full py-2 text-center text-muted-foreground">
              {t('tasks.fields.noMatchingUsers')}
            </p>
          ) : (
            filteredDirectory.map((person) => (
              <label
                key={person.username}
                className="relative flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={watchAssignees.includes(person.username)}
                  onCheckedChange={() => toggleAssignee(person.username)}
                />
                <span className="truncate">
                  {formatUserWithCode(person.username, person.fullname)}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      {!hideViewers && (allowReaders || allowCross) && (
        <TaskViewersSubsection
          control={control}
          setValue={setValue}
          directory={directory}
          allowReaders={allowReaders}
          allowCross={allowCross}
        />
      )}
    </section>
  )
}
