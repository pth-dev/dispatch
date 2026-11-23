import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CircleAlert, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LessonRuleBadge } from '@/components/ui/lesson-marquee-banner'
import { StatusText } from '@/components/ui/status-text'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils'
import {
  EMPTY_DISPLAY_VALUE,
  type TaskCardDueTone,
  type TaskCardViewModel,
} from '../utils/task-card-mapper'

export type TaskMobileRowProps = {
  vm: TaskCardViewModel
}

const DUE_TONE_CLASS: Record<TaskCardDueTone, string> = {
  default: 'text-muted-foreground',
  warning: 'text-warning font-medium',
  destructive: 'text-destructive font-medium',
}

export function TaskMobileRow({ vm }: TaskMobileRowProps) {
  const { t } = useTranslation()
  const detailPath = APP_ROUTES.TASK_DETAIL(vm.id)
  const reportPath = `${detailPath}#report`
  const hasDue = vm.dueShortAt !== EMPTY_DISPLAY_VALUE
  const hasAssignee = vm.assigneeShortDisplay !== EMPTY_DISPLAY_VALUE
  const hasLessons = Boolean(vm.lessonHits && vm.lessonHits.length > 0)

  return (
    <article
      data-testid="task-mobile-row"
      className="relative bg-card px-4 py-3.5 transition-colors active:bg-secondary/50 focus-within:bg-secondary/30"
    >
      {/* 1. Meta row: code, site, urgent marker, status */}
      <div className="flex items-center justify-between gap-2 text-xs leading-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0 font-semibold text-primary">{vm.code}</span>
          {vm.site !== EMPTY_DISPLAY_VALUE && (
            <>
              <span className="shrink-0 text-muted-foreground" aria-hidden="true">
                •
              </span>
              <span className="min-w-0 truncate text-muted-foreground">{vm.site}</span>
            </>
          )}
          {vm.isUrgent && (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-medium text-destructive">
              <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{t('status.urgent')}</span>
            </span>
          )}
        </div>

        <StatusText
          status={vm.needsReportToday && vm.status !== 'delayed_pending' ? 'paused' : vm.status}
          label={
            vm.needsReportToday && vm.status !== 'delayed_pending'
              ? t('status.due_today')
              : undefined
          }
          className="shrink-0"
        />
      </div>

      {/* 2. Title row (auto 1–2 lines, relaxed line-height for CJK + Vietnamese, stretched-link to detail) */}
      <h4 className="mt-1.5">
        <Link
          to={detailPath}
          className="block line-clamp-2 wrap-anywhere text-sm font-semibold leading-normal text-foreground after:absolute after:inset-0 focus-visible:outline-none focus-visible:underline"
        >
          {vm.title}
        </Link>
      </h4>

      {/* 3. Summary & quick report row (fixed-width due + % columns keep progress vertically aligned) */}
      <div className="mt-2.5 flex items-center gap-2.5 text-xs">
        <span
          title={hasDue ? vm.dueAt : undefined}
          className={cn(
            'inline-flex w-14 shrink-0 items-center gap-1 tabular-nums',
            hasDue ? DUE_TONE_CLASS[vm.dueTone] : 'text-muted-foreground/60',
          )}
        >
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{vm.dueShortAt}</span>
        </span>

        <span
          className={cn(
            'w-9 shrink-0 text-right tabular-nums font-semibold',
            vm.progressPercent >= 100
              ? 'text-success'
              : vm.progressPercent > 0
                ? 'text-foreground'
                : 'text-muted-foreground',
          )}
        >
          {vm.progressPercent}%
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-muted-foreground">
          {hasAssignee && (
            <span className="inline-flex min-w-0 items-center gap-1" title={vm.assigneeDisplay}>
              <UserCheck className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{vm.assigneeShortDisplay}</span>
            </span>
          )}

          {hasLessons && vm.lessonHits && (
            <span className="relative z-10 shrink-0">
              <LessonRuleBadge hits={vm.lessonHits} />
            </span>
          )}
        </div>

        {vm.needsReportToday && (
          <Button
            asChild
            size="sm"
            className="relative z-10 h-8 shrink-0 rounded-md px-2.5 text-xs font-medium before:absolute before:-inset-1.5 before:content-['']"
          >
            <Link to={reportPath}>{t('tasks.mobile.report')}</Link>
          </Button>
        )}
      </div>
    </article>
  )
}
