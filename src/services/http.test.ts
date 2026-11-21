import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  extractLocalizedMessage,
  getErrorMessage,
  http,
  resolveApiErrorMessage,
  toApiError,
} from './http'
import {
  clearAllAuthStorage,
  getStoredSession,
  onSessionExpired,
  setLoggingOut,
  setRememberToken,
  setStoredSession,
} from './session'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(implementation)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('http', () => {
  beforeEach(() => {
    clearAllAuthStorage()
    setLoggingOut(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('prefixes paths with the configured base URL exactly once', async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ ok: true }))

    await http<{ ok: boolean }>('/tasks?page=2')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks?page=2',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('passes absolute URLs through untouched (no double prefix)', async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ ok: true }))

    await http('https://example.com/api/tasks')

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/tasks', expect.anything())
  })

  it('attaches auth headers when session is present and omits them when skipAuth is true', async () => {
    setStoredSession({ username: 'Nguyễn An', token: 'tok-abc' })
    const fetchMock = stubFetch(async () => jsonResponse({ ok: true }))

    await http('/tasks')
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/tasks',
      expect.objectContaining({
        headers: expect.objectContaining({
          username: encodeURIComponent('Nguyễn An'),
          'x-session-token': 'tok-abc',
        }),
      }),
    )

    await http('/meta/depts', { skipAuth: true })
    const lastHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>
    expect(lastHeaders.username).toBeUndefined()
    expect(lastHeaders['x-session-token']).toBeUndefined()
  })

  it('does NOT set Content-Type when sending FormData so browser sets multipart boundary', async () => {
    setStoredSession({ username: 'u1', token: 't1' })
    const fetchMock = stubFetch(async () => jsonResponse({ success: true }))
    const formData = new FormData()
    formData.append('title', 'Test task')

    await http('/tasks', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'application/json', 'X-Extra': 'yes' },
    })

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers['Content-Type']).toBeUndefined()
    expect(headers['content-type']).toBeUndefined()
    expect(headers['x-extra']).toBe('yes')
    expect(headers['x-session-token']).toBe('t1')
  })

  it('normalizes failed responses into ApiError with kind', async () => {
    stubFetch(async () => jsonResponse({ code: 'TASK_FAILED', message: 'boom' }, 500))

    await expect(http('/tasks')).rejects.toEqual({
      status: 500,
      code: 'TASK_FAILED',
      message: 'boom',
      kind: 'http',
    })
  })

  it('marks 400/409/422 responses as business errors', async () => {
    stubFetch(async () => jsonResponse({ message: '錯誤 / Lỗi nghiệp vụ' }, 400))

    await expect(http('/tasks', { method: 'POST', body: '{}' })).rejects.toEqual({
      status: 400,
      code: undefined,
      message: '錯誤 / Lỗi nghiệp vụ',
      kind: 'business',
    })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    stubFetch(async () => new Response('gateway down', { status: 502 }))

    await expect(http('/tasks')).rejects.toEqual({
      status: 502,
      code: undefined,
      message: 'Request failed',
      kind: 'http',
    })
  })

  it('retries GET once on network error and succeeds on second attempt', async () => {
    let calls = 0
    const fetchMock = stubFetch(async () => {
      calls += 1
      if (calls === 1) throw new TypeError('Failed to fetch')
      return jsonResponse({ items: [] })
    })

    await expect(http('/tasks', { retryDelayMs: 1 })).resolves.toEqual({ items: [] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws normalized network ApiError after GET retry exhaustion', async () => {
    const fetchMock = stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    await expect(http('/tasks', { retryDelayMs: 1 })).rejects.toEqual({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error',
      kind: 'network',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does NOT retry POST requests on network failure', async () => {
    const fetchMock = stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })

    await expect(http('/tasks', { method: 'POST', body: '{}' })).rejects.toEqual({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error',
      kind: 'network',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('times out hung GET requests and normalizes to timeout ApiError', async () => {
    const fetchMock = stubFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError'))
          })
        }),
    )

    await expect(http('/tasks', { timeoutMs: 15, retryDelayMs: 1 })).rejects.toEqual({
      status: 0,
      code: 'TIMEOUT',
      message: 'Request timeout',
      kind: 'timeout',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('respects caller AbortSignal without retrying', async () => {
    const controller = new AbortController()
    const fetchMock = stubFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )

    const promise = http('/tasks', { signal: controller.signal, retryDelayMs: 1 })
    controller.abort()

    await expect(promise).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('auto-resumes on 401 when remember token exists and retries the request once', async () => {
    setStoredSession({ username: 'hieu', token: 'expired-tok' })
    setRememberToken({ username: 'hieu', token: 'rem-64-hex' })

    let taskAttempts = 0
    const fetchMock = stubFetch(async (input) => {
      const url = String(input)
      if (url.endsWith('/session/resume')) {
        return jsonResponse({ success: true, token: 'fresh-tok', user: { username: 'hieu' } })
      }
      taskAttempts += 1
      if (taskAttempts === 1) {
        return jsonResponse({ message: 'Unauthorized' }, 401)
      }
      return jsonResponse([{ id: 1 }])
    })

    const result = await http<Array<{ id: number }>>('/tasks')
    expect(result).toEqual([{ id: 1 }])
    expect(getStoredSession()).toEqual({ username: 'hieu', token: 'fresh-tok' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('clears session and notifies listeners on 401 when no remember token exists', async () => {
    setStoredSession({ username: 'hieu', token: 'expired-tok' })
    const expiredListener = vi.fn()
    const unsub = onSessionExpired(expiredListener)

    stubFetch(async () => jsonResponse({ message: 'Unauthorized' }, 401))

    await expect(http('/tasks')).rejects.toMatchObject({ status: 401 })
    unsub()

    expect(getStoredSession()).toBeNull()
    expect(expiredListener).toHaveBeenCalledTimes(1)
  })

  it('clears session and notifies listeners if retried request after resume still returns 401', async () => {
    setStoredSession({ username: 'hieu', token: 'expired-tok' })
    setRememberToken({ username: 'hieu', token: 'a'.repeat(64) })
    const expiredListener = vi.fn()
    const unsub = onSessionExpired(expiredListener)

    let call = 0
    stubFetch(async (input) => {
      call++
      if (String(input).endsWith('/session/resume')) {
        return jsonResponse({
          success: true,
          token: 'still-bad-tok',
          user: { username: 'hieu', fullname: 'Hiếu', role: 'user' },
        })
      }
      return jsonResponse({ message: 'Unauthorized' }, 401)
    })

    await expect(http('/tasks')).rejects.toMatchObject({ status: 401 })
    unsub()

    expect(call).toBe(3)
    expect(getStoredSession()).toBeNull()
    expect(expiredListener).toHaveBeenCalledTimes(1)
  })
})

describe('toApiError / getErrorMessage / hybrid error normalization', () => {
  it('reads status, code and message from the response', async () => {
    await expect(toApiError(jsonResponse({ code: 'X', message: 'm' }, 403))).resolves.toEqual({
      status: 403,
      code: 'X',
      message: 'm',
      kind: 'http',
    })
  })

  it('extracts messages from unknown errors without leaking other shapes', () => {
    expect(getErrorMessage({ message: 'known' })).toBe('known')
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
    expect(getErrorMessage('text')).toBe('Unknown error')
    expect(getErrorMessage(null)).toBe('Unknown error')
  })

  it('extracts the active-language segment from bilingual backend messages', () => {
    const bilingual = '帳號或密碼錯誤 / Tài khoản hoặc mật khẩu không đúng'
    expect(extractLocalizedMessage(bilingual, 'vi')).toBe('Tài khoản hoặc mật khẩu không đúng')
    expect(extractLocalizedMessage(bilingual, 'en')).toBe('Tài khoản hoặc mật khẩu không đúng')
    expect(extractLocalizedMessage(bilingual, 'zh-CN')).toBe('帳號或密碼錯誤')
    expect(extractLocalizedMessage(bilingual, 'zh-TW')).toBe('帳號或密碼錯誤')
    expect(extractLocalizedMessage('Chỉ một ngôn ngữ', 'vi')).toBe('Chỉ một ngôn ngữ')
  })

  it('maps HTTP/infra errors and DUP_TITLE_DUE to i18n keys while keeping 400/409/422 localized', () => {
    const t = (key: string) => `t(${key})`

    expect(
      resolveApiErrorMessage(
        { status: 500, message: 'SQLITE_ERROR: syntax error near ...', kind: 'http' },
        t,
        'vi',
      ),
    ).toBe('t(errors.status.500.description)')

    expect(
      resolveApiErrorMessage({ status: 403, message: 'Forbidden raw', kind: 'http' }, t, 'vi'),
    ).toBe('t(errors.status.403.description)')

    expect(
      resolveApiErrorMessage(
        { status: 409, code: 'DUP_TITLE_DUE', message: 'raw dup', kind: 'business' },
        t,
        'vi',
      ),
    ).toBe('t(errors.codes.DUP_TITLE_DUE)')

    expect(
      resolveApiErrorMessage(
        {
          status: 400,
          message: '請選擇任務類型 / Vui lòng chọn loại nhiệm vụ',
          kind: 'business',
        },
        t,
        'vi',
      ),
    ).toBe('Vui lòng chọn loại nhiệm vụ')

    expect(
      resolveApiErrorMessage(
        {
          status: 400,
          message: '請選擇任務類型 / Vui lòng chọn loại nhiệm vụ',
          kind: 'business',
        },
        t,
        'zh-TW',
      ),
    ).toBe('請選擇任務類型')

    expect(
      resolveApiErrorMessage({ status: 0, message: 'Request timeout', kind: 'timeout' }, t, 'vi'),
    ).toBe('t(errors.status.408.description)')

    expect(
      resolveApiErrorMessage({ status: 0, message: 'Network error', kind: 'network' }, t, 'vi'),
    ).toBe('t(errors.status.network.description)')
  })
})
