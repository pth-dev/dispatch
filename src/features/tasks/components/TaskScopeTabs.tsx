import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'
import type { TaskScopeCounts } from '@/schemas/task'

interface TaskScopeTabsProps {
  activeScope: 'mine' | 'created' | 'all'
  counts?: TaskScopeCounts
  onScopeChange: (scope: 'mine' | 'created' | 'all') => void
  className?: string
}

export function TaskScopeTabs({
  activeScope,
  counts,
  onScopeChange,
  className,
}: TaskScopeTabsProps) {
  const { t } = useTranslation()

  const tabs: { key: 'mine' | 'created' | 'all'; labelKey: string }[] = [
    { key: 'mine', labelKey: 'tasks.scope.mine' },
    { key: 'created', labelKey: 'tasks.scope.created' },
    { key: 'all', labelKey: 'tasks.scope.all' },
  ]

  return (
    <div
      role="tablist"
      aria-label={t('tasks.scope.ariaLabel')}
      className={cn('flex items-center gap-6 border-b border-border', className)}
    >
      {tabs.map((tab) => {
        const isActive = activeScope === tab.key
        const count = counts ? counts[tab.key] : undefined

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onScopeChange(tab.key)}
            className={cn(
              'group relative flex items-center gap-2 py-3 text-sm font-medium transition-colors select-none outline-none cursor-pointer',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span>{t(tab.labelKey)}</span>
            {typeof count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80',
                )}
              >
                {count}
              </span>
            )}
            {/* Active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}
