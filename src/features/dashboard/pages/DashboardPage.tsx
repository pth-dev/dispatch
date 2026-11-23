import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { Building2, RefreshCw } from 'lucide-react'
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
import { LessonMarqueeBanner } from '@/components/ui/lesson-marquee-banner'
import { APP_ROUTES } from '@/constants/app-routes'
import { useTodosByDate } from '@/features/todo/api/queries'
import { useLessons } from '@/hooks/use-lessons'
import { useAllTasks } from '@/hooks/use-tasks'
import type { PostGranularity, PostKpiPeriod } from '@/schemas/dashboard'
import { canReadMenu, isSuperLike } from '@/utils/permissions'
import { toLocalDateString } from '@/utils/task-domain'
import { usePostStats } from '../api/queries'
import { DashboardBottleneckTabs } from '../components/DashboardBottleneckTabs'
import {
  DashboardDrilldownModals,
  type DashboardModalState,
} from '../components/DashboardDrilldownModals'
import { DashboardFlowTrendChart } from '../components/DashboardFlowTrendChart'
import { DashboardKpiRow } from '../components/DashboardKpiRow'
import { DashboardLeaderboard } from '../components/DashboardLeaderboard'
import { DashboardOverdueAgingCard } from '../components/DashboardOverdueAgingCard'
import { DashboardPostTrendSection } from '../components/DashboardPostTrendSection'
import { DashboardTodayTodoCard } from '../components/DashboardTodayTodoCard'
import { useDashboardComputations } from '../hooks/use-dashboard-data'
import { buildTaskDrilldownUrl, type FlowTrendGranularity } from '../utils/dashboard-charts'
import {
  readStoredPostGranularity,
  type DashboardPeriod,
  type DashboardScopeMode,
} from '../utils/dashboard-domain'

const COMPANY_GRAN_KEY = 'dispatch.postGran'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAppStore((s) => s.user)

  const [scopeMode, setScopeMode] = React.useState<DashboardScopeMode>('all')
  const [period, setPeriod] = React.useState<DashboardPeriod>('month')
  const [flowTrendGran, setFlowTrendGran] = React.useState<FlowTrendGranularity>('week')
  const [includeAllToday, setIncludeAllToday] = React.useState(false)
  const [modalState, setModalState] = React.useState<DashboardModalState>(null)
  const [postGran, setPostGran] = React.useState<PostGranularity>(() =>
    readStoredPostGranularity(COMPANY_GRAN_KEY),
  )
  const [postKpi, setPostKpi] = React.useState<PostKpiPeriod>('month')

  const todayStr = toLocalDateString(new Date())
  const canReadTotalPosts = canReadMenu(user, 'dash_total')
  const canReadDeptBoard = canReadMenu(user, 'dash_dept')
  const isAdmin = Boolean(user && (user.role === 'admin' || isSuperLike(user)))

  const tasksQuery = useAllTasks()
  const lessonsQuery = useLessons()
  const todosQuery = useTodosByDate(todayStr)
  const postStatsQuery = usePostStats(
    { level: 'company', gran: postGran, kpi: postKpi, top: 20 },
    canReadTotalPosts,
  )

  const errorStatus = toErrorStatus(tasksQuery.error)
  if (tasksQuery.isError && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  const scheduledTaskIds = new Set(
    (todosQuery.data?.task_data ?? []).map((item) => item.id),
  )

  const computed = useDashboardComputations({
    tasks: tasksQuery.data ?? [],
    lessons: lessonsQuery.data ?? [],
    scheduledTaskIds,
    user,
    scopeMode,
    period,
    flowTrendGran,
    includeAllToday,
    emptyLabel: t('dashboard.bottleneck.unassigned'),
  })

  const handleGranChange = (next: PostGranularity) => {
    setPostGran(next)
    try {
      localStorage.setItem(COMPANY_GRAN_KEY, next)
    } catch {
      // ignore storage errors
    }
  }

  const handleRefresh = () => {
    void tasksQuery.refetch()
    void todosQuery.refetch()
    if (canReadTotalPosts) void postStatsQuery.refetch()
  }

  const isFetching = tasksQuery.isFetching || postStatsQuery.isFetching
  const overdueHref = buildTaskDrilldownUrl(APP_ROUTES.TASKS, {
    scope: scopeMode,
    status: 'delayed_pending',
  })

  const handleClickOpen = () => {
    if (scopeMode === 'mine') {
      setModalState({ type: 'my_pending' })
      return
    }
    navigate(buildTaskDrilldownUrl(APP_ROUTES.TASKS, { scope: 'all', status: 'incomplete' }))
  }

  const handleClickDueToday = () => {
    navigate(
      buildTaskDrilldownUrl(APP_ROUTES.TASKS, {
        scope: scopeMode,
        status: 'incomplete',
        fromDate: todayStr,
        toDate: todayStr,
      }),
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canReadDeptBoard && (
              <Button asChild variant="outline">
                <Link to={APP_ROUTES.DASHBOARD_DEPT}>
                  <Building2 className="size-4" aria-hidden="true" />
                  <span>{t('nav.dashboardDept')}</span>
                </Link>
              </Button>
            )}
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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
            <div className="h-56 motion-safe:animate-pulse rounded-xl border border-border bg-card" />
          </div>
        ) : tasksQuery.isError ? (
          <InlineError status={errorStatus} onRetry={() => void tasksQuery.refetch()} />
        ) : (
          <>
            <LessonMarqueeBanner hits={computed.lessonHits} interactive />

            <DashboardKpiRow
              scopeMode={scopeMode}
              onScopeModeChange={setScopeMode}
              period={period}
              onPeriodChange={setPeriod}
              snapshot={computed.snapshot}
              periodComparison={computed.periodComparison}
              response1h={computed.response1h}
              onClickOpen={handleClickOpen}
              onClickOverdue={() => navigate(overdueHref)}
              onClickDueToday={handleClickDueToday}
              onClickPeriodTab={(initialTab) => setModalState({ type: 'period', initialTab })}
              onClickResponse1h={() => setModalState({ type: 'response_1h' })}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <DashboardFlowTrendChart
                summary={computed.flowTrend}
                gran={flowTrendGran}
                onGranChange={setFlowTrendGran}
                onSelectPoint={(point) => setModalState({ type: 'trend_bucket', point })}
              />
              <DashboardOverdueAgingCard
                stats={computed.overdueAging}
                viewAllHref={overdueHref}
                onSelectBucket={(bucket) => setModalState({ type: 'aging_bucket', bucket })}
              />
            </div>

            <DashboardTodayTodoCard
              groups={computed.todayGroups}
              isAdmin={isAdmin}
              includeAll={includeAllToday}
              onToggleIncludeAll={() => setIncludeAllToday((v) => !v)}
            />

            <DashboardBottleneckTabs breakdowns={computed.breakdowns} scopeMode={scopeMode} />

            <DashboardLeaderboard rows={computed.ranking} period={period} />

            <DashboardPostTrendSection
              title={t('dashboard.posts.companyTitle')}
              subtitle={t('dashboard.posts.companySubtitle')}
              rankingTitle={t('dashboard.posts.companyRankingTitle')}
              canRead={canReadTotalPosts}
              data={postStatsQuery.data}
              isLoading={postStatsQuery.isLoading}
              isError={postStatsQuery.isError}
              error={postStatsQuery.error}
              onRetry={() => void postStatsQuery.refetch()}
              gran={postGran}
              onGranChange={handleGranChange}
              kpiPeriod={postKpi}
              onKpiPeriodChange={setPostKpi}
            />
          </>
        )}
      </PageContainerBody>

      <DashboardDrilldownModals
        modalState={modalState}
        onClose={() => setModalState(null)}
        period={period}
        periodFlow={computed.periodFlow}
        myPendingTasks={computed.myPendingTasks}
        response1h={computed.response1h}
      />
    </PageContainer>
  )
}

export default DashboardPage
