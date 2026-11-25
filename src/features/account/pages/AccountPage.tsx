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
import { isSuperLike } from '@/utils/permissions'
import { accountKeys } from '../api/keys'
import { useAccountOrg, useAccountScope } from '../api/queries'
import { AccountScopeCards } from '../components/AccountScopeCards'
import { AdminAdTab } from '../components/AdminAdTab'
import { AdminOuViewTab } from '../components/AdminOuViewTab'
import { AdminSystemTab } from '../components/AdminSystemTab'
import { AdminUsersTab } from '../components/AdminUsersTab'
import { OrgTreePanel } from '../components/OrgTreePanel'
import { canAccessAccountAdminTab, canAccessAdTab } from '../utils/admin-permissions'

type AccountTabKey = 'scope' | 'users' | 'ou-view' | 'ad' | 'system'

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
  const canManageAd = canAccessAdTab(user)
  const canManageSystem = isSuperLike(user)
  const hasAdminTabs = canManageUsers || canManageAd || canManageSystem

  const rawTab = searchParams.get('tab')
  const activeTab: AccountTabKey =
    rawTab === 'users' && canManageUsers
      ? 'users'
      : rawTab === 'ou-view' && canManageUsers
        ? 'ou-view'
        : rawTab === 'ad' && canManageAd
          ? 'ad'
          : rawTab === 'system' && canManageSystem
            ? 'system'
            : 'scope'

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
    if (canManageAd) {
      void queryClient.invalidateQueries({ queryKey: accountKeys.adStatus() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.adUsers() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.adSyncLogs() })
    }
    if (canManageSystem) {
      void queryClient.invalidateQueries({ queryKey: accountKeys.sites() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.archiveInfo() })
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
        {hasAdminTabs ? (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList
              variant="line"
              className="w-full justify-start overflow-x-auto border-b border-border pb-1"
            >
              <TabsTrigger value="scope">{t('account.tabs.scope')}</TabsTrigger>
              {canManageUsers && <TabsTrigger value="users">{t('account.tabs.users')}</TabsTrigger>}
              {canManageUsers && (
                <TabsTrigger value="ou-view">{t('account.tabs.ouView')}</TabsTrigger>
              )}
              {canManageAd && <TabsTrigger value="ad">{t('account.tabs.ad')}</TabsTrigger>}
              {canManageSystem && (
                <TabsTrigger value="system">{t('account.tabs.system')}</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="scope" className="space-y-4 pt-3">
              {scopeContent}
            </TabsContent>
            {canManageUsers && (
              <TabsContent value="users" className="pt-3">
                <AdminUsersTab orgItems={orgQuery.data?.items ?? []} />
              </TabsContent>
            )}
            {canManageUsers && (
              <TabsContent value="ou-view" className="pt-3">
                <AdminOuViewTab orgItems={orgQuery.data?.items ?? []} />
              </TabsContent>
            )}
            {canManageAd && (
              <TabsContent value="ad" className="pt-3">
                <AdminAdTab />
              </TabsContent>
            )}
            {canManageSystem && (
              <TabsContent value="system" className="pt-3">
                <AdminSystemTab />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          scopeContent
        )}
      </PageContainerBody>
    </PageContainer>
  )
}

export default AccountPage
