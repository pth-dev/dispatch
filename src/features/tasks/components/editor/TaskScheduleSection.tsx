import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import type { DeptItem } from '@/schemas/meta'
import type { ConfidentialLevel, TaskEditorFormValues } from '@/schemas/task'
import { getDeptDisplayName } from '../../api/meta'

const SECRECY_ORDER: ConfidentialLevel[] = [0, 1, 3, 2]
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
const MONTHDAYS = Array.from({ length: 31 }, (_, i) => i + 1)

interface TaskScheduleSectionProps {
  control: Control<TaskEditorFormValues>
  register: UseFormRegister<TaskEditorFormValues>
  setValue: UseFormSetValue<TaskEditorFormValues>
  errors: FieldErrors<TaskEditorFormValues>
  depts: DeptItem[]
}

export function TaskScheduleSection({
  control,
  register,
  setValue,
  errors,
  depts,
}: TaskScheduleSectionProps) {
  const { t, i18n } = useTranslation()

  const recurType = useWatch({ control, name: 'recur_type' })
  const recurWeekdays = useWatch({ control, name: 'recur_weekdays' })
  const recurMonthdays = useWatch({ control, name: 'recur_monthdays' })
  const confidential = useWatch({ control, name: 'confidential' })

  const toggleRecurDay = (field: 'recur_weekdays' | 'recur_monthdays', current: number[], day: number) => {
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b)
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label htmlFor="task-assigned-unit" className="block text-xs font-semibold text-foreground">
          {t('common.department')} *
        </label>
        <select
          id="task-assigned-unit"
          aria-invalid={Boolean(errors.assigned_unit)}
          {...register('assigned_unit')}
          className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
        >
          <option value="">{t('tasks.createForm.departmentPlaceholder')}</option>
          {depts.map((dept) => (
            <option key={dept.value} value={dept.value}>
              {getDeptDisplayName(dept, i18n.language)}
            </option>
          ))}
        </select>
        {errors.assigned_unit?.message && (
          <p className="text-xs text-destructive">{t(errors.assigned_unit.message)}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-confidential" className="block text-xs font-semibold text-foreground">
          {t('tasks.confidential.label')}
        </label>
        <select
          id="task-confidential"
          value={confidential}
          onChange={(e) =>
            setValue('confidential', Number(e.target.value) as ConfidentialLevel, {
              shouldDirty: true,
            })
          }
          className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
        >
          {SECRECY_ORDER.map((lv) => (
            <option key={lv} value={lv}>
              {t(`tasks.confidential.lv${lv}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-recur-type" className="block text-xs font-semibold text-foreground">
          {t('tasks.fields.recurType')}
        </label>
        <select
          id="task-recur-type"
          {...register('recur_type')}
          className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
        >
          <option value="once">{t('tasks.fields.recurOnce')}</option>
          <option value="weekly">{t('tasks.fields.recurWeekly')}</option>
          <option value="monthly">{t('tasks.fields.recurMonthly')}</option>
        </select>
      </div>

      {recurType === 'once' ? (
        <div className="space-y-1.5">
          <label htmlFor="task-due-date" className="block text-xs font-semibold text-foreground">
            {t('common.dueDate')} *
          </label>
          <Input
            id="task-due-date"
            type="datetime-local"
            aria-invalid={Boolean(errors.due_date)}
            {...register('due_date')}
          />
          {errors.due_date?.message && (
            <p className="text-xs text-destructive">{t(errors.due_date.message)}</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="task-recur-time" className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.recurTime')}
          </label>
          <Input id="task-recur-time" type="time" {...register('recur_time')} />
        </div>
      )}

      {recurType === 'weekly' && (
        <div className="md:col-span-2 space-y-1.5">
          <span className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.recurWeekdays')} *
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('tasks.fields.recurWeekdays')}>
            {WEEKDAYS.map((day) => {
              const selected = recurWeekdays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleRecurDay('recur_weekdays', recurWeekdays, day)}
                  className={
                    selected
                      ? 'h-9 min-w-11 rounded-md border border-primary bg-primary px-3 text-xs font-medium text-primary-foreground cursor-pointer'
                      : 'h-9 min-w-11 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-secondary cursor-pointer'
                  }
                >
                  {t(`tasks.weekdays.d${day}`)}
                </button>
              )
            })}
          </div>
          {errors.recur_weekdays?.message && (
            <p className="text-xs text-destructive">{t(errors.recur_weekdays.message)}</p>
          )}
        </div>
      )}

      {recurType === 'monthly' && (
        <div className="md:col-span-2 space-y-1.5">
          <span className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.recurMonthdays')} *
          </span>
          <div className="grid grid-cols-7 sm:grid-cols-11 gap-1.5" role="group" aria-label={t('tasks.fields.recurMonthdays')}>
            {MONTHDAYS.map((day) => {
              const selected = recurMonthdays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleRecurDay('recur_monthdays', recurMonthdays, day)}
                  className={
                    selected
                      ? 'h-8 rounded-md border border-primary bg-primary text-xs font-medium text-primary-foreground cursor-pointer'
                      : 'h-8 rounded-md border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary cursor-pointer'
                  }
                >
                  {day}
                </button>
              )
            })}
          </div>
          {errors.recur_monthdays?.message && (
            <p className="text-xs text-destructive">{t(errors.recur_monthdays.message)}</p>
          )}
        </div>
      )}

      {recurType !== 'once' && (
        <div className="space-y-1.5">
          <label htmlFor="task-recur-end" className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.recurEnd')}
          </label>
          <Input id="task-recur-end" type="date" {...register('recur_end')} />
        </div>
      )}
    </div>
  )
}
