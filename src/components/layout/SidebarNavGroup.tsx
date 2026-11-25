import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { NavChildItemConfig, NavItemConfig } from '@/app/nav-config'
import { useAppStore } from '@/app/store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SidebarNavItem } from './SidebarNavItem'

export type ResolvedNavChild = {
  child: NavChildItemConfig
  readable: boolean
  active: boolean
}

type SidebarNavGroupProps = {
  item: NavItemConfig
  visibleChildren: ResolvedNavChild[]
  onNavigate?: () => void
}

export function SidebarNavGroup({ item, visibleChildren, onNavigate }: SidebarNavGroupProps) {
  const { t } = useTranslation()
  const storedExpanded = useAppStore((state) => state.navGroupExpanded[item.id])
  const setNavGroupExpanded = useAppStore((state) => state.setNavGroupExpanded)

  if (visibleChildren.length === 0) return null

  // Auto-unwrap when permission filtering leaves only a single visible child.
  if (visibleChildren.length === 1) {
    const only = visibleChildren[0]
    if (!only) return null
    return (
      <SidebarNavItem
        item={{
          id: only.child.id,
          titleKey: only.child.titleKey,
          href: only.child.href,
          icon: only.child.icon ?? item.icon,
        }}
        readable={only.readable}
        active={only.active}
        onNavigate={onNavigate}
      />
    )
  }

  const hasActiveChild = visibleChildren.some((entry) => entry.active)
  const isExpanded = storedExpanded ?? hasActiveChild
  const Icon = item.icon
  const title = t(item.titleKey)
  const listId = `sidebar-group-${item.id}`

  return (
    <div>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? listId : undefined}
            onClick={() => setNavGroupExpanded(item.id, !isExpanded)}
            className={cn(
              'group flex w-full min-h-11 items-center gap-3 px-3 py-1.5 text-left text-sm font-medium transition-colors select-none outline-none',
              'hover:bg-secondary hover:text-foreground',
              'focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary',
              hasActiveChild && !isExpanded ? 'bg-primary-soft text-primary' : 'text-foreground',
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                'size-5 shrink-0 transition-colors',
                hasActiveChild
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            <span className="flex-1 line-clamp-2 leading-tight">{title}</span>
            {isExpanded ? (
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {title}
        </TooltipContent>
      </Tooltip>

      {isExpanded && (
        <div id={listId} className="flex flex-col space-y-0.5">
          {visibleChildren.map((entry) => (
            <SidebarNavItem
              key={entry.child.id}
              item={entry.child}
              readable={entry.readable}
              active={entry.active}
              indented
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
