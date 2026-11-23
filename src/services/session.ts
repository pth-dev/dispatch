import { z } from 'zod'
import { SessionResumeResponseSchema, type SessionUser } from '@/schemas/auth'
import { env } from './env'

/**
 * Legacy-compatible storage keys & cross-tab channel (docs/DEVIATIONS.md §9.4).
 * Active tab session lives in sessionStorage; opt-in "Remember me" 64-hex token
 * lives in localStorage for automatic `POST /api/session/resume` on 401.
 */
export const SESSION_STORAGE_KEY = 'dispatch_session_v15'
export const REMEMBER_STORAGE_KEY = 'dispatch.remember.v16'
export const AUTH_BROADCAST_CHANNEL = 'dispatch-auth-v15'

const StoredSessionSchema = z.object({
  username: z.string().min(1),
  token: z.string().min(1),
})

export type StoredSession = z.infer<typeof StoredSessionSchema>

const RememberTokenRawSchema = z
  .object({
    username: z.string().min(1),
    token: z.string().min(1).optional(),
    remember_token: z.string().min(1).optional(),
    savedAt: z.number().optional(),
  })
  .refine((data) => Boolean(data.token || data.remember_token), {
    message: 'Remember token missing',
  })

export type RememberToken = {
  username: string
  token: string
  savedAt?: number
}

export type SessionResumeOutcome =
  | { status: 'resumed'; token: string; username: string; user?: SessionUser }
  | { status: 'no_token' }
  | { status: 'invalid' }
  | { status: 'offline' }

type SessionExpiredListener = () => void
type SessionResumedListener = (outcome: Extract<SessionResumeOutcome, { status: 'resumed' }>) => void

const expiredListeners = new Set<SessionExpiredListener>()
const resumedListeners = new Set<SessionResumedListener>()

let loggingOutFlag = false
let inFlightResume: Promise<SessionResumeOutcome> | null = null

function readStorageJson(storage: Storage | undefined, key: string): unknown {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function getSessionStorageSafe(): Storage | undefined {
  return typeof window !== 'undefined' ? window.sessionStorage : undefined
}

function getLocalStorageSafe(): Storage | undefined {
  return typeof window !== 'undefined' ? window.localStorage : undefined
}

export function getStoredSession(): StoredSession | null {
  const parsed = StoredSessionSchema.safeParse(
    readStorageJson(getSessionStorageSafe(), SESSION_STORAGE_KEY),
  )
  return parsed.success ? parsed.data : null
}

export function setStoredSession(session: StoredSession): void {
  const storage = getSessionStorageSafe()
  if (!storage) return
  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignore storage quota errors in private browsing modes
  }
}

export function clearStoredSession(): void {
  const storage = getSessionStorageSafe()
  if (!storage) return
  try {
    storage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

export function getRememberToken(): RememberToken | null {
  const parsed = RememberTokenRawSchema.safeParse(
    readStorageJson(getLocalStorageSafe(), REMEMBER_STORAGE_KEY),
  )
  if (!parsed.success) return null
  const token = parsed.data.token ?? parsed.data.remember_token
  if (!token) return null
  return {
    username: parsed.data.username,
    token,
    savedAt: parsed.data.savedAt,
  }
}

export function setRememberToken(remember: RememberToken): void {
  const storage = getLocalStorageSafe()
  if (!storage) return
  try {
    storage.setItem(
      REMEMBER_STORAGE_KEY,
      JSON.stringify({
        username: remember.username,
        token: remember.token,
        savedAt: remember.savedAt ?? Date.now(),
      }),
    )
  } catch {
    // Ignore storage quota errors
  }
}

export function clearRememberToken(): void {
  const storage = getLocalStorageSafe()
  if (!storage) return
  try {
    storage.removeItem(REMEMBER_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

export function clearAllAuthStorage(): void {
  clearStoredSession()
  clearRememberToken()
}

export function buildAuthHeaders(): Record<string, string> {
  const session = getStoredSession()
  if (!session) return {}
  return {
    username: encodeURIComponent(session.username),
    'x-session-token': session.token,
  }
}

export function isLoggingOut(): boolean {
  return loggingOutFlag
}

export function setLoggingOut(value: boolean): void {
  loggingOutFlag = value
}

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  expiredListeners.add(listener)
  return () => {
    expiredListeners.delete(listener)
  }
}

export function notifySessionExpired(): void {
  for (const listener of expiredListeners) {
    listener()
  }
}

export function onSessionResumed(listener: SessionResumedListener): () => void {
  resumedListeners.add(listener)
  return () => {
    resumedListeners.delete(listener)
  }
}

export function notifySessionResumed(
  outcome: Extract<SessionResumeOutcome, { status: 'resumed' }>,
): void {
  for (const listener of resumedListeners) {
    listener(outcome)
  }
}

const TAB_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}-${Date.now()}`

export function broadcastLogout(): void {
  if (typeof BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
    channel.postMessage({ type: 'logout', senderId: TAB_ID, at: Date.now() })
    channel.close()
  } catch {
    // Ignore in environments where BroadcastChannel is restricted
  }
}

export function subscribeAuthBroadcast(onLogout: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') {
    return () => {}
  }
  try {
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL)
    const handler = (event: MessageEvent<unknown>) => {
      if (
        typeof event.data === 'object' &&
        event.data !== null &&
        'type' in event.data &&
        (event.data as { type: unknown }).type === 'logout'
      ) {
        const senderId =
          'senderId' in event.data ? (event.data as { senderId: unknown }).senderId : undefined
        if (senderId === TAB_ID || isLoggingOut()) {
          return
        }
        onLogout()
      }
    }
    channel.addEventListener('message', handler)
    return () => {
      channel.removeEventListener('message', handler)
      channel.close()
    }
  } catch {
    return () => {}
  }
}

async function performResume(): Promise<SessionResumeOutcome> {
  const remember = getRememberToken()
  if (!remember) {
    return { status: 'no_token' }
  }

  try {
    const response = await fetch(`${env.apiUrl}/session/resume`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: remember.username,
        remember_token: remember.token,
      }),
    })

    if (response.status === 401 || response.status === 403) {
      clearRememberToken()
      return { status: 'invalid' }
    }

    if (!response.ok) {
      // 404 / 429 / 5xx: keep remember token so a transient outage does not log user out
      return { status: 'offline' }
    }

    const rawBody = await response.json().catch(() => null)
    const parsed = SessionResumeResponseSchema.safeParse(rawBody)
    if (!parsed.success || parsed.data.success === false || !parsed.data.token) {
      clearRememberToken()
      return { status: 'invalid' }
    }

    const userObj = parsed.data.user
    const resolvedUsername =
      typeof userObj?.username === 'string' && userObj.username.length > 0
        ? userObj.username
        : remember.username

    setStoredSession({
      username: resolvedUsername,
      token: parsed.data.token,
    })

    const outcome: Extract<SessionResumeOutcome, { status: 'resumed' }> = {
      status: 'resumed',
      token: parsed.data.token,
      username: resolvedUsername,
      user: userObj,
    }
    notifySessionResumed(outcome)
    return outcome
  } catch {
    return { status: 'offline' }
  }
}

/**
 * Attempts to resume a session using the stored remember-me token.
 * Concurrent calls share a single in-flight request.
 */
export function resumeSession(): Promise<SessionResumeOutcome> {
  if (inFlightResume) {
    return inFlightResume
  }
  inFlightResume = performResume().finally(() => {
    inFlightResume = null
  })
  return inFlightResume
}
