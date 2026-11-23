import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ArrowLeft, House, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_ROUTES } from '@/constants/app-routes'
import type { ErrorStatusCode } from './error-status'

type ErrorActionsProps = {
  status: ErrorStatusCode
  homeRoute: string
  onRetry?: () => void
}

export function ErrorActions({ status, homeRoute, onRetry }: ErrorActionsProps) {
  const { t } = useTranslation()

  if (status === '401') {
    return (
      <Button asChild variant="default" className="min-h-11">
        <Link to={APP_ROUTES.LOGIN}>{t('errors.loginAgain')}</Link>
      </Button>
    )
  }

  if (status === '408' || status === '429' || status === 'network') {
    const label = status === 'network' && !onRetry ? t('errors.reloadPage') : t('common.retry')
    return (
      <Button
        variant="default"
        className="min-h-11"
        onClick={onRetry || (() => window.location.reload())}
      >
        <RotateCcw className="size-4 mr-2" aria-hidden="true" />
        {label}
      </Button>
    )
  }

  if (status.startsWith('5')) {
    return (
      <>
        <Button
          variant="default"
          className="min-h-11"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="size-4 mr-2" aria-hidden="true" />
          {t('errors.reloadPage')}
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link to={homeRoute}>
            <House className="size-4 mr-2" aria-hidden="true" />
            {t('errors.goHome')}
          </Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <Button asChild variant="default" className="min-h-11">
        <Link to={homeRoute}>
          <House className="size-4 mr-2" aria-hidden="true" />
          {t('errors.goHome')}
        </Link>
      </Button>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="size-4 mr-2" aria-hidden="true" />
        {t('common.back')}
      </Button>
    </>
  )
}
