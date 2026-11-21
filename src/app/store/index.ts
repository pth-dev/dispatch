import { create } from 'zustand'
import { getInitialLocale, saveLocale, type SupportedLocale } from '@/i18n'
import type { BackendUserRole, SessionUser } from '@/schemas/auth'

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'offline'
export type TableDensity = 'compact' | 'comfortable'

export type SessionState = {
  user: SessionUser | null
  authStatus: AuthStatus
  locale: SupportedLocale
  density: TableDensity

  setSession: (user: SessionUser) => void
  clearSession: () => void
  setAuthStatus: (status: AuthStatus) => void
  setLocale: (locale: SupportedLocale) => void
  setDensity: (density: TableDensity) => void
}

export const useAppStore = create<SessionState>((set) => ({
  user: null,
  authStatus: 'checking',
  locale: getInitialLocale(),
  density: 'compact',

  setSession: (user) => set({ user, authStatus: 'authenticated' }),
  clearSession: () => set({ user: null, authStatus: 'unauthenticated' }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  setLocale: (locale) => {
    saveLocale(locale)
    set({ locale })
  },
  setDensity: (density) => set({ density }),
}))

export type { BackendUserRole, SessionUser, SupportedLocale }
