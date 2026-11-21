import { useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { DirectoryUser } from '@/schemas/auth'
import type { DeptItem, SiteItem } from '@/schemas/meta'
import type { TaskEditorFormValues } from '@/schemas/task'
import { getDeptDisplayName, getSiteDisplayName } from '../../api/meta'

interface TaskRequesterSectionProps {
  control: Control<TaskEditorFormValues>
  register: UseFormRegister<TaskEditorFormValues>
  setValue: UseFormSetValue<TaskEditorFormValues>
  errors: FieldErrors<TaskEditorFormValues>
  depts: DeptItem[]
  sites: SiteItem[]
  directory: DirectoryUser[]
}

export function TaskRequesterSection({
  control,
  register,
  setValue,
  errors,
  depts,
  sites,
  directory,
}: TaskRequesterSectionProps) {
  const { t, i18n } = useTranslation()

  const watchReqDepts = useWatch({ control, name: 'req_depts' })
  const watchSites = useWatch({ control, name: 'site' })

  const toggleMulti = (field: 'req_depts' | 'site', current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setValue(field, next, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        {t('tasks.createForm.requesterSection')}
      </h2>

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
        <div className="relative max-h-36 overflow-y-auto rounded-lg border border-border p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
          {sites.map((site) => (
            <label key={site.value} className="relative flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={watchSites.includes(site.value)}
                onCheckedChange={() => toggleMulti('site', watchSites, site.value)}
              />
              <span className="truncate">{getSiteDisplayName(site, i18n.language)}</span>
            </label>
          ))}
        </div>
        {errors.site?.message && (
          <p className="text-xs text-destructive">{t(errors.site.message)}</p>
        )}
      </div>
    </section>
  )
}
