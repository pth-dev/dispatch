import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import type { NavItemConfig } from '@/app/nav-config'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type SidebarNavItemProps = {
  item: NavItemConfig
  readable: boolean
  active: boolean
  onNavigate?: () => void
}

export function SidebarNavItem({
  item,
  readable,
  active,
  onNavigate,
}: SidebarNavItemProps) {
  const { t } = useTranslation()
  const Icon = item.icon
  const title = t(item.titleKey)

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        {readable ? (
          <Link
            to={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            data-active={active}
            className={cn(
              'group relative flex min-h-11 items-center gap-3 px-3 py-1.5 rounded-none text-sm font-medium transition-colors select-none outline-none',
              'hover:bg-secondary hover:text-foreground',
              'focus-visible:ring-1 focus-visible:ring-primary',
              active
                ? 'bg-primary-soft text-primary shadow-[inset_3px_0_0_var(--color-primary)]'
                : 'text-foreground',
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                'size-5 shrink-0 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            <span className="flex-1 line-clamp-2 leading-tight">{title}</span>
            {typeof item.badgeCount === 'number' && (
              <span className="shrink-0 text-xs text-muted-foreground font-normal">
                {item.badgeCount}
              </span>
            )}
          </Link>
        ) : (
          <button
            type="button"
            aria-disabled="true"
            className="flex w-full min-h-11 items-center gap-3 px-3 py-1.5 text-left text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 line-clamp-2 leading-tight">{title}</span>
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {title}
      </TooltipContent>
    </Tooltip>
  )
}
