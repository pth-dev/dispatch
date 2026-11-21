import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Globe, CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Logo } from '@/components/layout/Logo'
import { LoginFormSchema, type LoginFormValues } from '@/schemas/auth'
import { APP_ROUTES } from '@/constants/app-routes'
import { LANGUAGE_OPTIONS } from '@/i18n'
import { useAppStore, type SupportedLocale } from '@/app/store'
import {
  extractLocalizedMessage,
  getRememberToken,
  getStoredSession,
  isApiError,
  loginWithPassword,
  resolveApiErrorMessage,
  resumeSession,
  verifySession,
} from '@/services'

function resolveSafeRedirect(from: unknown): string {
  if (typeof from !== 'string') return APP_ROUTES.TASKS
  if (!from.startsWith('/') || from.startsWith('//')) return APP_ROUTES.TASKS
  if (from === APP_ROUTES.LOGIN || from.startsWith(`${APP_ROUTES.LOGIN}?`)) {
    return APP_ROUTES.TASKS
  }
  return from
}

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAppStore((s) => s.setSession)
  const setLocale = useAppStore((s) => s.setLocale)

  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [checkingExisting, setCheckingExisting] = React.useState(true)

  const redirectTarget = resolveSafeRedirect(
    (location.state as { from?: unknown } | null)?.from,
  )

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      username: '',
      password: '',
      remember: false,
    },
  })

  // Auto-resume if a valid session or remember-me token already exists
  React.useEffect(() => {
    const controller = new AbortController()
    let active = true

    const checkExisting = async () => {
      try {
        let session = getStoredSession()
        if (!session && getRememberToken()) {
          const outcome = await resumeSession()
          if (outcome.status === 'resumed') {
            session = getStoredSession()
          }
        }
        if (session) {
          const user = await verifySession(controller.signal)
          if (!active) return
          setSession(user)
          navigate(redirectTarget, { replace: true })
          return
        }
      } catch {
        // Stay on login page
      }
      if (active) setCheckingExisting(false)
    }

    void checkExisting()
    return () => {
      active = false
      controller.abort()
    }
  }, [navigate, redirectTarget, setSession])

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null)
    try {
      const user = await loginWithPassword(values)
      setSession(user)
      navigate(redirectTarget, { replace: true })
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        const localized = extractLocalizedMessage(err.message, i18n.language)
        setSubmitError(localized || t('login.invalidCredentials'))
      } else {
        setSubmitError(resolveApiErrorMessage(err, t, i18n.language))
      }
    }
  }

  const handleLocaleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as SupportedLocale
    void i18n.changeLanguage(next)
    setLocale(next)
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
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{t('header.changeLanguage')}</span>
            <select
              aria-label={t('header.changeLanguage')}
              value={i18n.language}
              onChange={handleLocaleSelect}
              className="h-11 lg:h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </label>
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
