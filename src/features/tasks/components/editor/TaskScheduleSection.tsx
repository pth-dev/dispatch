import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import type { DeptItem } from '@/schemas/meta'
import type { ConfidentialLevel, TaskEditorFormValues } from '@/schemas/task'
import { cn } from '@/utils/cn'
import { getDeptDisplayName } from '../../api/meta'
import {
  LEVEL_OPTIONS,
  RISK_OPTIONS,
  SELECT_FIELD_CLASS,
  formatBilingualOption,
} from '../../api/task-catalog'

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

  const toggleRecurDay = (
    field: 'recur_weekdays' | 'recur_monthdays',
    current: number[],
    day: number,
  ) => {
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b)
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-3.5">
      <h2 className="text-base font-semibold text-foreground">
        {t('tasks.createForm.metaSection')}
      </h2>

      <div className="space-y-1.5">
        <label htmlFor="task-assigned-unit" className="block text-xs font-semibold text-foreground">
          {t('common.department')} *
        </label>
        <select
          id="task-assigned-unit"
          aria-invalid={Boolean(errors.assigned_unit)}
          {...register('assigned_unit')}
          className={SELECT_FIELD_CLASS}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
        <div className="space-y-1.5">
          <label htmlFor="task-level" className="block text-xs font-semibold text-foreground">
            {t('tasks.createForm.priority')}
          </label>
          <select id="task-level" {...register('level')} className={SELECT_FIELD_CLASS}>
            {LEVEL_OPTIONS.map((lv) => (
              <option key={lv} value={lv}>
                {formatBilingualOption(lv, i18n.language)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-risk" className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.riskStatus')}
          </label>
          <select id="task-risk" {...register('risk_status')} className={SELECT_FIELD_CLASS}>
            {RISK_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {formatBilingualOption(r, i18n.language)}
              </option>
            ))}
          </select>
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
            className={SELECT_FIELD_CLASS}
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
          <select id="task-recur-type" {...register('recur_type')} className={SELECT_FIELD_CLASS}>
            <option value="once">{t('tasks.fields.recurOnce')}</option>
            <option value="weekly">{t('tasks.fields.recurWeekly')}</option>
            <option value="monthly">{t('tasks.fields.recurMonthly')}</option>
          </select>
        </div>
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
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="task-recur-time" className="block text-xs font-semibold text-foreground">
              {t('tasks.fields.recurTime')}
            </label>
            <Input id="task-recur-time" type="time" {...register('recur_time')} />
          </div>

          {recurType === 'weekly' && (
            <div className="space-y-1.5">
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
                      className={cn(
                        'min-h-10 sm:min-h-8 min-w-10 rounded-md border px-2.5 text-xs font-medium cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-secondary',
                      )}
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
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-foreground">
                {t('tasks.fields.recurMonthdays')} *
              </span>
              <div className="grid grid-cols-7 gap-1" role="group" aria-label={t('tasks.fields.recurMonthdays')}>
                {MONTHDAYS.map((day) => {
                  const selected = recurMonthdays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleRecurDay('recur_monthdays', recurMonthdays, day)}
                      className={cn(
                        'min-h-10 sm:min-h-8 rounded-md border text-xs font-medium cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-secondary',
                      )}
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

          <div className="space-y-1.5">
            <label htmlFor="task-recur-end" className="block text-xs font-semibold text-foreground">
              {t('tasks.fields.recurEnd')}
            </label>
            <Input id="task-recur-end" type="date" {...register('recur_end')} />
          </div>
        </div>
      )}
    </section>
  )
}
