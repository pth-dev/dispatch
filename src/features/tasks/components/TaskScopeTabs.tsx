import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'
import type { TaskScopeCounts } from '@/schemas/task'

type TaskScope = 'mine' | 'created' | 'all'

type TaskScopeTabsProps = {
  activeScope: TaskScope
  counts?: TaskScopeCounts
  onScopeChange: (scope: TaskScope) => void
  className?: string
}

const SCOPE_TABS: ReadonlyArray<{ key: TaskScope; labelKey: string }> = [
  { key: 'mine', labelKey: 'tasks.scope.mine' },
  { key: 'created', labelKey: 'tasks.scope.created' },
  { key: 'all', labelKey: 'tasks.scope.all' },
]

export function TaskScopeTabs({
  activeScope,
  counts,
  onScopeChange,
  className,
}: TaskScopeTabsProps) {
  const { t } = useTranslation()
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx: number | null = null
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % SCOPE_TABS.length
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + SCOPE_TABS.length) % SCOPE_TABS.length
    else if (e.key === 'Home') nextIdx = 0
    else if (e.key === 'End') nextIdx = SCOPE_TABS.length - 1

    if (nextIdx !== null) {
      e.preventDefault()
      const nextTab = SCOPE_TABS[nextIdx]
      if (nextTab) {
        onScopeChange(nextTab.key)
        tabRefs.current[nextIdx]?.focus()
      }
    }
  }

  return (
    <div
      role="tablist"
      aria-label={t('tasks.scope.ariaLabel')}
      className={cn(
        'flex items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-border',
        className,
      )}
    >
      {SCOPE_TABS.map((tab, idx) => {
        const isActive = activeScope === tab.key
        const count = counts ? counts[tab.key] : undefined

        return (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[idx] = el
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onScopeChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'group relative flex shrink-0 items-center gap-2 py-3 text-sm font-medium transition-colors select-none cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}
