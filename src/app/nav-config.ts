import {
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  GraduationCap,
  Languages,
  CircleCheckBig,
  Clock,
  Users,
  Lock,
  Network,
  type LucideIcon,
} from 'lucide-react'
import { APP_ROUTES } from '@/constants/app-routes'

export interface NavItemConfig {
  id: string
  titleKey: string
  href: string
  icon: LucideIcon
  badgeCount?: number
  adminOnly?: boolean
  children?: {
    id: string
    titleKey: string
    href: string
  }[]
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    titleKey: 'nav.dashboard',
    href: APP_ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    id: 'tasks',
    titleKey: 'nav.tasks',
    href: APP_ROUTES.TASKS,
    icon: ListChecks,
    badgeCount: 73,
  },
  {
    id: 'messages',
    titleKey: 'nav.messages',
    href: APP_ROUTES.MESSAGES,
    icon: MessagesSquare,
  },
  {
    id: 'lessons',
    titleKey: 'nav.lessons',
    href: APP_ROUTES.LESSONS,
    icon: GraduationCap,
    badgeCount: 6,
  },
  {
    id: 'system-texts',
    titleKey: 'nav.systemTexts',
    href: APP_ROUTES.SYSTEM_TEXTS,
    icon: Languages,
  },
  {
    id: 'todo',
    titleKey: 'nav.todo',
    href: APP_ROUTES.TODO,
    icon: CircleCheckBig,
  },
  {
    id: 'sla',
    titleKey: 'nav.sla',
    href: APP_ROUTES.SLA,
    icon: Clock,
  },
]

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'admin-users',
    titleKey: 'nav.users',
    href: APP_ROUTES.ADMIN.USERS,
    icon: Users,
    adminOnly: true,
  },
  {
    id: 'admin-roles',
    titleKey: 'nav.roles',
    href: APP_ROUTES.ADMIN.ROLES,
    icon: Lock,
    adminOnly: true,
  },
  {
    id: 'admin-departments',
    titleKey: 'nav.departments',
    href: APP_ROUTES.ADMIN.DEPARTMENTS,
    icon: Network,
    adminOnly: true,
  },
]
