import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  PageHeader,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useAccountOrg, useAccountScope } from '../api/queries'
import { AccountScopeCards } from '../components/AccountScopeCards'
import { OrgTreePanel } from '../components/OrgTreePanel'

function AccountLoadingSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">{label}</span>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-56 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-56 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-56 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
      </div>
      <div className="h-72 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
    </div>
  )
}

export function AccountPage() {
  const { t } = useTranslation()
  const scopeQuery = useAccountScope()
  const orgQuery = useAccountOrg()

  const primaryError = scopeQuery.error ?? orgQuery.error
  const errorStatus = toErrorStatus(primaryError)
  if ((scopeQuery.isError || orgQuery.isError) && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  const isLoading = scopeQuery.isLoading || orgQuery.isLoading
  const isFetching = scopeQuery.isFetching || orgQuery.isFetching
  const hasError = scopeQuery.isError || orgQuery.isError

  const handleRefresh = () => {
    void scopeQuery.refetch()
    void orgQuery.refetch()
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('account.title')}
        subtitle={scopeQuery.data?.note || t('account.subtitle')}
        actions={
          <Button type="button" variant="outline" disabled={isFetching} onClick={handleRefresh}>
            <RefreshCw
              className={isFetching ? 'size-4 motion-safe:animate-spin' : 'size-4'}
              aria-hidden="true"
            />
            <span>{t('common.refresh')}</span>
          </Button>
        }
      />

      <PageContainerBody className="space-y-4">
        {isLoading ? (
          <AccountLoadingSkeleton label={t('common.loading')} />
        ) : hasError || !scopeQuery.data || !orgQuery.data ? (
          <InlineError status={errorStatus} onRetry={handleRefresh} />
        ) : (
          <>
            <AccountScopeCards scope={scopeQuery.data} />
            <OrgTreePanel org={orgQuery.data} scope={scopeQuery.data} />
          </>
        )}
      </PageContainerBody>
    </PageContainer>
  )
}

export default AccountPage
