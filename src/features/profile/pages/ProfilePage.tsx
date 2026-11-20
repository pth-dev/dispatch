import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/app/store'
import { APP_ROUTES } from '@/constants/app-routes'
import { logoutSession } from '@/services'
import { PasswordChangeCard } from '../components/PasswordChangeCard'

export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)
  const clearSession = useAppStore((s) => s.clearSession)
  const [loggingOutAll, setLoggingOutAll] = React.useState(false)

  if (!user) return null

  const handleLogoutAll = async () => {
    setLoggingOutAll(true)
    await logoutSession(true)
    clearSession()
    navigate(APP_ROUTES.LOGIN, { replace: true })
  }

  const handlePasswordChanged = () => {
    window.setTimeout(() => {
      void logoutSession(true).then(() => {
        clearSession()
        navigate(APP_ROUTES.LOGIN, { replace: true })
      })
    }, 1200)
  }

  const infoRows: ReadonlyArray<{ label: string; value: string }> = [
    { label: t('profile.fullname'), value: user.fullname || '-' },
    { label: t('profile.username'), value: user.username },
    { label: t('profile.department'), value: user.dept || '-' },
    { label: t('profile.site'), value: user.site || '-' },
    { label: t('profile.role'), value: t(`role.${user.role}`) },
    {
      label: t('profile.authSource'),
      value: user.auth_source === 'ad' ? t('profile.authAd') : t('profile.authLocal'),
    },
    ...(user.email ? [{ label: t('profile.email'), value: user.email }] : []),
    ...(user.title ? [{ label: t('profile.jobTitle'), value: user.title }] : []),
  ]

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">{t('nav.profile')}</h1>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground">{t('profile.accountInfo')}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {infoRows.map((row) => (
            <div key={row.label} className="space-y-0.5">
              <dt className="text-xs font-semibold text-muted-foreground">{row.label}</dt>
              <dd className="text-sm text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <PasswordChangeCard user={user} onPasswordChanged={handlePasswordChanged} />

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-semibold text-foreground">{t('profile.sessionsTitle')}</h2>
        <p className="text-xs text-muted-foreground">{t('profile.sessionsDescription')}</p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loggingOutAll}>
              <LogOut className="size-4" aria-hidden="true" />
              <span>{t('profile.logoutAll')}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('profile.logoutAllConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('profile.logoutAllConfirmDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleLogoutAll()}>
                {t('common.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}

export default ProfilePage
