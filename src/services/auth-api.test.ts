import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllAuthStorage,
  getRememberToken,
  getStoredSession,
  loginWithPassword,
  logoutSession,
  setRememberToken,
  setStoredSession,
  updateLocalPassword,
  verifySession,
} from '@/services'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const SAMPLE_USER = {
  id: 1,
  username: 'user_b',
  fullname: 'User B',
  dept: '資訊部',
  site: 'YS',
  role: 'user',
  auth_source: 'local',
  menu_perms: null,
}

describe('auth-api', () => {
  beforeEach(() => {
    clearAllAuthStorage()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('clears stale remember_token from a previous user when logging in with remember=false', async () => {
    setRememberToken({ username: 'user_a', token: 'a'.repeat(64) })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          success: true,
          token: 'session-b',
          user: SAMPLE_USER,
        }),
      ),
    )

    const user = await loginWithPassword({
      username: 'user_b',
      password: 'secret',
      remember: false,
    })

    expect(user.username).toBe('user_b')
    expect(getStoredSession()).toEqual({ username: 'user_b', token: 'session-b' })
    expect(getRememberToken()).toBeNull()
  })

  it('persists remember_token when remember=true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          success: true,
          token: 'session-b',
          remember_token: 'b'.repeat(64),
          user: SAMPLE_USER,
        }),
      ),
    )

    await loginWithPassword({
      username: 'user_b',
      password: 'secret',
      remember: true,
    })

    expect(getRememberToken()?.username).toBe('user_b')
    expect(getRememberToken()?.token).toBe('b'.repeat(64))
  })

  it('clears all auth storage on logout even when network fails', async () => {
    setStoredSession({ username: 'user_b', token: 'session-b' })
    setRememberToken({ username: 'user_b', token: 'b'.repeat(64) })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await logoutSession(false)
    expect(getStoredSession()).toBeNull()
    expect(getRememberToken()).toBeNull()
  })

  it('throws business ApiError when updateLocalPassword returns success=false', async () => {
    setStoredSession({ username: 'user_b', token: 'session-b' })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          success: false,
          message: '舊密碼錯誤 / Mật khẩu hiện tại không đúng',
        }),
      ),
    )

    await expect(
      updateLocalPassword({
        username: 'user_b',
        oldPassword: 'wrong',
        newPassword: 'newpassword1',
      }),
    ).rejects.toMatchObject({
      status: 400,
      kind: 'business',
    })
  })

  it('parses session user on verifySession', async () => {
    setStoredSession({ username: 'user_b', token: 'session-b' })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: true, user: SAMPLE_USER })),
    )

    const user = await verifySession()
    expect(user.username).toBe('user_b')
    expect(user.role).toBe('user')
  })
})
