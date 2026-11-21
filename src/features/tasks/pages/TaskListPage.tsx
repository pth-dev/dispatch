import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { PaginationControl } from '@/components/ui/pagination-control'
import { TaskScopeTabs } from '../components/TaskScopeTabs'
import { LegendStrip } from '../components/LegendStrip'
import { FilterBar } from '../components/FilterBar'
import { TaskViewControls } from '../components/TaskViewControls'
import { TaskCardGrid } from '../components/TaskCardGrid'
import { useTaskList } from '../api/queries'
import { usePageClamp, useTaskListParams } from '../hooks/use-task-list-params'
import { useTaskColumns } from '../hooks/use-task-columns'
import { useTaskViewPrefs } from '../hooks/use-task-view-prefs'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import { useLessons } from '@/hooks/use-lessons'
import { buildTaskLessonHitsMap } from '@/utils/lesson-match'
import { canCreateTask } from '@/utils/permissions'
import { cn } from '@/utils'
import type { RawTask, TaskListParams } from '@/schemas/task'

function buildCardResetKey(params: TaskListParams): string {
  return [
    params.scope,
    params.search ?? '',
    params.fromDate ?? '',
    params.toDate ?? '',
    params.department ?? '',
    params.status ?? '',
    params.site ?? '',
    params.level ?? '',
    params.taskType ?? '',
    params.confidential ?? '',
    (params.flags ?? []).join(','),
    params.sort ?? 'default',
  ].join('|')
}

export function TaskListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAppStore((s) => s.user)
  const canCreate = canCreateTask(user)

  const {
    params,
    activeFilterCount,
    advancedFilterCount,
    setScope,
    setSort,
    patchFilters,
    resetFilters,
    setPage,
    setPageSize,
  } = useTaskListParams()

  const { data, isLoading, isError, error, refetch } = useTaskList(params)
  const { data: lessons = [] } = useLessons()
  const {
    viewMode,
    hiddenSet,
    columnOrder,
    visibleColumnIds,
    isDefaultColumns,
    setViewMode,
    toggleColumn,
    moveColumn,
    resetColumns,
  } = useTaskViewPrefs()

  const items = data?.items ?? []
  const filteredItems = data?.filteredItems ?? []
  const lessonHitsByTaskId = buildTaskLessonHitsMap(items, lessons)

  const columns = useTaskColumns(params.page, params.pageSize, {
    visibleColumnIds,
    useFixedWidths: isDefaultColumns,
    lessonHitsByTaskId,
  })

  usePageClamp({
    page: params.page,
    pageSize: params.pageSize,
    total: data?.total,
    isPlaceholderData: false,
    setPage,
  })

  const errorStatus = toErrorStatus(error)

  if (isError && isFullPageError(errorStatus)) {
    throwFullPageError(errorStatus)
  }

  const total = data?.total ?? 0
  const counts = data?.counts
  const availableTaskTypes = data?.availableTaskTypes ?? []
  const isCardView = isMobile || viewMode === 'card'
  const cardResetKey = buildCardResetKey(params)

  const emptyMessage =
    activeFilterCount > 0
      ? t('tasks.empty.all')
      : params.scope === 'mine'
        ? t('tasks.empty.mine')
        : params.scope === 'created'
          ? t('tasks.empty.created')
          : t('tasks.empty.all')

  const handleRowClick = (task: RawTask) => {
    navigate(APP_ROUTES.TASK_DETAIL(task.id))
  }

  return (
    <PageContainer className={cn(isMobile && canCreate && 'pb-20 lg:pb-0')}>
      {/* Page Header Row */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
          {t('tasks.title')}
        </h1>

        <div className="flex items-center gap-2.5 shrink-0">
          <TaskViewControls
            viewMode={viewMode}
            columnOrder={columnOrder}
            hiddenSet={hiddenSet}
            isDefaultColumns={isDefaultColumns}
            onViewModeChange={setViewMode}
            onToggleColumn={toggleColumn}
            onMoveColumn={moveColumn}
            onResetColumns={resetColumns}
          />

          {!isMobile && canCreate && (
            <Button
              asChild
              className="h-11 lg:h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg cursor-pointer"
            >
              <Link to={APP_ROUTES.TASK_NEW}>
                <Plus className="size-4" aria-hidden="true" />
                <span>{t('tasks.create')}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <PageContainerBody surface="card">
        <div className="shrink-0 flex flex-col gap-3 short:gap-2 p-4 short:p-3 pb-3 border-b border-border bg-card">
          <div className="flex items-center justify-between gap-4">
            <TaskScopeTabs
              activeScope={params.scope}
              counts={counts}
              onScopeChange={setScope}
              className="min-w-0 xl:shrink-0 border-b-0 -mb-2 lg:mb-0"
            />
            <LegendStrip className="hidden xl:flex shrink-0" />
          </div>

          <FilterBar
            params={params}
            activeFilterCount={activeFilterCount}
            advancedFilterCount={advancedFilterCount}
            availableTaskTypes={availableTaskTypes}
            onPatch={patchFilters}
            onSortChange={setSort}
            onReset={resetFilters}
          />
        </div>

        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          {isError ? (
            <InlineError
              status={errorStatus}
              onRetry={() => void refetch()}
              className="m-4"
            />
          ) : isCardView ? (
            <TaskCardGrid
              tasks={filteredItems}
              isLoading={isLoading}
              statusFilter={params.status}
              resetKey={cardResetKey}
              emptyMessage={emptyMessage}
            />
          ) : (
            <DataTable
              columns={columns}
              data={items}
              keyExtractor={(row) => String(row.id)}
              isLoading={isLoading}
              emptyMessage={emptyMessage}
              onRowClick={handleRowClick}
              className="flex-1 min-h-0"
            />
          )}
        </div>

        {!isError && total > 0 && !isCardView && (
          <div className="shrink-0 border-t border-border bg-card px-4 py-2.5">
            <PaginationControl
              page={params.page}
              pageSize={params.pageSize}
              total={total}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => setPageSize(newSize)}
            />
          </div>
        )}
      </PageContainerBody>

      {isMobile && canCreate && (
        <Button
          asChild
          className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground p-0 flex items-center justify-center"
          aria-label={t('tasks.create')}
        >
          <Link to={APP_ROUTES.TASK_NEW}>
            <Plus className="size-6" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </PageContainer>
  )
}

export default TaskListPage
