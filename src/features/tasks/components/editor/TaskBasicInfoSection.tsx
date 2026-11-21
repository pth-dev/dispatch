import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { DirectoryUser } from '@/schemas/auth'
import type { PocketValueItem } from '@/schemas/meta'
import type { TaskEditorFormValues } from '@/schemas/task'

const LEVEL_OPTIONS = [
  '一般件 (指定時間內完成) / Bình thường',
  '緊急件 (優先處理) / Khẩn cấp',
  '最速件 (立即處理) / Hỏa tốc',
]

const RISK_OPTIONS = ['無 / Không', '低 / Thấp', '中 / Trung bình', '高 / Cao']

interface TaskBasicInfoSectionProps {
  register: UseFormRegister<TaskEditorFormValues>
  errors: FieldErrors<TaskEditorFormValues>
  pocketTypes: PocketValueItem[]
  directory: DirectoryUser[]
}

export function TaskBasicInfoSection({
  register,
  errors,
  pocketTypes,
  directory,
}: TaskBasicInfoSectionProps) {
  const { t } = useTranslation()

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

        <div className="space-y-1.5">
          <label htmlFor="task-type" className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.taskType')} *
          </label>
          <Input
            id="task-type"
            list="pocket-task-types"
            aria-invalid={Boolean(errors.task_type)}
            placeholder={t('tasks.fields.taskTypePlaceholder')}
            {...register('task_type')}
          />
          <datalist id="pocket-task-types">
            {pocketTypes.map((item) => (
              <option key={item.id} value={item.value} />
            ))}
          </datalist>
          {errors.task_type?.message && (
            <p className="text-xs text-destructive">{t(errors.task_type.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-contact" className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.reqContact')} *
          </label>
          <Input
            id="task-contact"
            list="directory-users"
            aria-invalid={Boolean(errors.req_contact)}
            {...register('req_contact')}
          />
          <datalist id="directory-users">
            {directory.map((u) => (
              <option key={u.username} value={u.username}>
                {u.fullname ? `${u.username} - ${u.fullname}` : u.username}
              </option>
            ))}
          </datalist>
          {errors.req_contact?.message && (
            <p className="text-xs text-destructive">{t(errors.req_contact.message)}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-level" className="block text-xs font-semibold text-foreground">
            {t('tasks.createForm.priority')}
          </label>
          <select
            id="task-level"
            {...register('level')}
            className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            {LEVEL_OPTIONS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-risk" className="block text-xs font-semibold text-foreground">
            {t('tasks.fields.riskStatus')}
          </label>
          <select
            id="task-risk"
            {...register('risk_status')}
            className="w-full h-11 lg:h-10 rounded-md border border-border bg-card px-3 text-xs text-foreground outline-none focus:border-primary"
          >
            {RISK_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
      </div>
    </section>
  )
}
