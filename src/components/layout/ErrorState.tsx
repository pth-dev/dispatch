import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useRouteError } from 'react-router'
import {
  SearchX,
  Lock,
  Clock,
  CircleAlert,
  WifiOff,
  House,
  ArrowLeft,
  RotateCcw,
  Copy,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { APP_ROUTES } from '@/constants/app-routes'

export type ErrorStatusCode =
  | '404'
  | '403'
  | '401'
  | '408'
  | '429'
  | '500'
  | '502'
  | '503'
  | '504'
  | 'network'

interface StatusConfig {
  code: ErrorStatusCode
  icon: LucideIcon
  toneColor: string
  showLinks?: boolean
  showReferenceCode?: boolean
}

const STATUS_CONFIGS: Record<ErrorStatusCode, StatusConfig> = {
  '404': {
    code: '404',
    icon: SearchX,
    toneColor: '#1F6FEB',
    showLinks: true,
  },
  '403': {
    code: '403',
    icon: Lock,
    toneColor: '#B45309',
    showLinks: true,
  },
  '401': {
    code: '401',
    icon: Lock,
    toneColor: '#B45309',
  },
  '408': {
    code: '408',
    icon: Clock,
    toneColor: '#B45309',
  },
  '429': {
    code: '429',
    icon: Clock,
    toneColor: '#B45309',
  },
  '500': {
    code: '500',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    showReferenceCode: true,
  },
  '502': {
    code: '502',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    showReferenceCode: true,
  },
  '503': {
    code: '503',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    showReferenceCode: true,
  },
  '504': {
    code: '504',
    icon: CircleAlert,
    toneColor: '#D32F2F',
    showReferenceCode: true,
  },
  network: {
    code: 'network',
    icon: WifiOff,
    toneColor: '#D32F2F',
    showReferenceCode: true,
  },
}

function getStaticReferenceCode(): string {
  return 'ERR-7F3A21 • 18/11/2026 09:30'
}

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

export function ErrorState({
  status = '500',
  technicalDetails,
  referenceCode,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation()
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS['500']
  const Icon = config.icon
  const [copied, setCopied] = React.useState(false)

  const activeRefCode = referenceCode || getStaticReferenceCode()
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
            className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
            style={{ color: config.toneColor }}
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
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-600">{t('common.copied')}</span>
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

/**
 * Root Error Boundary component used by React Router errorElement
 */
export function RootRouteErrorBoundary() {
  const error = useRouteError()

  let status: ErrorStatusCode = '500'
  let technical = ''

  if (typeof error === 'object' && error !== null) {
    if ('status' in error) {
      const s = String((error as { status: unknown }).status)
      if (['404', '403', '401', '408', '429', '500', '502', '503', '504'].includes(s)) {
        status = s as ErrorStatusCode
      }
    }
    if ('message' in error) {
      technical = String((error as { message: unknown }).message)
    }
    if ('stack' in error) {
      technical += `\n${String((error as { stack: unknown }).stack)}`
    }
  }

  return <ErrorState status={status} technicalDetails={technical} />
}
