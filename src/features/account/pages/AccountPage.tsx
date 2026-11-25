import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/app/store'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { accountKeys } from '../api/keys'
import { useAccountOrg, useAccountScope } from '../api/queries'
import { AccountScopeCards } from '../components/AccountScopeCards'
import { AdminUsersTab } from '../components/AdminUsersTab'
import { OrgTreePanel } from '../components/OrgTreePanel'
import { canAccessAccountAdminTab } from '../utils/admin-permissions'

type AccountTabKey = 'scope' | 'users'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const user = useAppStore((s) => s.user)

  const canManageUsers = canAccessAccountAdminTab(user)
  const rawTab = searchParams.get('tab')
  const activeTab: AccountTabKey = rawTab === 'users' && canManageUsers ? 'users' : 'scope'

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
    if (canManageUsers) {
      void queryClient.invalidateQueries({ queryKey: accountKeys.adminUsers() })
    }
  }

  const handleTabChange = (next: string) => {
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev)
        if (next === 'scope') updated.delete('tab')
        else updated.set('tab', next)
        return updated
      },
      { replace: true },
    )
  }

  const scopeContent = isLoading ? (
    <AccountLoadingSkeleton label={t('common.loading')} />
  ) : hasError || !scopeQuery.data || !orgQuery.data ? (
    <InlineError status={errorStatus} onRetry={handleRefresh} />
  ) : (
    <>
      <AccountScopeCards scope={scopeQuery.data} />
      <OrgTreePanel org={orgQuery.data} scope={scopeQuery.data} />
    </>
  )

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
        {canManageUsers ? (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList variant="line" className="w-full justify-start border-b border-border pb-1">
              <TabsTrigger value="scope">{t('account.tabs.scope')}</TabsTrigger>
              <TabsTrigger value="users">{t('account.tabs.users')}</TabsTrigger>
            </TabsList>
            <TabsContent value="scope" className="space-y-4 pt-3">
              {scopeContent}
            </TabsContent>
            <TabsContent value="users" className="pt-3">
              <AdminUsersTab orgItems={orgQuery.data?.items ?? []} />
            </TabsContent>
          </Tabs>
        ) : (
          scopeContent
        )}
      </PageContainerBody>
    </PageContainer>
  )
}

export default AccountPage
