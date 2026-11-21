import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Languages, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusText } from '@/components/ui/status-text'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils'
import { useTitleTruncation } from '../hooks/use-title-truncation'
import type { TaskCardViewModel } from '../utils/task-card-mapper'
import { TaskCardFullTitleAction } from './TaskCardFullTitleAction'
import { TaskCardInfoBlock } from './TaskCardInfoBlock'

export type TaskCardProps = {
  vm: TaskCardViewModel
}

export function TaskCard({ vm }: TaskCardProps) {
  const { t } = useTranslation()
  const { ref: titleRef, isTruncated } = useTitleTruncation(vm.title)
  const detailPath = APP_ROUTES.TASK_DETAIL(vm.id)
  const actionPath = vm.needsReportToday ? `${detailPath}#report` : detailPath

  return (
    <article data-testid="task-card" className="h-full">
      <Card className="relative h-full p-4 gap-3 focus-within:ring-2 focus-within:ring-ring">
        {/* 1. Meta row (1 line) */}
        <div className="flex h-card-row items-center justify-between gap-2 text-xs">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="shrink-0 font-medium text-primary">{vm.code}</span>
            <span className="shrink-0 text-muted-foreground" aria-hidden="true">
              •
            </span>
            <span className="min-w-0 truncate text-muted-foreground">{vm.site}</span>
            {vm.isUrgent && (
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-destructive">
                <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                <span>{t('status.urgent')}</span>
              </span>
            )}
          </div>
          <StatusText
            status={
              vm.needsReportToday && vm.status !== 'delayed_pending' ? 'paused' : vm.status
            }
            label={
              vm.needsReportToday && vm.status !== 'delayed_pending'
                ? t('status.due_today')
                : undefined
            }
            className="shrink-0"
          />
        </div>

        {/* 2. Title (2 lines reserved, stretched-link) */}
        <h3 className="m-0">
          <Link
            ref={titleRef}
            to={detailPath}
            className="block h-card-title line-clamp-2 wrap-anywhere text-base font-semibold text-foreground after:absolute after:inset-0 focus-visible:outline-none"
          >
            {vm.title}
          </Link>
        </h3>

        {/* 3. Sub row (1 line reserved) */}
        <div className="flex h-card-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Tag className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{vm.category}</span>
            </span>
            {vm.isUntranslated && (
              <span className="inline-flex shrink-0 items-center gap-1">
                <Languages className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span>{t('tasks.card.untranslated')}</span>
              </span>
            )}
          </div>
          {isTruncated && <TaskCardFullTitleAction vm={vm} />}
        </div>

        {/* 4. Info block (4 fixed rows) */}
        <TaskCardInfoBlock vm={vm} />

        {/* 5. Progress row (4px bar + percentage) */}
        <div className="flex h-card-row items-center gap-2.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
            <div
              className={cn(
                'h-full rounded-full',
                vm.progressPercent >= 100 ? 'bg-success' : 'bg-primary',
              )}
              style={{ width: `${vm.progressPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-foreground tabular-nums">
            {vm.progressPercent}%
          </span>
        </div>

        {/* 6. Action row (44px, pinned at bottom, above stretched-link) */}
        <div className="mt-auto">
          <Button
            asChild
            variant={vm.needsReportToday ? 'default' : 'outline'}
            className="relative z-10 h-11 w-full text-sm font-medium"
          >
            <Link to={actionPath}>
              {vm.needsReportToday ? t('tasks.card.reportNow') : t('tasks.card.viewDetail')}
            </Link>
          </Button>
        </div>
      </Card>
    </article>
  )
}
