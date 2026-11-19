import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function LoginPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-6 shadow-none">
        <div className="flex items-center gap-3 justify-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
            ST
          </div>
          <h1 className="text-xl font-semibold text-foreground">{t('app.name')}</h1>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">{t('login.account')}</label>
            <input
              type="text"
              defaultValue="nguyenan"
              className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">{t('login.password')}</label>
            <input
              type="password"
              defaultValue="password"
              className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button className="w-full h-10" variant="default">
            {t('login.submit')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
