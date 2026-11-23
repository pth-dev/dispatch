import { Link, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { canReadMenu, canShowMenu, isSuperLike } from '@/utils/permissions'
import { Logo } from './Logo'
import { SidebarNavItem } from './SidebarNavItem'
import { APP_ROUTES } from '@/constants/app-routes'
import { MAIN_NAV_ITEMS, ADMIN_NAV_ITEMS, type NavItemConfig } from '@/app/nav-config'
import { useAppStore } from '@/app/store'
import { TooltipProvider } from '@/components/ui/tooltip'

type SidebarProps = {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const user = useAppStore((state) => state.user)
  const isAdmin = Boolean(user && (user.role === 'admin' || isSuperLike(user)))

  const isItemActive = (href: string) => {
    if (href === APP_ROUTES.TASKS) {
      return location.pathname === href || location.pathname.startsWith(`${href}/`)
    }
    return location.pathname === href
  }

  const renderItem = (item: NavItemConfig) => {
    if (item.menuPermKey && !canShowMenu(user, item.menuPermKey)) {
      return null
    }
    const readable = !item.menuPermKey || canReadMenu(user, item.menuPermKey)
    return (
      <SidebarNavItem
        key={item.id}
        item={item}
        readable={readable}
        active={readable && isItemActive(item.href)}
        onNavigate={onNavigate}
      />
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
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <Link to={APP_ROUTES.HOME} onClick={onNavigate} className="flex items-center">
            <Logo size={36} />
          </Link>
        </div>

        <div
          className="flex-1 overflow-y-auto py-2"
          style={{ scrollbarGutter: 'stable' }}
        >
          <nav aria-label={t('sidebar.menuTitle')} className="flex flex-col space-y-0.5">
            {MAIN_NAV_ITEMS.map(renderItem)}

            {isAdmin && ADMIN_NAV_ITEMS.length > 0 && (
              <>
                <div className="pt-4 pb-1 px-3">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {t('nav.admin')}
                  </span>
                </div>
                {ADMIN_NAV_ITEMS.map(renderItem)}
              </>
            )}
          </nav>
        </div>

        <div className="shrink-0 border-t border-border p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">{t('app.version')}</span>
            <span
              role="img"
              aria-label={t('sidebar.connected')}
              className="inline-block size-2 rounded-full bg-success"
              title={t('sidebar.connected')}
            />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
