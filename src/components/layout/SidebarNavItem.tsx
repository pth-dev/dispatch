import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type SidebarNavLeaf = {
  id: string
  titleKey: string
  href: string
  icon?: LucideIcon
  badgeCount?: number
}

type SidebarNavItemProps = {
  item: SidebarNavLeaf
  readable: boolean
  active: boolean
  indented?: boolean
  onNavigate?: () => void
}

export function SidebarNavItem({
  item,
  readable,
  active,
  indented = false,
  onNavigate,
}: SidebarNavItemProps) {
  const { t } = useTranslation()
  const Icon = item.icon
  const title = t(item.titleKey)

  const leadingVisual = indented ? (
    <span
      aria-hidden="true"
      className={cn(
        'size-1.5 shrink-0 rounded-full transition-colors',
        !readable
          ? 'bg-muted-foreground/40'
          : active
            ? 'bg-secondary-accent'
            : 'bg-muted-foreground/50 group-hover:bg-foreground',
      )}
    />
  ) : (
    Icon && (
      <Icon
        aria-hidden="true"
        className={cn(
          'size-5 shrink-0 transition-colors',
          !readable
            ? 'text-muted-foreground'
            : active
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
    )
  )

  const layoutClasses = indented ? 'min-h-10 pl-9 pr-3 py-1.5' : 'min-h-11 px-3 py-1.5'

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
              'group relative flex items-center gap-3 rounded-none text-sm font-medium transition-colors select-none outline-none',
              'hover:bg-secondary hover:text-foreground',
              'focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary',
              layoutClasses,
              active
                ? 'bg-primary-soft text-primary shadow-[inset_3px_0_0_var(--color-primary)]'
                : 'text-foreground',
            )}
          >
            {leadingVisual}
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
            className={cn(
              'flex w-full items-center gap-3 text-left text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed select-none',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
              layoutClasses,
            )}
          >
            {leadingVisual}
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
