import { describe, expect, it, vi } from 'vitest'
import { getErrorMessage, http, toApiError } from './http'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(implementation: () => Promise<Response>) {
  const fetchMock = vi.fn(implementation)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('http', () => {
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

  it('merges caller headers with the JSON content type', async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ ok: true }))

    await http('/tasks', { headers: { 'X-Test': '1' } })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Test': '1',
        }),
      }),
    )
  })

  it('normalizes failed responses into ApiError', async () => {
    stubFetch(async () => jsonResponse({ code: 'TASK_FAILED', message: 'boom' }, 500))

    await expect(http('/tasks')).rejects.toEqual({
      status: 500,
      code: 'TASK_FAILED',
      message: 'boom',
    })
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    stubFetch(async () => new Response('gateway down', { status: 502 }))

    await expect(http('/tasks')).rejects.toEqual({
      status: 502,
      code: undefined,
      message: 'Request failed',
    })
  })

  it('passes the AbortSignal through to fetch', async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ ok: true }))
    const controller = new AbortController()

    await http('/tasks', { signal: controller.signal })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it('parses a successful JSON body', async () => {
    stubFetch(async () => jsonResponse({ items: [], total: 0 }))

    await expect(http('/tasks')).resolves.toEqual({ items: [], total: 0 })
  })
})

describe('toApiError / getErrorMessage', () => {
  it('reads status, code and message from the response', async () => {
    await expect(toApiError(jsonResponse({ code: 'X', message: 'm' }, 403))).resolves.toEqual({
      status: 403,
      code: 'X',
      message: 'm',
    })
  })

  it('extracts messages from unknown errors without leaking other shapes', () => {
    expect(getErrorMessage({ message: 'known' })).toBe('known')
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
    expect(getErrorMessage('text')).toBe('Unknown error')
    expect(getErrorMessage(null)).toBe('Unknown error')
  })
})
