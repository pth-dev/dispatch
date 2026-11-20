import * as React from 'react'
import { useLocation, useNavigate } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import { useAppStore } from '@/app/store'
import {
  clearStoredSession,
  getRememberToken,
  getStoredSession,
  isApiError,
  onSessionExpired,
  resumeSession,
  sendHeartbeat,
  subscribeAuthBroadcast,
  verifySession,
} from '@/services'

const HEARTBEAT_INTERVAL_MS = 60_000

/**
 * Verifies the active tab session (or auto-resumes via remember-me token),
 * runs a 60s heartbeat while authenticated, and reacts to cross-tab logout
 * or 401 expiry events.
 */
export function useSessionLifecycle(): void {
  const navigate = useNavigate()
  const location = useLocation()
  const authStatus = useAppStore((s) => s.authStatus)

  React.useEffect(() => {
    const controller = new AbortController()
    let active = true

    const redirectToLogin = () => {
      if (!active) return
      useAppStore.getState().clearSession()
      navigate(APP_ROUTES.LOGIN, {
        replace: true,
        state: { from: `${location.pathname}${location.search}` },
      })
    }

    const bootstrap = async () => {
      let session = getStoredSession()

      if (!session && getRememberToken()) {
        const outcome = await resumeSession()
        if (outcome.status === 'resumed') {
          session = getStoredSession()
        }
      }

      if (!session) {
        redirectToLogin()
        return
      }

      try {
        const user = await verifySession(controller.signal)
        if (!active) return
        useAppStore.getState().setSession(user)
      } catch (err) {
        if (!active || controller.signal.aborted) return
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          clearStoredSession()
          redirectToLogin()
          return
        }
        // Network / 5xx outage: keep existing user if already loaded, else move to login
        const existingUser = useAppStore.getState().user
        if (!existingUser) {
          redirectToLogin()
        }
      }
    }

    void bootstrap()

    const unsubExpired = onSessionExpired(redirectToLogin)
    const unsubBroadcast = subscribeAuthBroadcast(() => {
      clearStoredSession()
      redirectToLogin()
    })

    return () => {
      active = false
      controller.abort()
      unsubExpired()
      unsubBroadcast()
    }
  }, [navigate, location.pathname, location.search])

  React.useEffect(() => {
    if (authStatus !== 'authenticated') return

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat()
      }
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [authStatus])
}
