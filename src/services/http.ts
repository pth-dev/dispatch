import { env } from './env'
import {
  buildAuthHeaders,
  clearStoredSession,
  isLoggingOut,
  notifySessionExpired,
  resumeSession,
} from './session'

export const DEFAULT_GET_TIMEOUT_MS = 45_000

export type ApiErrorKind = 'http' | 'business' | 'network' | 'timeout'

export type ApiError = {
  status: number
  code?: string
  message: string
  kind?: ApiErrorKind
}

export type HttpRequestOptions = RequestInit & {
  /** Skip attaching auth headers and 401 auto-resume (e.g. login, register, public meta). */
  skipAuth?: boolean
  /** Override request timeout in milliseconds (defaults to 45s for GET/HEAD, none for writes). */
  timeoutMs?: number
  /** Internal guard to prevent infinite 401 auto-resume loops. */
  __resumed?: boolean
}

const BUSINESS_ERROR_STATUSES = new Set([400, 409, 422])
const MAPPED_CLIENT_STATUSES = new Set([401, 403, 404, 408, 429])
const MAPPED_SERVER_STATUSES = new Set([500, 502, 503, 504])
const CJK_REGEX = /[\u4e00-\u9fff]/

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null
  const code = typeof body?.code === 'string' ? body.code : undefined
  const rawMessage =
    typeof body?.message === 'string' && body.message.trim().length > 0
      ? body.message
      : typeof body?.err === 'string' && body.err.trim().length > 0
        ? body.err
        : 'Request failed'

  return {
    status: response.status,
    code,
    message: rawMessage,
    kind: BUSINESS_ERROR_STATUSES.has(response.status) ? 'business' : 'http',
  }
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Unknown error'
}

/**
 * Extracts the active-language segment from a legacy bilingual backend message
 * (typically formatted as `"中文訊息 / Tiếng Việt"` or separated by newlines).
 */
export function extractLocalizedMessage(raw: string, locale = 'vi'): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  let segments = trimmed
    .split(/\s+\/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (segments.length < 2 && trimmed.includes('\n')) {
    segments = trimmed
      .split(/\r?\n/)
      .map((part) => part.trim())
      .filter(Boolean)
  }

  if (segments.length < 2) {
    return trimmed
  }

  const wantsChinese = locale.toLowerCase().startsWith('zh')
  if (wantsChinese) {
    return segments.find((part) => CJK_REGEX.test(part)) ?? segments[0] ?? trimmed
  }
  return segments.find((part) => !CJK_REGEX.test(part)) ?? segments[0] ?? trimmed
}

/**
 * Hybrid error message resolver (docs/DEVIATIONS.md §9.3):
 * - Infrastructure/HTTP errors (401/403/404/408/429/5xx, network, timeout) and
 *   `DUP_TITLE_DUE` map strictly to `i18next` keys (never leaking 5xx internals).
 * - Business rejections (400/409/422) extract the active-language segment from
 *   the backend's `data.message`.
 */
export function resolveApiErrorMessage(
  error: unknown,
  t: (key: string) => string,
  locale = 'vi',
): string {
  if (isApiError(error)) {
    if (error.code === 'DUP_TITLE_DUE') {
      return t('errors.codes.DUP_TITLE_DUE')
    }

    if (error.status === 0) {
      return error.kind === 'timeout'
        ? t('errors.status.408.description')
        : t('errors.status.network.description')
    }

    if (MAPPED_CLIENT_STATUSES.has(error.status)) {
      return t(`errors.status.${error.status}.description`)
    }

    if (error.status >= 500) {
      const key = MAPPED_SERVER_STATUSES.has(error.status) ? String(error.status) : '500'
      return t(`errors.status.${key}.description`)
    }

    if (BUSINESS_ERROR_STATUSES.has(error.status)) {
      const extracted = extractLocalizedMessage(error.message, locale)
      if (extracted && extracted !== 'Request failed') {
        return extracted
      }
      return t('common.error')
    }

    return t('common.error')
  }

  if (error instanceof TypeError) {
    return t('errors.status.network.description')
  }

  return t('common.error')
}

function isBinaryOrFormBody(body: BodyInit | null | undefined): boolean {
  if (!body) return false
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    ArrayBuffer.isView(body)
  )
}

function buildHeaders(options?: HttpRequestOptions): Record<string, string> {
  const result: Record<string, string> = {}
  const isFormData = options?.body instanceof FormData

  if (!isFormData && !isBinaryOrFormBody(options?.body)) {
    result['Content-Type'] = 'application/json'
  }

  if (!options?.skipAuth) {
    Object.assign(result, buildAuthHeaders())
  }

  if (options?.headers) {
    const incoming = new Headers(options.headers)
    incoming.forEach((value, key) => {
      if (isFormData && key.toLowerCase() === 'content-type') {
        return
      }
      // Preserve canonical 'Content-Type' key when overriding
      if (key.toLowerCase() === 'content-type') {
        result['Content-Type'] = value
      } else {
        result[key] = value
      }
    })
  }

  if (isFormData) {
    delete result['Content-Type']
  }

  return result
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number | undefined,
): Promise<Response> {
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(url, init)
  }

  const callerSignal = init.signal
  const controller = new AbortController()
  let timedOut = false

  const onCallerAbort = () => {
    controller.abort(callerSignal?.reason)
  }

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort(callerSignal.reason)
    } else {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true })
    }
  }

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort(new DOMException('Request timeout', 'TimeoutError'))
  }, timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if (timedOut && !callerSignal?.aborted) {
      const timeoutError: ApiError = {
        status: 0,
        code: 'TIMEOUT',
        message: 'Request timeout',
        kind: 'timeout',
      }
      throw timeoutError
    }
    throw err
  } finally {
    clearTimeout(timer)
    callerSignal?.removeEventListener('abort', onCallerAbort)
  }
}

export async function http<T>(path: string, options?: HttpRequestOptions): Promise<T> {
  const url = path.startsWith('http') ? path : `${env.apiUrl}${path}`
  const method = (options?.method ?? 'GET').toUpperCase()
  const isReadMethod = method === 'GET' || method === 'HEAD'
  const timeoutMs = options?.timeoutMs ?? (isReadMethod ? DEFAULT_GET_TIMEOUT_MS : undefined)

  const fetchInit: RequestInit = {
    method: options?.method,
    body: options?.body,
    cache: options?.cache,
    credentials: options?.credentials,
    integrity: options?.integrity,
    keepalive: options?.keepalive,
    mode: options?.mode,
    redirect: options?.redirect,
    referrer: options?.referrer,
    referrerPolicy: options?.referrerPolicy,
    signal: options?.signal,
    headers: buildHeaders(options),
  }

  let response: Response
  try {
    response = await fetchWithTimeout(url, fetchInit, timeoutMs)
  } catch (err) {
    // Respect caller cancellation (e.g. TanStack Query abort) immediately
    if (options?.signal?.aborted) {
      throw err
    }

    if (isApiError(err)) {
      throw err
    }

    const networkError: ApiError = {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error',
      kind: 'network',
    }
    throw networkError
  }

  if (response.status === 401 && !options?.skipAuth && !isLoggingOut()) {
    if (!options?.__resumed) {
      const outcome = await resumeSession()
      if (options?.signal?.aborted) {
        throw options.signal.reason ?? new DOMException('Aborted', 'AbortError')
      }
      if (outcome.status === 'resumed') {
        return http<T>(path, { ...options, __resumed: true })
      }
      if (outcome.status === 'invalid' || outcome.status === 'no_token') {
        clearStoredSession()
        notifySessionExpired()
      }
    } else {
      clearStoredSession()
      notifySessionExpired()
    }
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
