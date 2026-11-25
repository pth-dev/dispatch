import * as React from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { APP_ROUTES } from '@/constants/app-routes'
import type { RawTask } from '@/schemas/task'
import { cn } from '@/utils/cn'
import type { FlowTrendPoint, OverdueAgingBucket } from '../utils/dashboard-charts'
import type { DashboardPeriod, PeriodFlowStats, Response1hStats } from '../utils/dashboard-domain'

export type DashboardModalState =
  | { type: 'period'; initialTab: 'created' | 'completed' }
  | { type: 'my_pending' }
  | { type: 'response_1h' }
  | { type: 'trend_bucket'; point: FlowTrendPoint }
  | { type: 'aging_bucket'; bucket: OverdueAgingBucket }
  | null

interface DashboardDrilldownModalsProps {
  modalState: DashboardModalState
  onClose: () => void
  period: DashboardPeriod
  periodFlow: PeriodFlowStats
  myPendingTasks: readonly RawTask[]
  response1h: Response1hStats
}

function ModalTaskRow({ task, trailing }: { task: RawTask; trailing?: React.ReactNode }) {
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
      {trailing ?? (
        <Badge variant="outline" className="shrink-0 tabular-nums">
          {task.progress}%
        </Badge>
      )}
    </Link>
  )
}

function FlowPairModalBody({
  createdTasks,
  completedTasks,
  initialTab,
}: {
  createdTasks: readonly RawTask[]
  completedTasks: readonly RawTask[]
  initialTab: 'created' | 'completed'
}) {
  const { t } = useTranslation()
  const [tab, setTab] = React.useState<'created' | 'completed'>(initialTab)
  const list = tab === 'created' ? createdTasks : completedTasks

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['created', 'completed'] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'min-h-11 lg:min-h-8 rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              tab === key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary/70',
            )}
          >
            {t(`dashboard.modals.period.${key}`)} (
            {key === 'created' ? createdTasks.length : completedTasks.length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          {t('dashboard.modals.empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((task) => (
            <ModalTaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

function Response1hModalBody({ stats }: { stats: Response1hStats }) {
  const { t } = useTranslation()
  const groups: ReadonlyArray<{
    id: string
    label: string
    toneClass: string
    tasks: readonly RawTask[]
  }> = [
    { id: 'fail', label: t('dashboard.modals.response1h.fail'), toneClass: 'text-destructive', tasks: stats.failTasks },
    { id: 'none', label: t('dashboard.modals.response1h.none'), toneClass: 'text-muted-foreground', tasks: stats.noResponseTasks },
    { id: 'pass', label: t('dashboard.modals.response1h.pass'), toneClass: 'text-success', tasks: stats.passTasks },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col justify-between gap-1 rounded-lg border border-border bg-secondary/40 p-2.5">
          <p className="text-lg font-semibold text-success tabular-nums">{stats.passTasks.length}</p>
          <p className="text-[11px] text-muted-foreground">{t('dashboard.modals.response1h.pass')}</p>
        </div>
        <div className="flex flex-col justify-between gap-1 rounded-lg border border-border bg-secondary/40 p-2.5">
          <p className="text-lg font-semibold text-destructive tabular-nums">{stats.failTasks.length}</p>
          <p className="text-[11px] text-muted-foreground">{t('dashboard.modals.response1h.fail')}</p>
        </div>
        <div className="flex flex-col justify-between gap-1 rounded-lg border border-border bg-secondary/40 p-2.5">
          <p className="text-lg font-semibold text-foreground tabular-nums">{stats.noResponseTasks.length}</p>
          <p className="text-[11px] text-muted-foreground">{t('dashboard.modals.response1h.none')}</p>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <h3 className={cn('text-xs font-semibold', group.toneClass)}>
            {group.label} ({group.tasks.length})
          </h3>
          {group.tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('dashboard.modals.empty')}</p>
          ) : (
            <div className="space-y-1.5">
              {group.tasks.map((task) => (
                <ModalTaskRow
                  key={task.id}
                  task={task}
                  trailing={
                    task.first_response_mins != null ? (
                      <Badge variant="outline" className="shrink-0 tabular-nums">
                        {t('dashboard.modals.response1h.mins', {
                          mins: Math.round(Number(task.first_response_mins)),
                        })}
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function DashboardDrilldownModals({
  modalState,
  onClose,
  period,
  periodFlow,
  myPendingTasks,
  response1h,
}: DashboardDrilldownModalsProps) {
  const { t } = useTranslation()

  let title = ''
  if (modalState?.type === 'period') {
    title = t('dashboard.modals.period.title', {
      start: periodFlow.range.startDateStr,
      end: periodFlow.range.endDateStr,
    })
  } else if (modalState?.type === 'my_pending') {
    title = t('dashboard.modals.myPending.title', { count: myPendingTasks.length })
  } else if (modalState?.type === 'response_1h') {
    title = t('dashboard.modals.response1h.titleWithPeriod', {
      period: t(`dashboard.period.${period}`),
    })
  } else if (modalState?.type === 'trend_bucket') {
    title = t('dashboard.modals.period.title', {
      start: modalState.point.startDateStr,
      end: modalState.point.endDateStr,
    })
  } else if (modalState?.type === 'aging_bucket') {
    title = t('dashboard.modals.aging.title', {
      bucket: t(`dashboard.aging.buckets.${modalState.bucket.key}`),
      count: modalState.bucket.count,
    })
  }

  return (
    <ResponsiveModal
      open={modalState !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={title}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {modalState?.type === 'my_pending' && (
            <Button asChild variant="outline" onClick={onClose}>
              <Link to={APP_ROUTES.TODO}>{t('dashboard.today.openTodo')}</Link>
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      {modalState?.type === 'period' && (
        <FlowPairModalBody
          key={`period-${modalState.initialTab}`}
          createdTasks={periodFlow.createdTasks}
          completedTasks={periodFlow.completedTasks}
          initialTab={modalState.initialTab}
        />
      )}
      {modalState?.type === 'trend_bucket' && (
        <FlowPairModalBody
          key={`trend-${modalState.point.key}`}
          createdTasks={modalState.point.createdTasks}
          completedTasks={modalState.point.completedTasks}
          initialTab="created"
        />
      )}
      {modalState?.type === 'aging_bucket' &&
        (modalState.bucket.tasks.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {t('dashboard.modals.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {modalState.bucket.tasks.map((task) => (
              <ModalTaskRow key={task.id} task={task} />
            ))}
          </div>
        ))}
      {modalState?.type === 'response_1h' && <Response1hModalBody stats={response1h} />}
      {modalState?.type === 'my_pending' &&
        (myPendingTasks.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {t('dashboard.modals.myPending.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {myPendingTasks.map((task) => (
              <ModalTaskRow key={task.id} task={task} />
            ))}
          </div>
        ))}
    </ResponsiveModal>
  )
}
