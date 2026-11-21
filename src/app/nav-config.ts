import { GraduationCap, ListChecks, MessagesSquare, type LucideIcon } from 'lucide-react'
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
 * Active navigation items (docs/DEVIATIONS.md §3 D8):
 * "Văn bản hệ thống" permanently removed;
 * Dashboard, Todo, SLA, Admin enabled incrementally per phase.
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'tasks',
    titleKey: 'nav.tasks',
    href: APP_ROUTES.TASKS,
    icon: ListChecks,
    menuPermKey: 'list',
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
]

export const ADMIN_NAV_ITEMS: NavItemConfig[] = []
