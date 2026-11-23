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

export interface NavItemConfig {
  id: string
  titleKey: string
  href: string
  icon: LucideIcon
  menuPermKey?: MenuPermKey
  badgeCount?: number
  adminOnly?: boolean
  children?: {
    id: string
    titleKey: string
    href: string
  }[]
}

/**
 * Active navigation items (docs/DEVIATIONS.md §3 D8):
 * "Văn bản hệ thống" permanently removed;
 * Dashboard, Todo, SLA, Admin enabled incrementally per phase.
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
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
  {
    id: 'account',
    titleKey: 'nav.account',
    href: APP_ROUTES.ACCOUNT,
    icon: UserCog,
  },
]

export const ADMIN_NAV_ITEMS: NavItemConfig[] = []

/**
 * Resolves the first readable landing route for the signed-in user.
 * Prevents 403 redirect loops when a user lacks read permission on `/tasks`.
 */
export function getDefaultLandingRoute(
  user: Pick<SessionUser, 'username' | 'role' | 'menu_perms'> | null | undefined,
): string {
  if (!user) return APP_ROUTES.TASKS
  const readable = MAIN_NAV_ITEMS.find(
    (item) => !item.menuPermKey || canReadMenu(user, item.menuPermKey),
  )
  return readable?.href ?? APP_ROUTES.PROFILE
}
