import {
  Award,
  Building2,
  CalendarCheck2,
  GraduationCap,
  LayoutDashboard,
  LayoutPanelTop,
  ListChecks,
  MessagesSquare,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { APP_ROUTES } from '@/constants/app-routes'
import type { MenuPermKey, SessionUser } from '@/schemas/auth'
import { canReadMenu } from '@/utils/permissions'

export interface NavChildItemConfig {
  id: string
  titleKey: string
  href: string
  icon?: LucideIcon
  menuPermKey?: MenuPermKey
}

export interface NavItemConfig {
  id: string
  titleKey: string
  href?: string
  icon: LucideIcon
  menuPermKey?: MenuPermKey
  badgeCount?: number
  adminOnly?: boolean
  children?: NavChildItemConfig[]
}

export interface NavSectionConfig {
  id: string
  labelKey?: string
  items: NavItemConfig[]
}

/**
 * Grouped navigation sections (Hybrid layout):
 * - High-frequency operational screens stay 1-click under semantic section headers.
 * - Analytics sub-screens collapse under a parent group (auto-unwrapped when only 1 child is visible).
 * - Account & Admin tabs remain consolidated under `/account` (docs/DEVIATIONS.md §10 Q2).
 */
export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: 'overview',
    labelKey: 'nav.sections.overview',
    items: [
      {
        id: 'dashboard',
        titleKey: 'nav.dashboard',
        href: APP_ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        menuPermKey: 'dashboard',
      },
      {
        id: 'dashboard-dept',
        titleKey: 'nav.dashboardDept',
        href: APP_ROUTES.DASHBOARD_DEPT,
        icon: Building2,
        menuPermKey: 'dash_dept',
      },
    ],
  },
  {
    id: 'workspace',
    labelKey: 'nav.sections.workspace',
    items: [
      {
        id: 'tasks',
        titleKey: 'nav.tasks',
        href: APP_ROUTES.TASKS,
        icon: ListChecks,
        menuPermKey: 'list',
      },
      {
        id: 'todo',
        titleKey: 'nav.todo',
        href: APP_ROUTES.TODO,
        icon: CalendarCheck2,
        menuPermKey: 'todo',
      },
      {
        id: 'messages',
        titleKey: 'nav.messages',
        href: APP_ROUTES.MESSAGES,
        icon: MessagesSquare,
        menuPermKey: 'messages',
      },
      {
        id: 'lessons',
        titleKey: 'nav.lessons',
        href: APP_ROUTES.LESSONS,
        icon: GraduationCap,
        menuPermKey: 'learnknow',
      },
    ],
  },
  {
    id: 'analytics-system',
    labelKey: 'nav.sections.analyticsSystem',
    items: [
      {
        id: 'kpi-group',
        titleKey: 'nav.kpiGroup',
        icon: Award,
        children: [
          {
            id: 'kpi',
            titleKey: 'nav.kpi',
            href: APP_ROUTES.KPI,
            icon: Award,
            menuPermKey: 'kpi_people',
          },
          {
            id: 'kpi-brief',
            titleKey: 'nav.kpiBrief',
            href: APP_ROUTES.KPI_BRIEF,
            icon: LayoutPanelTop,
            menuPermKey: 'kpi_brief',
          },
        ],
      },
      {
        id: 'account',
        titleKey: 'nav.account',
        href: APP_ROUTES.ACCOUNT,
        icon: UserCog,
      },
    ],
  },
]

export const MAIN_NAV_ITEMS: NavItemConfig[] = NAV_SECTIONS.flatMap((section) => section.items)

export const ADMIN_NAV_ITEMS: NavItemConfig[] = []

export type FlattenedNavTarget = {
  id: string
  titleKey: string
  href: string
  menuPermKey?: MenuPermKey
}

export function flattenNavTargets(items: NavItemConfig[]): FlattenedNavTarget[] {
  const targets: FlattenedNavTarget[] = []
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        targets.push({
          id: child.id,
          titleKey: child.titleKey,
          href: child.href,
          menuPermKey: child.menuPermKey,
        })
      }
    } else if (item.href) {
      targets.push({
        id: item.id,
        titleKey: item.titleKey,
        href: item.href,
        menuPermKey: item.menuPermKey,
      })
    }
  }
  return targets
}

/**
 * Resolves the first readable landing route for the signed-in user.
 * Prevents 403 redirect loops when a user lacks read permission on `/tasks`.
 */
export function getDefaultLandingRoute(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
): string {
  if (!user) return APP_ROUTES.TASKS
  const readable = flattenNavTargets(MAIN_NAV_ITEMS).find(
    (item) => !item.menuPermKey || canReadMenu(user, item.menuPermKey),
  )
  return readable?.href ?? APP_ROUTES.PROFILE
}
