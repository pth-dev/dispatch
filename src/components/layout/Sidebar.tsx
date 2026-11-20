import { Link, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { canReadMenu, canShowMenu, isSuperLike } from '@/utils/permissions'
import { Logo } from './Logo'
import { MAIN_NAV_ITEMS, ADMIN_NAV_ITEMS, type NavItemConfig } from '@/app/nav-config'
import { useAppStore } from '@/app/store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const user = useAppStore((state) => state.user)
  const isAdmin = Boolean(user && (user.role === 'admin' || isSuperLike(user)))

  const isItemActive = (href: string) => {
    if (href === '/tasks') {
      return location.pathname.startsWith('/tasks')
    }
    return location.pathname === href
  }

  const renderNavItem = (item: NavItemConfig) => {
    if (item.menuPermKey && !canShowMenu(user, item.menuPermKey)) {
      return null
    }
    const readable = !item.menuPermKey || canReadMenu(user, item.menuPermKey)
    const Icon = item.icon
    const active = readable && isItemActive(item.href)
    const title = t(item.titleKey)

    return (
      <Tooltip key={item.id} delayDuration={400}>
        <TooltipTrigger asChild>
          {readable ? (
            <Link
              to={item.href}
              onClick={onNavigate}
              data-active={active}
              className={cn(
                'group relative flex min-h-[44px] items-center gap-3 px-3 py-1.5 rounded-none text-sm font-medium transition-colors select-none outline-none',
                'hover:bg-secondary hover:text-foreground',
                'focus-visible:ring-1 focus-visible:ring-primary',
                active
                  ? 'bg-primary-soft text-primary shadow-[inset_3px_0_0_var(--color-primary)]'
                  : 'text-foreground',
              )}
            >
              <Icon
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
            <span
              aria-disabled="true"
              className="flex min-h-[44px] items-center gap-3 px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed select-none"
            >
              <Icon className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1 line-clamp-2 leading-tight">{title}</span>
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {title}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex h-full w-[260px] flex-col border-r border-border bg-card select-none',
          className,
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <Link to="/" onClick={onNavigate} className="flex items-center">
            <Logo size={36} />
          </Link>
        </div>

        {/* Sidebar Navigation Links */}
        <div
          className="flex-1 overflow-y-auto py-2"
          style={{ scrollbarGutter: 'stable' }}
        >
          <nav className="flex flex-col space-y-0.5">
            {MAIN_NAV_ITEMS.map(renderNavItem)}

            {isAdmin && ADMIN_NAV_ITEMS.length > 0 && (
              <>
                <div className="pt-4 pb-1 px-3">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {t('nav.admin')}
                  </span>
                </div>
                {ADMIN_NAV_ITEMS.map(renderNavItem)}
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="shrink-0 border-t border-border p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">{t('app.version')}</span>
            <span
              className="inline-block size-2 rounded-full bg-success"
              title={t('sidebar.connected')}
            />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
