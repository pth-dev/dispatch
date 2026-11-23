import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Logo } from '@/components/layout/Logo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { LoginFormSchema, type LoginFormValues } from '@/schemas/auth'
import { getDefaultLandingRoute } from '@/app/nav-config'
import { queryClient } from '@/app/providers/query-client'
import { useAppStore } from '@/app/store'
import {
  extractLocalizedMessage,
  isApiError,
  loginWithPassword,
  resolveApiErrorMessage,
} from '@/services'
import { resolveSafeRedirect, useLoginAutoResume } from './use-login-auto-resume'

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setSession = useAppStore((s) => s.setSession)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const { checkingExisting, rawFrom } = useLoginAutoResume()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { username: '', password: '', remember: false },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null)
    try {
      const user = await loginWithPassword(values)
      queryClient.clear()
      setSession(user)
      navigate(resolveSafeRedirect(rawFrom, getDefaultLandingRoute(user)), { replace: true })
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        const localized = extractLocalizedMessage(err.message, i18n.language)
        setSubmitError(localized || t('login.invalidCredentials'))
      } else {
        setSubmitError(resolveApiErrorMessage(err, t, i18n.language))
      }
    }
  }

  if (checkingExisting) {
    return (
      <div
        role="status"
        className="flex min-h-dvh items-center justify-center bg-background text-xs text-muted-foreground"
      >
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Logo size={36} />
          <LanguageSwitcher />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">{t('login.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('login.subtitle')}</p>
        </div>

        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-destructive"
          >
            <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="block text-xs font-semibold text-foreground">
              {t('login.account')}
            </label>
            <Input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder={t('login.accountPlaceholder')}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username?.message ? 'login-username-error' : undefined}
              {...register('username')}
            />
            {errors.username?.message && (
              <p id="login-username-error" className="text-xs text-destructive">
                {t(errors.username.message)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-foreground">
              {t('login.password')}
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password?.message ? 'login-password-error' : undefined}
              {...register('password')}
            />
            {errors.password?.message && (
              <p id="login-password-error" className="text-xs text-destructive">
                {t(errors.password.message)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="remember"
              render={({ field }) => (
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <label
              htmlFor="login-remember"
              className="text-xs text-foreground cursor-pointer select-none"
            >
              {t('login.rememberMe')}
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
