import * as React from 'react'
import { useLocation, useNavigate } from 'react-router'
import { APP_ROUTES } from '@/constants/app-routes'
import { getDefaultLandingRoute } from '@/app/nav-config'
import { queryClient } from '@/app/providers/query-client'
import { useAppStore } from '@/app/store'
import {
  clearStoredSession,
  getRememberToken,
  getStoredSession,
  isApiError,
  resumeSession,
  verifySession,
} from '@/services'

const LOGIN_PATH_PATTERN = /^\/login([/?#]|$)/

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code < 32 || code === 127) return true
  }
  return false
}

export function resolveSafeRedirect(from: unknown, fallback: string = APP_ROUTES.TASKS): string {
  if (typeof from !== 'string') return fallback
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('\\')) return fallback
  if (hasControlChar(from) || LOGIN_PATH_PATTERN.test(from)) return fallback
  return from
}

export function useLoginAutoResume() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAppStore((s) => s.setSession)
  const [checkingExisting, setCheckingExisting] = React.useState(true)

  const rawFrom = (location.state as { from?: unknown } | null)?.from

  React.useEffect(() => {
    const controller = new AbortController()
    let active = true

    const checkExisting = async () => {
      try {
        let session = getStoredSession()
        if (!session && getRememberToken()) {
          const outcome = await resumeSession()
          if (outcome.status === 'resumed') {
            session = getStoredSession()
          }
        }
        if (session) {
          const user = await verifySession(controller.signal)
          if (!active) return
          queryClient.clear()
          setSession(user)
          navigate(resolveSafeRedirect(rawFrom, getDefaultLandingRoute(user)), { replace: true })
          return
        }
      } catch (err) {
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          clearStoredSession()
        }
      }
      if (active) setCheckingExisting(false)
    }

    void checkExisting()
    return () => {
      active = false
      controller.abort()
    }
  }, [navigate, rawFrom, setSession])

  return { checkingExisting, rawFrom }
}
