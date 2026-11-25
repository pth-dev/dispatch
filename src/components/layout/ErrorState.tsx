import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Copy, Check } from 'lucide-react'
import { Logo } from './Logo'
import { ErrorActions } from './ErrorActions'
import { APP_ROUTES } from '@/constants/app-routes'
import {
  canReadNavPerm,
  flattenNavTargets,
  getDefaultLandingRoute,
  MAIN_NAV_ITEMS,
} from '@/app/nav-config'
import { useAppStore } from '@/app/store'
import { canWriteMenu } from '@/utils/permissions'
import { env } from '@/services/env'
import {
  ERROR_TONE_CLASS,
  createReferenceCode,
  getErrorStatusMeta,
  type ErrorStatusCode,
} from './error-status'

export type { ErrorStatusCode }
export { RootRouteErrorBoundary } from './RootRouteErrorBoundary'

type ErrorStateProps = {
  status?: ErrorStatusCode
  referenceCode?: string
  onRetry?: () => void
}

/**
 * Full-page error state (brief §5.12). Rendered outside the app shell through
 * the root route `errorElement`, the catch-all route, and permission guards.
 */
export function ErrorState({
  status = '500',
  referenceCode,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)
  const config = getErrorStatusMeta(status)
  const Icon = config.icon
  const [copied, setCopied] = React.useState(false)
  const [generatedRefCode] = React.useState(() => createReferenceCode())
  const copyTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const homeRoute = getDefaultLandingRoute(user)
  const suggestedLinks = [
    ...flattenNavTargets(MAIN_NAV_ITEMS)
      .filter((item) => !item.menuPermKey || !user || canReadNavPerm(user, item.menuPermKey))
      .map((item) => ({ labelKey: item.titleKey, href: item.href })),
    ...(!user || canWriteMenu(user, 'dashboard')
      ? [{ labelKey: 'tasks.create', href: APP_ROUTES.TASK_NEW }]
      : []),
    { labelKey: 'nav.profile', href: APP_ROUTES.PROFILE },
  ]

  const activeRefCode = referenceCode || generatedRefCode

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeRefCode)
      setCopied(true)
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable on non-secure origins; ignore silently
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 lg:px-12">
        <Link to={APP_ROUTES.HOME} className="flex items-center">
          <Logo size={36} />
        </Link>
        <a
          href={`mailto:${env.supportEmail}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t('errors.support')}
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[560px] space-y-6 text-left">
          <div
            className={`flex items-center gap-2 text-xs font-semibold tracking-wider uppercase ${ERROR_TONE_CLASS[config.tone]}`}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden="true" />
            <span>{t(`errors.status.${status}.caption`)}</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight leading-tight">
            {t(`errors.status.${status}.title`)}
          </h1>

          <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
            {t(`errors.status.${status}.description`)}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <ErrorActions status={status} homeRoute={homeRoute} onRetry={onRetry} />
          </div>

          {config.showReferenceCode && (
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-mono">
                  {t('errors.referenceCode', { code: activeRefCode })}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  title={t('errors.copyReference')}
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-success" aria-hidden="true" />
                      <span aria-live="polite" className="text-success">
                        {t('common.copied')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" aria-hidden="true" />
                      <span>{t('common.copy')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {config.showLinks && (
            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t('errors.suggestions')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {suggestedLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex min-h-9 items-center text-primary hover:underline py-1.5"
                  >
                    • {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        {t('errors.footer')}
      </footer>
    </div>
  )
}
