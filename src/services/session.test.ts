import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_BROADCAST_CHANNEL,
  REMEMBER_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  broadcastLogout,
  buildAuthHeaders,
  clearAllAuthStorage,
  clearRememberToken,
  clearStoredSession,
  getRememberToken,
  getStoredSession,
  isLoggingOut,
  onSessionResumed,
  resumeSession,
  setLoggingOut,
  setRememberToken,
  setStoredSession,
  subscribeAuthBroadcast,
} from './session'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('session storage & headers', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    setLoggingOut(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('stores, reads, and clears the active tab session', () => {
    expect(getStoredSession()).toBeNull()

    setStoredSession({ username: 'phan.hieu', token: 'tok-123' })
    expect(getStoredSession()).toEqual({ username: 'phan.hieu', token: 'tok-123' })

    clearStoredSession()
    expect(getStoredSession()).toBeNull()
  })

  it('returns null on corrupted or invalid sessionStorage payloads', () => {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, '{not-json')
    expect(getStoredSession()).toBeNull()

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ username: '' }))
    expect(getStoredSession()).toBeNull()
  })

  it('stores, reads (including legacy remember_token key), and clears remember token', () => {
    expect(getRememberToken()).toBeNull()

    setRememberToken({ username: 'user1', token: 'a'.repeat(64) })
    expect(getRememberToken()).toEqual(
      expect.objectContaining({ username: 'user1', token: 'a'.repeat(64) }),
    )

    // Legacy key compatibility
    window.localStorage.setItem(
      REMEMBER_STORAGE_KEY,
      JSON.stringify({ username: 'legacy', remember_token: 'b'.repeat(64) }),
    )
    expect(getRememberToken()).toEqual({
      username: 'legacy',
      token: 'b'.repeat(64),
      savedAt: undefined,
    })

    clearRememberToken()
    expect(getRememberToken()).toBeNull()
  })

  it('clears both storages via clearAllAuthStorage', () => {
    setStoredSession({ username: 'u', token: 't' })
    setRememberToken({ username: 'u', token: 'r' })
    clearAllAuthStorage()
    expect(getStoredSession()).toBeNull()
    expect(getRememberToken()).toBeNull()
  })

  it('builds auth headers with URI-encoded username and x-session-token', () => {
    expect(buildAuthHeaders()).toEqual({})

    setStoredSession({ username: 'Nguyễn Văn A', token: 'sess-xyz' })
    expect(buildAuthHeaders()).toEqual({
      username: encodeURIComponent('Nguyễn Văn A'),
      'x-session-token': 'sess-xyz',
    })
  })

  it('tracks logging-out flag', () => {
    expect(isLoggingOut()).toBe(false)
    setLoggingOut(true)
    expect(isLoggingOut()).toBe(true)
    setLoggingOut(false)
    expect(isLoggingOut()).toBe(false)
  })
})

describe('BroadcastChannel auth sync', () => {
  beforeEach(() => {
    setLoggingOut(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ignores same-tab logout broadcast and notifies subscribers on cross-tab logout', () => {
    const listeners: Array<(ev: MessageEvent) => void> = []
    const posted: unknown[] = []
    class FakeBroadcastChannel {
      name: string
      constructor(name: string) {
        this.name = name
      }
      addEventListener(_type: string, cb: (ev: MessageEvent) => void) {
        listeners.push(cb)
      }
      removeEventListener(_type: string, cb: (ev: MessageEvent) => void) {
        const idx = listeners.indexOf(cb)
        if (idx >= 0) listeners.splice(idx, 1)
      }
      postMessage(data: unknown) {
        posted.push(data)
        for (const cb of listeners) {
          cb({ data } as MessageEvent)
        }
      }
      close() {}
    }

    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)

    const onLogout = vi.fn()
    const unsubscribe = subscribeAuthBroadcast(onLogout)
    expect(AUTH_BROADCAST_CHANNEL).toBe('dispatch-auth-v15')

    // Same-tab broadcastLogout is ignored to prevent duplicate logout/navigate
    broadcastLogout()
    expect(posted).toHaveLength(1)
    expect(onLogout).not.toHaveBeenCalled()

    // Cross-tab logout message notifies subscriber
    const otherTabChannel = new FakeBroadcastChannel(AUTH_BROADCAST_CHANNEL)
    otherTabChannel.postMessage({ type: 'logout', senderId: 'other-tab', at: Date.now() })
    expect(onLogout).toHaveBeenCalledTimes(1)

    unsubscribe()
    otherTabChannel.postMessage({ type: 'logout', senderId: 'other-tab', at: Date.now() })
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})

describe('resumeSession', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns no_token without calling fetch when remember token is absent', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(resumeSession()).resolves.toEqual({ status: 'no_token' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resumes session, persists new token, and notifies listeners on 200', async () => {
    setRememberToken({ username: 'hieu', token: 'rem-tok' })
    const fetchMock = vi.fn(async () =>
      jsonResponse({ success: true, token: 'new-sess-tok', user: { username: 'hieu', role: 'admin' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const listener = vi.fn()
    const unsub = onSessionResumed(listener)

    const outcome = await resumeSession()
    unsub()

    expect(outcome).toMatchObject({
      status: 'resumed',
      token: 'new-sess-tok',
      username: 'hieu',
      user: { username: 'hieu', role: 'admin', auth_source: 'local', menu_perms: null },
    })
    expect(getStoredSession()).toEqual({ username: 'hieu', token: 'new-sess-tok' })
    expect(listener).toHaveBeenCalledWith(outcome)
  })

  it('clears remember token and returns invalid on 401/403', async () => {
    setRememberToken({ username: 'hieu', token: 'bad-tok' })
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ success: false }, 401)))

    await expect(resumeSession()).resolves.toEqual({ status: 'invalid' })
    expect(getRememberToken()).toBeNull()
  })

  it('keeps remember token and returns offline on 5xx or network error', async () => {
    setRememberToken({ username: 'hieu', token: 'keep-tok' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })))

    await expect(resumeSession()).resolves.toEqual({ status: 'offline' })
    expect(getRememberToken()?.token).toBe('keep-tok')

    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))
    await expect(resumeSession()).resolves.toEqual({ status: 'offline' })
    expect(getRememberToken()?.token).toBe('keep-tok')
  })

  it('deduplicates concurrent resume calls into a single HTTP request', async () => {
    setRememberToken({ username: 'hieu', token: 'rem-tok' })
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(() => resolve(jsonResponse({ success: true, token: 'dedup-tok' })), 10)
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const [a, b, c] = await Promise.all([resumeSession(), resumeSession(), resumeSession()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a.status).toBe('resumed')
    expect(b).toEqual(a)
    expect(c).toEqual(a)
  })
})
