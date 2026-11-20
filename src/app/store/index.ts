import { create } from 'zustand'
import { getInitialLocale, saveLocale, type SupportedLocale } from '@/i18n'

export type UserRole = 'employee' | 'approver' | 'manager' | 'admin'

export type TableDensity = 'compact' | 'comfortable'

export interface SessionState {
  user: {
    id: string
    name: string
    code: string
    department: string
    role: UserRole
  }
  locale: SupportedLocale
  density: TableDensity
  sidebarCollapsed: boolean

  // Actions
  setRole: (role: UserRole) => void
  setLocale: (locale: SupportedLocale) => void
  setDensity: (density: TableDensity) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<SessionState>((set) => ({
  user: {
    id: 'user-01',
    name: 'Nguyễn An',
    code: 'IT-00102',
    department: 'it',
    role: 'employee',
  },
  locale: getInitialLocale(),
  density: 'compact',
  sidebarCollapsed: false,

  setRole: (role) =>
    set((state) => ({
      user: { ...state.user, role },
    })),
  setLocale: (locale) => {
    saveLocale(locale)
    set({ locale })
  },
  setDensity: (density) => set({ density }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))

export type { SupportedLocale }
