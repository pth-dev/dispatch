import { useTranslation } from 'react-i18next'
import type { NavItemConfig, NavSectionConfig } from '@/app/nav-config'
import { APP_ROUTES } from '@/constants/app-routes'
import type { SessionUser } from '@/schemas/auth'
import { canReadMenu, canShowMenu } from '@/utils/permissions'
import { SidebarNavGroup, type ResolvedNavChild } from './SidebarNavGroup'
import { SidebarNavItem } from './SidebarNavItem'

type SidebarNavSectionProps = {
  section: NavSectionConfig
  pathname: string
  user: SessionUser | null
  onNavigate?: () => void
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === APP_ROUTES.TASKS) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  return pathname === href
}

function renderNavItem(
  item: NavItemConfig,
  pathname: string,
  user: SessionUser | null,
  onNavigate?: () => void,
) {
  if (item.children && item.children.length > 0) {
    const visibleChildren: ResolvedNavChild[] = item.children
      .filter((child) => !child.menuPermKey || canShowMenu(user, child.menuPermKey))
      .map((child) => {
        const readable = !child.menuPermKey || canReadMenu(user, child.menuPermKey)
        return {
          child,
          readable,
          active: readable && isRouteActive(pathname, child.href),
        }
      })

    if (visibleChildren.length === 0) return null

    return (
      <SidebarNavGroup
        key={item.id}
        item={item}
        visibleChildren={visibleChildren}
        onNavigate={onNavigate}
      />
    )
  }

  if (!item.href) return null
  if (item.menuPermKey && !canShowMenu(user, item.menuPermKey)) return null

  const readable = !item.menuPermKey || canReadMenu(user, item.menuPermKey)
  return (
    <SidebarNavItem
      key={item.id}
      item={{
        id: item.id,
        titleKey: item.titleKey,
        href: item.href,
        icon: item.icon,
        badgeCount: item.badgeCount,
      }}
      readable={readable}
      active={readable && isRouteActive(pathname, item.href)}
      onNavigate={onNavigate}
    />
  )
}

export function SidebarNavSection({
  section,
  pathname,
  user,
  onNavigate,
}: SidebarNavSectionProps) {
  const { t } = useTranslation()
  const renderedItems = section.items
    .map((item) => renderNavItem(item, pathname, user, onNavigate))
    .filter(Boolean)

  if (renderedItems.length === 0) return null

  const headingId = section.labelKey ? `sidebar-section-${section.id}` : undefined

  return (
    <div role="group" aria-labelledby={headingId}>
      {section.labelKey && (
        <div className="px-3 pb-1">
          <span
            id={headingId}
            className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
          >
            {t(section.labelKey)}
          </span>
        </div>
      )}
      <div className="flex flex-col space-y-0.5">{renderedItems}</div>
    </div>
  )
}
