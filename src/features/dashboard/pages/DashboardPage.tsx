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
  type DashboardModalType,
} from '../components/DashboardDrilldownModals'
import { DashboardKpiRow } from '../components/DashboardKpiRow'
import { DashboardLeaderboard } from '../components/DashboardLeaderboard'
import { DashboardPostTrendSection } from '../components/DashboardPostTrendSection'
import { DashboardTodayTodoCard } from '../components/DashboardTodayTodoCard'
import { useDashboardComputations } from '../hooks/use-dashboard-data'
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
  const [includeAllToday, setIncludeAllToday] = React.useState(false)
  const [activeModal, setActiveModal] = React.useState<DashboardModalType>(null)
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
    includeAllToday,
    emptyLabel: t('dashboard.bottleneck.unassigned'),
  })

  const handleGranChange = (next: PostGranularity) => {
    setPostGran(next)
    try {
      localStorage.setItem('dispatch.postGran', next)
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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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

            <DashboardTodayTodoCard
              groups={computed.todayGroups}
              isAdmin={isAdmin}
              includeAll={includeAllToday}
              onToggleIncludeAll={() => setIncludeAllToday((v) => !v)}
            />

            <DashboardBottleneckTabs breakdowns={computed.breakdowns} />

            <DashboardLeaderboard rows={computed.ranking} />

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
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        periodFlow={computed.periodFlow}
        myPendingTasks={computed.myPendingTasks}
        response1h={computed.response1h}
      />
    </PageContainer>
  )
}

export default DashboardPage
