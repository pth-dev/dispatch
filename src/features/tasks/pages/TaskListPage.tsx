import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { PaginationControl } from '@/components/ui/pagination-control'
import { StatusText } from '@/components/ui/status-text'
import { TaskScopeTabs } from '../components/TaskScopeTabs'
import { LegendStrip } from '../components/LegendStrip'
import { FilterBar } from '../components/FilterBar'
import { useTaskList } from '../api/queries'
import { usePageClamp, useTaskListParams } from '../hooks/use-task-list-params'
import { formatTaskDueDate, useTaskColumns } from '../hooks/use-task-columns'
import { useIsMobile } from '@/hooks/use-mobile'
import { InlineError, isFullPageError, throwFullPageError, toErrorStatus } from '@/components/layout'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import { canWriteMenu } from '@/utils/permissions'
import { deriveTaskStatus, isTaskPaused } from '@/utils/task-domain'
import { cn } from '@/utils'
import type { RawTask } from '@/schemas/task'

export function TaskListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAppStore((s) => s.user)
  const canCreate = canWriteMenu(user, 'dashboard')

  const {
    params,
    activeFilterCount,
    setScope,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
  } = useTaskListParams()

  const { data, isLoading, isError, error, refetch } = useTaskList(params)
  const columns = useTaskColumns(params.page, params.pageSize)

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

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const counts = data?.counts

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

  const renderMobileCard = (task: RawTask) => {
    const derived = deriveTaskStatus(task)
    const paused = isTaskPaused(task)
    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-primary">#{task.id}</span>
          <div className="flex items-center gap-1.5">
            <StatusText status={paused ? 'paused' : derived} />
            <span className="text-[11px] text-muted-foreground">{task.progress}%</span>
          </div>
        </div>

        <p className="font-medium text-foreground line-clamp-2 leading-snug">{task.title}</p>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
          <span>{task.assigned_unit || '-'}</span>
          <span>•</span>
          <span>{task.assign_person || '-'}</span>
          <span>•</span>
          <span>{t('tasks.mobile.dueDate', { date: formatTaskDueDate(task.due_date) })}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col space-y-3 short:space-y-2 lg:min-h-[546px]',
        isMobile && canCreate && 'pb-20 lg:pb-0',
      )}
    >
      {/* Page Header Row */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
          {t('tasks.title')}
        </h1>

        {!isMobile && canCreate && (
          <Button
            asChild
            className="h-11 lg:h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg cursor-pointer"
          >
            <Link to={APP_ROUTES.TASK_NEW}>
              <Plus className="size-4" />
              <span>{t('tasks.create')}</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Main Content Card */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card overflow-hidden">
        <div className="shrink-0 flex flex-col gap-3 short:gap-2 p-4 short:p-3 pb-3 border-b border-border bg-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <TaskScopeTabs
              activeScope={params.scope}
              counts={counts}
              onScopeChange={setScope}
              className="border-b-0 -mb-2 lg:mb-0"
            />
            <LegendStrip className="hidden xl:flex" />
          </div>

          <FilterBar
            key={`${params.search ?? ''}|${params.fromDate ?? ''}|${params.toDate ?? ''}|${params.department ?? ''}|${params.status ?? ''}`}
            initialValues={{
              search: params.search,
              fromDate: params.fromDate,
              toDate: params.toDate,
              department: params.department,
              status: params.status,
            }}
            activeFilterCount={activeFilterCount}
            onApply={setFilters}
            onReset={resetFilters}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isError ? (
            <InlineError
              status={errorStatus}
              onRetry={() => void refetch()}
              className="m-4"
            />
          ) : (
            <DataTable
              columns={columns}
              data={items}
              keyExtractor={(row) => String(row.id)}
              isLoading={isLoading}
              emptyMessage={emptyMessage}
              onRowClick={handleRowClick}
              renderMobileCard={renderMobileCard}
              className="flex-1 min-h-0"
            />
          )}
        </div>

        {!isError && total > 0 && (
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
      </div>

      {isMobile && canCreate && (
        <Button
          asChild
          className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground p-0 flex items-center justify-center"
          aria-label={t('tasks.create')}
        >
          <Link to={APP_ROUTES.TASK_NEW}>
            <Plus className="size-6" />
          </Link>
        </Button>
      )}
    </div>
  )
}

export default TaskListPage
