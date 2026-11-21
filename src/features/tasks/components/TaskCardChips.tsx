import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  FolderKanban,
  GitBranch,
  Lock,
  MapPin,
  Repeat,
  Users,
} from 'lucide-react'
import type { RawTask } from '@/schemas/task'
import {
  isRecurringTask,
  isRecurNeedsReportToday,
  parseSites,
  parseSplitMembers,
} from '@/utils/task-domain'
import { getWorkItemsSummary } from '../utils/task-display'

type TaskCardChipsProps = {
  task: RawTask
}

const CHIP_CLASS =
  'inline-flex items-center gap-1 rounded border border-border bg-secondary/60 px-1.5 py-0.5 text-xs text-muted-foreground'

const SECRECY_LABEL_KEYS: Record<1 | 2 | 3, string> = {
  1: 'tasks.confidential.lv1',
  2: 'tasks.card.secrecyPrivate',
  3: 'tasks.card.secrecyTopSecret',
}

export function TaskCardChips({ task }: TaskCardChipsProps) {
  const { t } = useTranslation()
  const sites = parseSites(task.site)
  const recurring = isRecurringTask(task)
  const recurToday = isRecurNeedsReportToday(task)
  const workItems = getWorkItemsSummary(task)
  const splitMembers = task.split_group ? parseSplitMembers(task.split_members) : []
  const secrecyKey = task.confidential !== 0 ? SECRECY_LABEL_KEYS[task.confidential] : null

  const hasAnyChip =
    sites.length > 0 ||
    secrecyKey !== null ||
    recurring ||
    task.cross_dept === 1 ||
    Boolean(task.split_group) ||
    workItems !== null

  if (!hasAnyChip) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sites.map((site) => (
        <span key={site} className={CHIP_CLASS}>
          <MapPin className="size-3 shrink-0" aria-hidden="true" />
          <span>{site}</span>
        </span>
      ))}

      {secrecyKey && (
        <span className="inline-flex items-center gap-1 rounded border border-border bg-secondary/60 px-1.5 py-0.5 text-xs font-medium text-warning">
          <Lock className="size-3 shrink-0" aria-hidden="true" />
          <span>{t(secrecyKey)}</span>
        </span>
      )}

      {recurring && (
        <span className={CHIP_CLASS}>
          <Repeat className="size-3 shrink-0 text-primary" aria-hidden="true" />
          <span>{t('tasks.filter.flagRecurring')}</span>
        </span>
      )}

      {recurToday && (
        <span className="inline-flex items-center gap-1 rounded border border-border bg-secondary/60 px-1.5 py-0.5 text-xs font-semibold text-status-urgent">
          <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
          <span>{t('tasks.filter.flagRecurToday')}</span>
        </span>
      )}

      {task.cross_dept === 1 && (
        <span className={CHIP_CLASS}>
          <Users className="size-3 shrink-0" aria-hidden="true" />
          <span>{t('tasks.filter.flagCross')}</span>
        </span>
      )}

      {task.split_group && (
        <span className={CHIP_CLASS}>
          <GitBranch className="size-3 shrink-0" aria-hidden="true" />
          <span>
            {splitMembers.length > 0
              ? t('tasks.card.splitGroupCount', { count: splitMembers.length })
              : t('tasks.card.splitGroup')}
          </span>
        </span>
      )}

      {workItems && (
        <span className={CHIP_CLASS}>
          <FolderKanban className="size-3 shrink-0" aria-hidden="true" />
          <span>{t('tasks.card.workItemsCount', { count: workItems.count })}</span>
        </span>
      )}
    </div>
  )
}
