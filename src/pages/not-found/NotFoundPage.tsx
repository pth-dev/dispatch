import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { SearchX, ArrowLeft, House } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_ROUTES } from '@/constants/app-routes'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
            ST
          </div>
          <span className="font-semibold text-foreground">{t('app.name')}</span>
        </div>
        <span className="text-xs text-muted-foreground">{t('app.version')}</span>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <SearchX className="size-4" />
            <span>Lỗi 404 • Không tìm thấy</span>
          </div>

          <h1 className="text-3xl font-semibold text-foreground">
            {t('errors.notFoundTitle')}
          </h1>

          <p className="text-sm text-muted-foreground">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild variant="default">
              <Link to={APP_ROUTES.TASKS}>
                <House className="size-4 mr-2" />
                {t('common.home')}
              </Link>
            </Button>

            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © 2026 {t('app.name')} • {t('app.version')}
      </footer>
    </div>
  )
}

export default NotFoundPage
