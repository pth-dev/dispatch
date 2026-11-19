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
import { useTasks } from '../api/queries'
import { usePageClamp, useTaskListParams } from '../hooks/use-task-list-params'
import { useTaskColumns } from '../hooks/use-task-columns'
import { useIsMobile } from '@/hooks/use-mobile'
import { APP_ROUTES } from '@/constants/app-routes'
import type { Task } from '@/schemas/task'

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

export function TaskListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const {
    params,
    activeFilterCount,
    setScope,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
  } = useTaskListParams()

  const { data, isLoading, isPlaceholderData } = useTasks(params)
  const columns = useTaskColumns(params.page, params.pageSize)

  usePageClamp({
    page: params.page,
    pageSize: params.pageSize,
    total: data?.total,
    isPlaceholderData,
    setPage,
  })

  const items = data?.items || []
  const total = data?.total || 0
  const counts = data?.counts

  const emptyMessage =
    activeFilterCount > 0
      ? t('tasks.empty.all')
      : params.scope === 'mine'
        ? t('tasks.empty.mine')
        : params.scope === 'created'
          ? t('tasks.empty.created')
          : t('tasks.empty.all')

  const handleRowClick = (task: Task) => {
    navigate(APP_ROUTES.TASK_DETAIL(task.id))
  }

  // Mobile card renderer for DataTable fallback (< lg)
  const renderMobileCard = (task: Task) => (
    <div className="space-y-1.5 text-xs">
      {/* Line 1: Code (blue) + Status (right) */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-primary">{task.id}</span>
        <StatusText status={task.status} />
      </div>

      {/* Line 2: Title (up to 2 lines) */}
      <p className="font-medium text-foreground line-clamp-2 leading-snug">
        {task.title}
      </p>

      {/* Line 3: Department • Assignee • Due Date */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
        <span>{task.departmentName || task.department}</span>
        <span>•</span>
        <span>{task.assignee}</span>
        <span>•</span>
        <span>{t('tasks.mobile.dueDate', { date: formatDateVN(task.dueDate) })}</span>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-3 short:space-y-2 lg:min-h-[546px]">
      {/* ── Page Header Row ── */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
          {t('tasks.title')}
        </h1>

        {/* Primary Create Button (Desktop only; on mobile rendered as single FAB below) */}
        {!isMobile && (
          <Button
            asChild
            className="h-10 px-4 gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg cursor-pointer"
          >
            <Link to={APP_ROUTES.TASK_NEW}>
              <Plus className="size-4" />
              <span>{t('tasks.create')}</span>
            </Link>
          </Button>
        )}
      </div>

      {/* ── Main White Card (Row A + Row B + Row C) ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-card rounded-xl border border-border p-4 gap-3 shadow-none lg:overflow-hidden">
        {/* Row A: Underline Tabs (left) + Inline Legend (right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <TaskScopeTabs
            activeScope={params.scope}
            counts={counts}
            onScopeChange={setScope}
          />
          <LegendStrip className="hidden lg:flex" />
        </div>

        {/* Row B: Filter Bar */}
        <div className="shrink-0">
          <FilterBar
            key={`${params.scope}-${params.search || ''}-${params.fromDate || ''}-${params.toDate || ''}-${params.department || ''}-${params.status || ''}`}
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

        {/* Row C: DataTable with fixed layout & sticky header */}
        <div className="flex-1 min-h-0 flex flex-col">
          <DataTable<Task>
            data={items}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={handleRowClick}
            isLoading={isLoading}
            emptyMessage={emptyMessage}
            renderMobileCard={renderMobileCard}
            className="flex-1 min-h-0"
          />
        </div>

        {/* Card Footer: Pagination */}
        <div className="shrink-0 pt-2 border-t border-border">
          <PaginationControl
            page={params.page}
            pageSize={params.pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* ── Mobile FAB (Floating Action Button) ── */}
      {isMobile && (
        <Button
          asChild
          className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg p-0 flex items-center justify-center cursor-pointer"
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
