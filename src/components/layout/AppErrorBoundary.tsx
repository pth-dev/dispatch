import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import i18n from '@/i18n'
import { Button } from '@/components/ui/button'
import { APP_ROUTES } from '@/constants/app-routes'
import { createReferenceCode } from './error-status'

type AppErrorBoundaryProps = {
  children: React.ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
  referenceCode: string
}

/**
 * Root class ErrorBoundary wrapping providers & router (docs/DEVIATIONS.md §5).
 * Uses plain anchor/reload controls so it never depends on Router context.
 */
export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      referenceCode: '',
    }
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
      referenceCode: createReferenceCode(),
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const t = i18n.t.bind(i18n)

    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <main className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[560px] space-y-5 text-left">
            <p className="text-xs font-semibold tracking-wider uppercase text-destructive">
              {t('errors.status.unknown.caption')}
            </p>
            <h1 className="text-2xl lg:text-3xl font-semibold text-foreground tracking-tight leading-tight">
              {t('errors.status.unknown.title')}
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
              {t('errors.status.unknown.description')}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                variant="default"
                className="min-h-11"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="size-4 mr-2" aria-hidden="true" />
                {t('errors.reloadPage')}
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <a href={APP_ROUTES.HOME}>{t('errors.goHome')}</a>
              </Button>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {t('errors.referenceCode', { code: this.state.referenceCode })}
            </p>
          </div>
        </main>
      </div>
    )
  }
}
