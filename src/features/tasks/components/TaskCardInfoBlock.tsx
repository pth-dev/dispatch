import { useTranslation } from 'react-i18next'
import { Building2, CalendarDays, Clock, Send, UserCheck } from 'lucide-react'
import { cn } from '@/utils'
import {
  EMPTY_DISPLAY_VALUE,
  type TaskCardDueTone,
  type TaskCardViewModel,
} from '../utils/task-card-mapper'

type TaskCardInfoBlockProps = {
  vm: TaskCardViewModel
}

const DUE_TONE_CLASS: Record<TaskCardDueTone, string> = {
  default: 'text-foreground',
  warning: 'text-warning font-medium',
  destructive: 'text-destructive font-medium',
}

type InfoRowProps = {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}

function InfoRow({ icon, label, value, valueClassName }: InfoRowProps) {
  return (
    <div className="flex h-card-row items-center justify-between gap-2 text-xs">
      <span className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </span>
      <span
        title={value !== EMPTY_DISPLAY_VALUE ? value : undefined}
        className={cn('min-w-0 truncate text-right text-foreground', valueClassName)}
      >
        {value}
      </span>
    </div>
  )
}

export function TaskCardInfoBlock({ vm }: TaskCardInfoBlockProps) {
  const { t } = useTranslation()

  return (
    <div className="border-t border-border pt-3 space-y-2.5">
      <InfoRow
        icon={<CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        label={t('tasks.card.dueAt')}
        value={vm.dueAt}
        valueClassName={DUE_TONE_CLASS[vm.dueTone]}
      />
      <InfoRow
        icon={<Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        label={t('tasks.card.lastReportAt')}
        value={vm.lastReportAt}
      />
      <InfoRow
        icon={<UserCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        label={t('tasks.card.assignee')}
        value={vm.assigneeDisplay}
      />
      <InfoRow
        icon={<Send className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        label={t('tasks.card.dispatcher')}
        value={vm.dispatcherDisplay}
      />
      <InfoRow
        icon={<Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        label={t('tasks.card.requester')}
        value={vm.requesterDisplay}
      />
    </div>
  )
}
