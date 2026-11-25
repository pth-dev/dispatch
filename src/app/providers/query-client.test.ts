import { describe, expect, it } from 'vitest'
import { shouldRetryQuery } from './query-client'

describe('shouldRetryQuery', () => {
  it('retries once for 5xx, network, and timeout ApiErrors', () => {
    expect(shouldRetryQuery(0, { status: 500, message: 'Server error', kind: 'http' })).toBe(true)
    expect(shouldRetryQuery(0, { status: 503, message: 'Unavailable', kind: 'http' })).toBe(true)
    expect(shouldRetryQuery(0, { status: 0, code: 'NETWORK_ERROR', message: 'Network error', kind: 'network' })).toBe(true)
    expect(shouldRetryQuery(0, { status: 0, code: 'TIMEOUT', message: 'Request timeout', kind: 'timeout' })).toBe(true)
  })

  it('stops retrying after 1 retry attempt', () => {
    expect(shouldRetryQuery(1, { status: 500, message: 'Server error', kind: 'http' })).toBe(false)
    expect(shouldRetryQuery(1, { status: 0, message: 'Network error', kind: 'network' })).toBe(false)
  })

  it('does not retry 4xx errors or AbortError', () => {
    expect(shouldRetryQuery(0, { status: 400, message: 'Bad request', kind: 'business' })).toBe(false)
    expect(shouldRetryQuery(0, { status: 401, message: 'Unauthorized', kind: 'http' })).toBe(false)
    expect(shouldRetryQuery(0, { status: 403, message: 'Forbidden', kind: 'http' })).toBe(false)
    expect(shouldRetryQuery(0, { status: 404, message: 'Not found', kind: 'http' })).toBe(false)
    expect(shouldRetryQuery(0, new DOMException('Aborted', 'AbortError'))).toBe(false)
  })
})
