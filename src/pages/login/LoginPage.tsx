import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Logo } from '@/components/layout/Logo'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import type { LoginFormValues } from '@/schemas/auth'
import { getDefaultLandingRoute } from '@/app/nav-config'
import { queryClient } from '@/app/providers/query-client'
import { useAppStore } from '@/app/store'
import {
  extractLocalizedMessage,
  isApiError,
  loginWithPassword,
  resolveApiErrorMessage,
} from '@/services'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { resolveSafeRedirect, useLoginAutoResume } from './use-login-auto-resume'

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const setSession = useAppStore((s) => s.setSession)
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login')
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [registerSuccess, setRegisterSuccess] = React.useState<string | null>(null)
  const { checkingExisting, rawFrom } = useLoginAutoResume()

  const handleLogin = async (values: LoginFormValues) => {
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

  const handleSwitchMode = (nextMode: 'login' | 'register') => {
    setSubmitError(null)
    if (nextMode === 'register') setRegisterSuccess(null)
    setAuthMode(nextMode)
  }

  const handleRegisterSuccess = (serverMessage?: string) => {
    const localized = serverMessage ? extractLocalizedMessage(serverMessage, i18n.language) : ''
    setRegisterSuccess(localized || t('register.successPending'))
    setAuthMode('login')
  }

  if (checkingExisting) {
    return <LoadingSpinner size="lg" className="min-h-dvh bg-background" />
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Logo size={36} />
          <LanguageSwitcher />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">
            {authMode === 'register' ? t('register.title') : t('login.title')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {authMode === 'register' ? t('register.subtitle') : t('login.subtitle')}
          </p>
        </div>

        {authMode === 'register' ? (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => handleSwitchMode('login')}
          />
        ) : (
          <>
            {registerSuccess && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-success"
              >
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{registerSuccess}</span>
              </div>
            )}

            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-destructive"
              >
                <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            <LoginForm
              onSubmit={handleLogin}
              onSwitchToRegister={() => handleSwitchMode('register')}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default LoginPage
