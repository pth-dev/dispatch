import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { APP_ROUTES } from '@/constants/app-routes'
import { cn } from '@/utils'
import { summarizeSplitMembers } from '@/utils/task-domain'
import type { SplitMember } from '@/schemas/task'
import { useUserDisplayResolver } from '../hooks/use-user-display-resolver'

interface SplitGroupPanelProps {
  currentTaskId: number
  members: SplitMember[]
}

export function SplitGroupPanel({ currentTaskId, members }: SplitGroupPanelProps) {
  const { t } = useTranslation()
  const { resolveAssignees } = useUserDisplayResolver()
  if (members.length === 0) return null

  const summary = summarizeSplitMembers(members)

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{t('tasks.detail.splitGroupTitle')}</span>
        </h2>
        <span className="text-xs text-muted-foreground">
          {t('tasks.detail.splitGroupSummary', {
            done: summary.done,
            total: summary.total,
            avg: summary.avgProgress,
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {members.map((member) => {
          const isCurrent = member.id === currentTaskId
          return (
            <Link
              key={member.id}
              to={APP_ROUTES.TASK_DETAIL(member.id)}
              className={cn(
                'flex min-h-10 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors',
                isCurrent
                  ? 'border-primary bg-primary-soft text-primary font-medium'
                  : 'border-border bg-card text-foreground hover:bg-secondary',
              )}
            >
              <span className="truncate">
                #{member.id} • {resolveAssignees(member.assignee) || '-'}
              </span>
              <span className="shrink-0 font-semibold">
                {member.paused ? t('status.paused') : `${member.progress}%`}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
