import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RegisterFormSchema, type RegisterFormValues } from '@/schemas/auth'
import { registerAccount, resolveApiErrorMessage } from '@/services'
import { RegisterOrgFields } from './RegisterOrgFields'
import { useRegisterCatalog } from './use-register-catalog'

interface RegisterFormProps {
  onSuccess: (message?: string) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { t, i18n } = useTranslation()
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const { depts, sites } = useRegisterCatalog()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      username: '',
      password: '',
      fullname: '',
      dept: depts[0]?.value ?? '資訊部',
      site: sites[0]?.value ?? 'YS',
      siteOther: '',
    },
  })

  const selectedSite = useWatch({ control, name: 'site' })

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null)
    try {
      const message = await registerAccount(values)
      onSuccess(message)
    } catch (err) {
      setSubmitError(resolveApiErrorMessage(err, t, i18n.language))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="reg-username" className="block text-xs font-semibold text-foreground">
          {t('register.account')}
        </label>
        <Input
          id="reg-username"
          type="text"
          autoComplete="username"
          placeholder={t('register.accountPlaceholder')}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username?.message ? 'reg-username-error' : undefined}
          {...register('username')}
        />
        {errors.username?.message && (
          <p id="reg-username-error" className="text-xs text-destructive">
            {t(errors.username.message)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-password" className="block text-xs font-semibold text-foreground">
          {t('register.password')}
        </label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder={t('register.passwordPlaceholder')}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password?.message ? 'reg-password-error' : undefined}
          {...register('password')}
        />
        {errors.password?.message && (
          <p id="reg-password-error" className="text-xs text-destructive">
            {t(errors.password.message)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="reg-fullname" className="block text-xs font-semibold text-foreground">
          {t('register.fullname')}
        </label>
        <Input
          id="reg-fullname"
          type="text"
          autoComplete="name"
          placeholder={t('register.fullnamePlaceholder')}
          aria-invalid={Boolean(errors.fullname)}
          aria-describedby={errors.fullname?.message ? 'reg-fullname-error' : undefined}
          {...register('fullname')}
        />
        {errors.fullname?.message && (
          <p id="reg-fullname-error" className="text-xs text-destructive">
            {t(errors.fullname.message)}
          </p>
        )}
      </div>

      <RegisterOrgFields
        depts={depts}
        sites={sites}
        selectedSite={selectedSite}
        register={register}
        errors={errors}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('register.submitting') : t('register.submit')}
      </Button>

      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="min-h-11 lg:min-h-8 rounded px-2 text-xs font-medium text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('register.backToLogin')}
        </button>
      </div>
    </form>
  )
}
