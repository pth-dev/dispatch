import * as React from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { DirectoryUser } from '@/schemas/auth'
import type { TaskEditorFormValues } from '@/schemas/task'
import { formatUserWithCode } from '../../hooks/use-user-display-resolver'

type ViewerField = 'readers' | 'cross_viewers'

interface TaskViewersSubsectionProps {
  control: Control<TaskEditorFormValues>
  setValue: UseFormSetValue<TaskEditorFormValues>
  directory: DirectoryUser[]
  allowReaders: boolean
  allowCross: boolean
}

function filterUsers(directory: DirectoryUser[], query: string): DirectoryUser[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return directory
  return directory.filter((p) => {
    const name = (p.fullname ?? '').toLowerCase()
    const uname = p.username.toLowerCase()
    const dept = (p.dept ?? '').toLowerCase()
    return name.includes(normalized) || uname.includes(normalized) || dept.includes(normalized)
  })
}

interface UserMultiSelectListProps {
  directory: DirectoryUser[]
  selected: string[]
  searchAriaLabel: string
  onToggle: (username: string) => void
}

function UserMultiSelectList({
  directory,
  selected,
  searchAriaLabel,
  onToggle,
}: UserMultiSelectListProps) {
  const { t } = useTranslation()
  const [query, setQuery] = React.useState('')
  const filtered = filterUsers(directory, query)

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((uname) => (
            <span
              key={uname}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-foreground"
            >
              <span className="truncate max-w-[160px]">
                {formatUserWithCode(uname, undefined, directory)}
              </span>
              <button
                type="button"
                onClick={() => onToggle(uname)}
                className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-destructive cursor-pointer"
                aria-label={t('common.delete')}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('tasks.fields.assigneeSearchPlaceholder')}
          aria-label={searchAriaLabel}
          className="pl-8"
        />
      </div>

      <div className="relative max-h-36 overflow-y-auto rounded-lg border border-border p-2.5 space-y-1.5 text-xs">
        {filtered.length === 0 ? (
          <p className="py-1 text-center text-muted-foreground">
            {t('tasks.fields.noMatchingUsers')}
          </p>
        ) : (
          filtered.map((person) => (
            <label
              key={person.username}
              className="relative flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(person.username)}
                onCheckedChange={() => onToggle(person.username)}
              />
              <span className="truncate">
                {formatUserWithCode(person.username, person.fullname)}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

export function TaskViewersSubsection({
  control,
  setValue,
  directory,
  allowReaders,
  allowCross,
}: TaskViewersSubsectionProps) {
  const { t } = useTranslation()
  const watchCrossDept = useWatch({ control, name: 'cross_dept' })
  const watchReaders = useWatch({ control, name: 'readers' })
  const watchCrossViewers = useWatch({ control, name: 'cross_viewers' })

  const toggleViewer = (field: ViewerField, current: string[], username: string) => {
    const next = current.includes(username)
      ? current.filter((v) => v !== username)
      : [...current, username]
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
      {allowReaders && (
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.readers')} ({watchReaders.length})
          </span>
          <UserMultiSelectList
            directory={directory}
            selected={watchReaders}
            searchAriaLabel={t('tasks.fields.readers')}
            onToggle={(uname) => toggleViewer('readers', watchReaders, uname)}
          />
        </div>
      )}

      {allowCross && (
        <div className="space-y-2">
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
            <UserMultiSelectList
              directory={directory}
              selected={watchCrossViewers}
              searchAriaLabel={t('tasks.fields.crossViewers')}
              onToggle={(uname) => toggleViewer('cross_viewers', watchCrossViewers, uname)}
            />
          )}
        </div>
      )}
    </div>
  )
}
