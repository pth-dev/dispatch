import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { APP_ROUTES } from '@/constants/app-routes'
import { useAllTasks } from '@/hooks/use-tasks'
import type { PostGranularity, PostKpiPeriod } from '@/schemas/dashboard'
import { computeDeptTaskSummary } from '@/utils/kpi-domain'
import { usePostStats } from '../api/queries'
import { DashboardBottleneckTabs } from '../components/DashboardBottleneckTabs'
import {
  DashboardDrilldownModals,
  type DashboardModalType,
} from '../components/DashboardDrilldownModals'
import { DashboardKpiRow } from '../components/DashboardKpiRow'
import { DashboardLeaderboard } from '../components/DashboardLeaderboard'
import { DashboardPostTrendSection } from '../components/DashboardPostTrendSection'
import { DeptPeopleHeatmapTable } from '../components/DeptPeopleHeatmapTable'
import { DeptScopeHeader } from '../components/DeptScopeHeader'
import { useDashboardComputations } from '../hooks/use-dashboard-data'
import {
  filterTasksByDeptSet,
  readStoredPostGranularity,
  type DashboardPeriod,
  type DashboardScopeMode,
} from '../utils/dashboard-domain'

const DEPT_GRAN_KEY = 'dispatch.deptPostGran'

export function DepartmentDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAppStore((s) => s.user)

  const selectedDept = searchParams.get('dept') || user?.dept || ''
  const includeSub = searchParams.get('sub') === '1'

  const [scopeMode, setScopeMode] = React.useState<DashboardScopeMode>('all')
  const [period, setPeriod] = React.useState<DashboardPeriod>('month')
  const [activeModal, setActiveModal] = React.useState<DashboardModalType>(null)
  const [postGran, setPostGran] = React.useState<PostGranularity>(() =>
    readStoredPostGranularity(DEPT_GRAN_KEY),
  )
  const [postKpi, setPostKpi] = React.useState<PostKpiPeriod>('month')

  const tasksQuery = useAllTasks()
  const postStatsQuery = usePostStats({
    level: 'dept',
    dept: selectedDept,
    sub: includeSub,
    gran: postGran,
    kpi: postKpi,
    top: 200,
  })

  const errorStatus = toErrorStatus(tasksQuery.error)
  if (tasksQuery.isError && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  const allTasks = tasksQuery.data ?? []
  const deptSet =
    postStatsQuery.data && postStatsQuery.data.dept_set.length > 0
      ? postStatsQuery.data.dept_set
      : selectedDept
        ? [selectedDept]
        : []
  const deptTasks = filterTasksByDeptSet(allTasks, deptSet)
  const deptSummary = computeDeptTaskSummary(deptTasks)

  const computed = useDashboardComputations({
    tasks: deptTasks,
    user,
    scopeMode,
    period,
    emptyLabel: t('dashboard.bottleneck.unassigned'),
  })

  const updateDeptParams = (nextDept: string, nextSub: boolean) => {
    const next = new URLSearchParams(searchParams)
    if (nextDept) next.set('dept', nextDept)
    else next.delete('dept')
    if (nextSub) next.set('sub', '1')
    else next.delete('sub')
    setSearchParams(next, { replace: true })
  }

  const handleGranChange = (next: PostGranularity) => {
    setPostGran(next)
    try {
      localStorage.setItem('dispatch.deptPostGran', next)
    } catch {
      // ignore storage errors
    }
  }

  const handleRefresh = () => {
    void tasksQuery.refetch()
    void postStatsQuery.refetch()
  }

  const isFetching = tasksQuery.isFetching || postStatsQuery.isFetching

  return (
    <PageContainer>
      <PageHeader
        title={t('dashboard.dept.title')}
        subtitle={t('dashboard.dept.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link to={APP_ROUTES.DASHBOARD}>
                <LayoutDashboard className="size-4" aria-hidden="true" />
                <span>{t('nav.dashboard')}</span>
              </Link>
            </Button>
            <Button type="button" variant="outline" disabled={isFetching} onClick={handleRefresh}>
              <RefreshCw
                className={isFetching ? 'size-4 motion-safe:animate-spin' : 'size-4'}
                aria-hidden="true"
              />
              <span>{t('common.refresh')}</span>
            </Button>
          </div>
        }
      />

      <PageContainerBody className="space-y-4">
        {tasksQuery.isLoading ? (
          <div role="status" className="space-y-4">
            <span className="sr-only">{t('common.loading')}</span>
            <div className="h-48 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-56 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
          </div>
        ) : tasksQuery.isError ? (
          <InlineError status={errorStatus} onRetry={() => void tasksQuery.refetch()} />
        ) : (
          <>
            <DeptScopeHeader
              deptLabel={postStatsQuery.data?.dept_label || selectedDept}
              selectedDept={postStatsQuery.data?.dept || selectedDept}
              deptOptions={postStatsQuery.data?.dept_options ?? []}
              includeSub={includeSub}
              totalVisibleCount={allTasks.length}
              deptTaskCount={deptTasks.length}
              deptSetSize={Math.max(1, deptSet.length)}
              summary={deptSummary}
              onDeptChange={(dept) => updateDeptParams(dept, includeSub)}
              onIncludeSubChange={(checked) => updateDeptParams(selectedDept, checked)}
            />

            <DashboardKpiRow
              scopeMode={scopeMode}
              onScopeModeChange={setScopeMode}
              period={period}
              onPeriodChange={setPeriod}
              snapshot={computed.snapshot}
              periodFlow={computed.periodFlow}
              response1h={computed.response1h}
              onClickOpen={() =>
                scopeMode === 'mine'
                  ? setActiveModal('my_pending')
                  : navigate(`${APP_ROUTES.TASKS}?status=incomplete`)
              }
              onClickOverdue={() => navigate(`${APP_ROUTES.TASKS}?status=delayed_pending`)}
              onClickDueToday={() => navigate(`${APP_ROUTES.TASKS}?flag=recur_today`)}
              onClickPeriod={() => setActiveModal('period')}
              onClickResponse1h={() => setActiveModal('response_1h')}
            />

            <DashboardBottleneckTabs breakdowns={computed.breakdowns} />

            <DashboardLeaderboard rows={computed.ranking} />

            <DashboardPostTrendSection
              title={t('dashboard.posts.deptTitle')}
              subtitle={t('dashboard.posts.deptSubtitle')}
              rankingTitle={t('dashboard.posts.deptRankingTitle')}
              canRead
              data={postStatsQuery.data}
              isLoading={postStatsQuery.isLoading}
              isError={postStatsQuery.isError}
              error={postStatsQuery.error}
              onRetry={() => void postStatsQuery.refetch()}
              gran={postGran}
              onGranChange={handleGranChange}
              kpiPeriod={postKpi}
              onKpiPeriodChange={setPostKpi}
              maxSeries={12}
              rankLimit={200}
            />

            <DeptPeopleHeatmapTable data={postStatsQuery.data} />
          </>
        )}
      </PageContainerBody>

      <DashboardDrilldownModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        periodFlow={computed.periodFlow}
        myPendingTasks={computed.myPendingTasks}
        response1h={computed.response1h}
      />
    </PageContainer>
  )
}

export default DepartmentDashboardPage
