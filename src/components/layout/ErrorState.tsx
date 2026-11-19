import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useRouteError } from 'react-router'
import {
  House,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { APP_ROUTES } from '@/constants/app-routes'
import {
  ERROR_TONE_CLASS,
  getErrorStatusMeta,
  getReferenceCode,
  toErrorStatus,
  type ErrorStatusCode,
} from './error-status'

export type { ErrorStatusCode }

const SUGGESTED_LINKS = [
  { labelKey: 'nav.tasks', href: APP_ROUTES.TASKS },
  { labelKey: 'nav.dashboard', href: APP_ROUTES.DASHBOARD },
  { labelKey: 'nav.lessons', href: APP_ROUTES.LESSONS },
  { labelKey: 'nav.todo', href: APP_ROUTES.TODO },
]

interface ErrorStateProps {
  status?: ErrorStatusCode
  technicalDetails?: string
  referenceCode?: string
  onRetry?: () => void
}

/**
 * Full-page error state (brief §5.12). Rendered outside the app shell through
 * the root route `errorElement`, the catch-all route, and permission guards.
 */
export function ErrorState({
  status = '500',
  technicalDetails,
  referenceCode,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation()
  const config = getErrorStatusMeta(status)
  const Icon = config.icon
  const [copied, setCopied] = React.useState(false)

  const activeRefCode = referenceCode || getReferenceCode()
  const caption = t(`errors.status.${status}.caption`)
  const title = t(`errors.status.${status}.title`)
  const description = t(`errors.status.${status}.description`)

  const handleCopy = () => {
    navigator.clipboard.writeText(activeRefCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background select-none">
      {/* Top Header 64px */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 lg:px-12">
        <Link to="/" className="flex items-center">
          <Logo size={36} />
        </Link>
        <a
          href="mailto:support@dieuphoi.vn"
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t('errors.support')}
        </a>
      </header>

      {/* Main Error Content Column (max 560px) */}
      <main className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[560px] space-y-6 text-left">
          {/* Caption row */}
          <div
            className={`flex items-center gap-2 text-xs font-semibold tracking-wider uppercase ${ERROR_TONE_CLASS[config.tone]}`}
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{caption}</span>
          </div>

          {/* H1 Title */}
          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight leading-tight">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {status === '401' ? (
              <Button asChild variant="default" className="min-h-[44px]">
                <Link to={APP_ROUTES.LOGIN}>{t('errors.loginAgain')}</Link>
              </Button>
            ) : status === '408' || status === '429' || status === 'network' ? (
              <Button
                variant="default"
                className="min-h-[44px]"
                onClick={onRetry || (() => window.location.reload())}
              >
                <RotateCcw className="size-4 mr-2" />
                {t('common.retry')}
              </Button>
            ) : status.startsWith('5') ? (
              <>
                <Button
                  variant="default"
                  className="min-h-[44px]"
                  onClick={() => window.location.reload()}
                >
                  <RotateCcw className="size-4 mr-2" />
                  {t('errors.reloadPage')}
                </Button>
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link to={APP_ROUTES.TASKS}>
                    <House className="size-4 mr-2" />
                    {t('errors.goHome')}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="default" className="min-h-[44px]">
                  <Link to={APP_ROUTES.TASKS}>
                    <House className="size-4 mr-2" />
                    {t('errors.goHome')}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  {t('common.back')}
                </Button>
              </>
            )}
          </div>

          {/* Bottom Reference Box */}
          {config.showReferenceCode && (
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-mono">
                  {t('errors.referenceCode', { code: activeRefCode })}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                  title={t('errors.copyReference')}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-status-done" />
                      <span className="text-status-done">{t('common.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>{t('common.copy')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* DEV-only technical stack trace box */}
          {import.meta.env.DEV && technicalDetails && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-[11px] font-mono text-destructive space-y-1">
              <div className="font-semibold">{t('errors.technicalDetails')}</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">{technicalDetails}</pre>
            </div>
          )}

          {/* Suggested Links for 404 / 403 */}
          {config.showLinks && (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t('errors.suggestions')}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {SUGGESTED_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-primary hover:underline py-1"
                  >
                    • {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        {t('errors.footer')}
      </footer>
    </div>
  )
}

const CHUNK_LOAD_ERROR = /failed to fetch dynamically imported module|loading chunk|importing a module script failed/i

/**
 * Root Error Boundary component used by React Router errorElement.
 */
export function RootRouteErrorBoundary() {
  const error = useRouteError()

  let technical = ''

  if (typeof error === 'object' && error !== null && 'message' in error) {
    technical = String((error as { message: unknown }).message)
  }
  if (typeof error === 'object' && error !== null && 'stack' in error) {
    technical += `\n${String((error as { stack: unknown }).stack)}`
  }

  // Lazy-chunk load failures are network failures (brief §5.12).
  const status: ErrorStatusCode = CHUNK_LOAD_ERROR.test(technical)
    ? 'network'
    : toErrorStatus(error)

  return <ErrorState status={status} technicalDetails={technical} />
}
