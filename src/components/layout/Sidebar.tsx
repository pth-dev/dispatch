import { Link, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { isSuperLike } from '@/utils/permissions'
import { Logo } from './Logo'
import { SidebarNavSection } from './SidebarNavSection'
import { APP_ROUTES } from '@/constants/app-routes'
import { ADMIN_NAV_ITEMS, NAV_SECTIONS } from '@/app/nav-config'
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

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex h-full w-[var(--sidebar-width)] flex-col border-r border-border bg-card select-none',
          className,
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <Link to={APP_ROUTES.HOME} onClick={onNavigate} className="flex items-center">
            <Logo size={36} />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarGutter: 'stable' }}>
          <nav aria-label={t('sidebar.menuTitle')} className="flex flex-col space-y-3">
            {NAV_SECTIONS.map((section) => (
              <SidebarNavSection
                key={section.id}
                section={section}
                pathname={location.pathname}
                user={user}
                onNavigate={onNavigate}
              />
            ))}

            {isAdmin && ADMIN_NAV_ITEMS.length > 0 && (
              <SidebarNavSection
                section={{ id: 'admin', labelKey: 'nav.admin', items: ADMIN_NAV_ITEMS }}
                pathname={location.pathname}
                user={user}
                onNavigate={onNavigate}
              />
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
