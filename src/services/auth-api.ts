import {
  LoginResponseSchema,
  SessionVerifyResponseSchema,
  SimpleMutationResponseSchema,
  type LoginFormValues,
  type SessionUser,
} from '@/schemas/auth'
import { http, type ApiError } from './http'
import {
  broadcastLogout,
  clearAllAuthStorage,
  clearStoredSession,
  getRememberToken,
  setLoggingOut,
  setRememberToken,
  setStoredSession,
} from './session'

export async function loginWithPassword(values: LoginFormValues): Promise<SessionUser> {
  const raw = await http<unknown>('/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({
      username: values.username.trim(),
      password: values.password,
      remember: values.remember,
    }),
  })

  const parsed = LoginResponseSchema.parse(raw)
  if (!parsed.success || !parsed.token || !parsed.user) {
    const err: ApiError = {
      status: 400,
      message: parsed.message || 'Request failed',
      kind: 'business',
    }
    throw err
  }

  setStoredSession({
    username: parsed.user.username,
    token: parsed.token,
  })

  if (values.remember && parsed.remember_token) {
    setRememberToken({
      username: parsed.user.username,
      token: parsed.remember_token,
    })
  }

  return parsed.user
}

export async function verifySession(signal?: AbortSignal): Promise<SessionUser> {
  const raw = await http<unknown>('/session/verify', {
    method: 'GET',
    cache: 'no-store',
    signal,
  })
  const parsed = SessionVerifyResponseSchema.parse(raw)
  return parsed.user
}

export async function sendHeartbeat(): Promise<void> {
  try {
    await http<unknown>('/session/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  } catch {
    // Heartbeat network errors are ignored; 401 is handled inside http.ts
  }
}

export async function logoutSession(all = false): Promise<void> {
  setLoggingOut(true)
  const remember = getRememberToken()
  try {
    await http<unknown>('/logout', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify({
        all,
        remember_token: remember?.token ?? '',
      }),
    })
  } catch {
    // Always clear local session even if server is unreachable
  } finally {
    if (all) {
      clearAllAuthStorage()
    } else {
      clearStoredSession()
      if (remember) {
        clearAllAuthStorage()
      }
    }
    broadcastLogout()
    setLoggingOut(false)
  }
}

export async function updateLocalPassword(payload: {
  username: string
  oldPassword: string
  newPassword: string
}): Promise<void> {
  const raw = await http<unknown>('/users/update-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const parsed = SimpleMutationResponseSchema.parse(raw)
  if (parsed.success === false) {
    const err: ApiError = {
      status: 400,
      message: parsed.message || 'Request failed',
      kind: 'business',
    }
    throw err
  }
}
