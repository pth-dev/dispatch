import { useTranslation } from 'react-i18next'
import { FilePlus2, FolderKanban, History, Wrench, Zap } from 'lucide-react'
import { cn } from '@/utils/cn'

export type TaskCreateVariant = 'full' | 'quick' | 'project' | 'daily' | 'clone'

interface TaskCreateModeBarProps {
  activeVariant: TaskCreateVariant
  showDailyRepair: boolean
  onSelectFull: () => void
  onSelectQuick: () => void
  onSelectProject: () => void
  onOpenHistoryPicker: () => void
  onSelectDailyRepair: () => void
}

export function TaskCreateModeBar({
  activeVariant,
  showDailyRepair,
  onSelectFull,
  onSelectQuick,
  onSelectProject,
  onOpenHistoryPicker,
  onSelectDailyRepair,
}: TaskCreateModeBarProps) {
  const { t } = useTranslation()

  const buttonClass = (active: boolean) =>
    cn(
      'inline-flex h-11 lg:h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    )

  return (
    <div
      role="toolbar"
      aria-label={t('tasks.createModes.label')}
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl sm:rounded-full border border-border bg-card p-1"
    >
      <button
        type="button"
        aria-pressed={activeVariant === 'full'}
        onClick={onSelectFull}
        className={buttonClass(activeVariant === 'full')}
      >
        <FilePlus2 className="size-3.5" aria-hidden="true" />
        <span>{t('tasks.createModes.full')}</span>
      </button>

      <button
        type="button"
        aria-pressed={activeVariant === 'quick'}
        onClick={onSelectQuick}
        className={buttonClass(activeVariant === 'quick')}
      >
        <Zap className="size-3.5" aria-hidden="true" />
        <span>{t('tasks.createModes.quick')}</span>
      </button>

      <button
        type="button"
        aria-pressed={activeVariant === 'project'}
        onClick={onSelectProject}
        className={buttonClass(activeVariant === 'project')}
      >
        <FolderKanban className="size-3.5" aria-hidden="true" />
        <span>{t('tasks.createModes.project')}</span>
      </button>

      <button
        type="button"
        aria-pressed={activeVariant === 'clone'}
        aria-haspopup="dialog"
        onClick={onOpenHistoryPicker}
        className={buttonClass(activeVariant === 'clone')}
      >
        <History className="size-3.5" aria-hidden="true" />
        <span>{t('tasks.createModes.fromHistory')}</span>
      </button>

      {showDailyRepair && (
        <button
          type="button"
          aria-pressed={activeVariant === 'daily'}
          onClick={onSelectDailyRepair}
          className={buttonClass(activeVariant === 'daily')}
        >
          <Wrench className="size-3.5" aria-hidden="true" />
          <span>{t('tasks.createModes.dailyRepair')}</span>
        </button>
      )}
    </div>
  )
}
