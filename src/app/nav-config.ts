import { ListChecks, type LucideIcon } from 'lucide-react'
import { APP_ROUTES } from '@/constants/app-routes'
import type { MenuPermKey } from '@/schemas/auth'

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
 * v1 navigation scope (docs/DEVIATIONS.md §3 D8):
 * Task lifecycle only; "Văn bản hệ thống" permanently removed;
 * Dashboard, Messages, Lessons, Todo, SLA, Admin deferred to later phases.
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'tasks',
    titleKey: 'nav.tasks',
    href: APP_ROUTES.TASKS,
    icon: ListChecks,
    menuPermKey: 'list',
  },
]

export const ADMIN_NAV_ITEMS: NavItemConfig[] = []
