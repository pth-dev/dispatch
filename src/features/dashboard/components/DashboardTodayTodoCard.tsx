import * as React from 'react'
import { Link } from 'react-router'
import { CalendarCheck2, ListTodo } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { APP_ROUTES } from '@/constants/app-routes'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import type { TodayTodoGroupKey, TodayTodoGroups } from '../utils/dashboard-domain'

interface DashboardTodayTodoCardProps {
  groups: TodayTodoGroups
  isAdmin: boolean
  includeAll: boolean
  onToggleIncludeAll: () => void
}

const DEFAULT_VISIBLE = 6
const TAB_KEYS: readonly TodayTodoGroupKey[] = ['all', 'sched', 'recur', 'due', 'overdue']

function TodayTaskItem({ task }: { task: RawTask }) {
  return (
    <Link
      to={APP_ROUTES.TASK_DETAIL(task.id)}
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-xs transition-colors hover:border-primary/40 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          <span className="mr-1.5 font-semibold text-primary">#{task.id}</span>
          <span>{task.title}</span>
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {task.assign_person || '—'} · {task.due_date || '—'}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 tabular-nums">
        {task.progress}%
      </Badge>
    </Link>
  )
}

export function DashboardTodayTodoCard({
  groups,
  isAdmin,
  includeAll,
  onToggleIncludeAll,
}: DashboardTodayTodoCardProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = React.useState<TodayTodoGroupKey>('all')
  const [expanded, setExpanded] = React.useState(false)

  const countMap: Record<TodayTodoGroupKey, number> = {
    all: groups.allUnique.length,
    sched: groups.sched.length,
    recur: groups.recur.length,
    due: groups.due.length,
    overdue: groups.overdue.length,
  }

  const listMap: Record<TodayTodoGroupKey, RawTask[]> = {
    all: groups.allUnique,
    sched: groups.sched,
    recur: groups.recur,
    due: groups.due,
    overdue: groups.overdue,
  }

  const activeList = listMap[activeTab]
  const visibleItems = expanded ? activeList : activeList.slice(0, DEFAULT_VISIBLE)

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">
            {t('dashboard.today.title', { count: groups.allUnique.length })}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Button type="button" variant="outline" size="sm" onClick={onToggleIncludeAll}>
              {includeAll ? t('dashboard.today.scopeMineOnly') : t('dashboard.today.scopeAllVisible')}
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={APP_ROUTES.TODO}>
              <CalendarCheck2 className="size-3.5" aria-hidden="true" />
              <span>{t('dashboard.today.openTodo')}</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={activeTab === key}
            onClick={() => {
              setActiveTab(key)
              setExpanded(false)
            }}
            className={cn(
              'min-h-11 lg:min-h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeTab === key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary/70',
            )}
          >
            {t(`dashboard.today.tabs.${key}`)} ({countMap[key]})
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t('dashboard.today.empty')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {visibleItems.map((task) => (
            <TodayTaskItem key={task.id} task={task} />
          ))}
        </div>
      )}

      {activeList.length > DEFAULT_VISIBLE && (
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? t('dashboard.today.collapse')
              : t('dashboard.today.showMore', { count: activeList.length - DEFAULT_VISIBLE })}
          </Button>
        </div>
      )}
    </section>
  )
}
