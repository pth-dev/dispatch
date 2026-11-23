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
import { TaskMobileList } from '../components/TaskMobileList'
import { useTaskList } from '../api/queries'
import { usePageClamp, useTaskListParams } from '../hooks/use-task-list-params'
import { useTaskColumns } from '../hooks/use-task-columns'
import { useTaskViewPrefs } from '../hooks/use-task-view-prefs'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  InlineError,
  PageContainer,
  PageContainerBody,
  PageHeader,
  isFullPageError,
  throwFullPageError,
  toErrorStatus,
} from '@/components/layout'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import { useLessons } from '@/hooks/use-lessons'
import { buildTaskLessonHitsMap } from '@/utils/lesson-match'
import { canCreateTask } from '@/utils/permissions'
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
  const isDesktopCardView = !isMobile && viewMode === 'card'
  const showTablePagination = !isError && total > 0 && !isMobile && viewMode === 'table'
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
    <PageContainer className="max-lg:gap-2">
      {/* Page Header Row */}
      <PageHeader
        title={t('tasks.title')}
        actions={
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

            {canCreate && (
              <Button
                asChild
                className="h-9 lg:h-10 px-3 lg:px-4 gap-1.5 lg:gap-2 text-xs lg:text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg cursor-pointer"
              >
                <Link to={APP_ROUTES.TASK_NEW} aria-label={t('tasks.create')}>
                  <Plus className="size-4" aria-hidden="true" />
                  <span>{isMobile ? t('tasks.mobile.createShort') : t('tasks.create')}</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Main Content Card (full-bleed flat list on mobile, card container on desktop) */}
      <PageContainerBody
        surface="card"
        scrollable={false}
        className="max-lg:-mx-4 max-lg:rounded-none max-lg:border-x-0"
      >
        <div className="shrink-0 flex flex-col gap-2 px-4 pt-1 pb-2.5 lg:gap-3 lg:short:gap-2 lg:p-4 lg:short:p-3 lg:pb-3 border-b border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <TaskScopeTabs
              activeScope={params.scope}
              counts={counts}
              onScopeChange={setScope}
              className="min-w-0 xl:shrink-0 border-b-0 -mb-1 lg:mb-0"
            />
            <LegendStrip className="hidden xl:flex max-w-full" />
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

        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:short:min-h-fit">
          {isError ? (
            <InlineError
              status={errorStatus}
              onRetry={() => void refetch()}
              className="m-4"
            />
          ) : isMobile ? (
            <TaskMobileList
              tasks={filteredItems}
              isLoading={isLoading}
              statusFilter={params.status}
              resetKey={cardResetKey}
              emptyMessage={emptyMessage}
            />
          ) : isDesktopCardView ? (
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

        {showTablePagination && (
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
    </PageContainer>
  )
}

export default TaskListPage
