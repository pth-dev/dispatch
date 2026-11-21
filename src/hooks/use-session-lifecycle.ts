import * as React from 'react'
import { useLocation, useNavigate } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import { queryClient } from '@/app/providers/query-client'
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
export function useSessionLifecycle(): { retryVerify: () => void } {
  const navigate = useNavigate()
  const location = useLocation()
  const authStatus = useAppStore((s) => s.authStatus)
  const navigateRef = React.useRef(navigate)
  const currentFromRef = React.useRef(`${location.pathname}${location.search}`)
  const [verifyAttempt, setVerifyAttempt] = React.useState(0)

  React.useEffect(() => {
    navigateRef.current = navigate
    currentFromRef.current = `${location.pathname}${location.search}`
  }, [navigate, location.pathname, location.search])

  React.useEffect(() => {
    const controller = new AbortController()
    let active = true

    const redirectToLogin = () => {
      if (!active) return
      queryClient.clear()
      useAppStore.getState().clearSession()
      navigateRef.current(APP_ROUTES.LOGIN, {
        replace: true,
        state: { from: currentFromRef.current },
      })
    }

    const bootstrap = async () => {
      let session = getStoredSession()

      if (!session && getRememberToken()) {
        const outcome = await resumeSession()
        if (outcome.status === 'resumed') {
          session = getStoredSession()
        } else if (outcome.status === 'offline') {
          if (!active) return
          useAppStore.getState().setAuthStatus('offline')
          return
        }
      }

      if (!session) {
        redirectToLogin()
        return
      }

      // Skip immediate redundant verify right after an interactive login
      const currentState = useAppStore.getState()
      if (
        verifyAttempt === 0 &&
        currentState.authStatus === 'authenticated' &&
        currentState.user?.username === session.username
      ) {
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
        // Network / 5xx outage: preserve local session and show offline retry state
        const existingUser = useAppStore.getState().user
        if (!existingUser) {
          useAppStore.getState().setAuthStatus('offline')
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
  }, [verifyAttempt])

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

  const retryVerify = () => {
    useAppStore.getState().setAuthStatus('checking')
    setVerifyAttempt((n) => n + 1)
  }

  return { retryVerify }
}
