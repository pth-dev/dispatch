import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { SITE_OTHER_VALUE, type RegisterFormValues } from '@/schemas/auth'
import type { DeptItem, SiteItem } from '@/schemas/meta'
import { REGISTER_SELECT_CLASS, formatRegisterOptionLabel } from './register-catalog'

interface RegisterOrgFieldsProps {
  depts: readonly DeptItem[]
  sites: readonly SiteItem[]
  selectedSite: string
  register: UseFormRegister<RegisterFormValues>
  errors: FieldErrors<RegisterFormValues>
}

export function RegisterOrgFields({
  depts,
  sites,
  selectedSite,
  register,
  errors,
}: RegisterOrgFieldsProps) {
  const { t, i18n } = useTranslation()

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="reg-dept" className="block text-xs font-semibold text-foreground">
            {t('register.department')}
          </label>
          <select
            id="reg-dept"
            className={REGISTER_SELECT_CLASS}
            aria-invalid={Boolean(errors.dept)}
            aria-describedby={errors.dept?.message ? 'reg-dept-error' : undefined}
            {...register('dept')}
          >
            {depts.map((d) => (
              <option key={d.value} value={d.value}>
                {formatRegisterOptionLabel(d, i18n.language)}
              </option>
            ))}
          </select>
          {errors.dept?.message && (
            <p id="reg-dept-error" className="text-xs text-destructive">
              {t(errors.dept.message)}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-site" className="block text-xs font-semibold text-foreground">
            {t('register.site')}
          </label>
          <select
            id="reg-site"
            className={REGISTER_SELECT_CLASS}
            aria-invalid={Boolean(errors.site)}
            aria-describedby={errors.site?.message ? 'reg-site-error' : undefined}
            {...register('site')}
          >
            {sites.map((s) => (
              <option key={s.value} value={s.value}>
                {formatRegisterOptionLabel(s, i18n.language, true)}
              </option>
            ))}
            <option value={SITE_OTHER_VALUE}>{t('register.siteOtherOption')}</option>
          </select>
          {errors.site?.message && (
            <p id="reg-site-error" className="text-xs text-destructive">
              {t(errors.site.message)}
            </p>
          )}
        </div>
      </div>

      {selectedSite === SITE_OTHER_VALUE && (
        <div className="space-y-1.5">
          <label htmlFor="reg-site-other" className="block text-xs font-semibold text-foreground">
            {t('register.siteOtherLabel')}
          </label>
          <Input
            id="reg-site-other"
            type="text"
            maxLength={40}
            placeholder={t('register.siteOtherPlaceholder')}
            aria-invalid={Boolean(errors.siteOther)}
            aria-describedby={
              errors.siteOther?.message ? 'reg-site-other-error' : 'reg-site-other-hint'
            }
            {...register('siteOther')}
          />
          <p id="reg-site-other-hint" className="text-xs text-muted-foreground">
            {t('register.siteOtherHint')}
          </p>
          {errors.siteOther?.message && (
            <p id="reg-site-other-error" className="text-xs text-destructive">
              {t(errors.siteOther.message)}
            </p>
          )}
        </div>
      )}
    </>
  )
}
