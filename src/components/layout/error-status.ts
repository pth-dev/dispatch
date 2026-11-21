import {
  SearchX,
  Lock,
  Clock,
  CircleAlert,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'

/**
 * Single source of truth for error presentation, shared by the full-page
 * `ErrorState` and the in-content `InlineError` (brief §5.12).
 *
 * `fullPage` statuses (401/403/404) replace the whole shell so an error never
 * leaves a visible sidebar next to an empty content area (brief §8 item 17).
 * Everything else (5xx, timeout, network, unknown) renders inline inside the
 * content area with a retry action — see docs/DEVIATIONS.md, Stage 2.
 */
export type ErrorStatusCode =
  | '404'
  | '403'
  | '401'
  | '408'
  | '429'
  | '500'
  | '502'
  | '503'
  | '504'
  | 'network'
  | 'unknown'

export type ErrorTone = 'primary' | 'warning' | 'destructive'

export interface ErrorStatusMeta {
  code: ErrorStatusCode
  icon: LucideIcon
  tone: ErrorTone
  fullPage: boolean
  showLinks?: boolean
  showReferenceCode?: boolean
}

export const ERROR_STATUS_META: Record<ErrorStatusCode, ErrorStatusMeta> = {
  '404': {
    code: '404',
    icon: SearchX,
    tone: 'primary',
    fullPage: true,
    showLinks: true,
  },
  '403': {
    code: '403',
    icon: Lock,
    tone: 'warning',
    fullPage: true,
    showLinks: true,
  },
  '401': {
    code: '401',
    icon: Lock,
    tone: 'warning',
    fullPage: true,
  },
  '408': {
    code: '408',
    icon: Clock,
    tone: 'warning',
    fullPage: false,
  },
  '429': {
    code: '429',
    icon: Clock,
    tone: 'warning',
    fullPage: false,
  },
  '500': {
    code: '500',
    icon: CircleAlert,
    tone: 'destructive',
    fullPage: false,
    showReferenceCode: true,
  },
  '502': {
    code: '502',
    icon: CircleAlert,
    tone: 'destructive',
    fullPage: false,
    showReferenceCode: true,
  },
  '503': {
    code: '503',
    icon: CircleAlert,
    tone: 'destructive',
    fullPage: false,
    showReferenceCode: true,
  },
  '504': {
    code: '504',
    icon: CircleAlert,
    tone: 'destructive',
    fullPage: false,
    showReferenceCode: true,
  },
  network: {
    code: 'network',
    icon: WifiOff,
    tone: 'destructive',
    fullPage: false,
    showReferenceCode: true,
  },
  unknown: {
    code: 'unknown',
    icon: CircleAlert,
    tone: 'destructive',
    fullPage: false,
  },
}

export const ERROR_TONE_CLASS: Record<ErrorTone, string> = {
  primary: 'text-primary',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

export function getErrorStatusMeta(status: ErrorStatusCode): ErrorStatusMeta {
  return ERROR_STATUS_META[status] ?? ERROR_STATUS_META.unknown
}

export function isFullPageError(status: ErrorStatusCode): boolean {
  return getErrorStatusMeta(status).fullPage
}

/**
 * Normalizes any thrown value (ApiError, Response, fetch TypeError, unknown)
 * to one of the shared error codes. Never surfaces raw error messages.
 */
export function toErrorStatus(error: unknown): ErrorStatusCode {
  if (error instanceof Response) {
    return statusFromCode(error.status) ?? 'unknown'
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status
    const kind = 'kind' in error ? (error as { kind: unknown }).kind : undefined
    if (status === 0) {
      return kind === 'timeout' ? '408' : 'network'
    }
    if (typeof status === 'number' || typeof status === 'string') {
      return statusFromCode(status) ?? 'unknown'
    }
  }

  if (error instanceof TypeError) {
    return 'network'
  }

  return 'unknown'
}

function statusFromCode(value: number | string): ErrorStatusCode | null {
  const key = String(value)

  if (key in ERROR_STATUS_META) {
    return key as ErrorStatusCode
  }

  if (key.startsWith('5')) {
    return '500'
  }

  return null
}

/**
 * Throws a router-recognized response so the nearest `errorElement` renders the
 * full-page `ErrorState` outside the app shell (brief §5.12, §8 item 17).
 */
export function throwFullPageError(status: ErrorStatusCode): never {
  const numeric = Number(status)
  throw new Response(null, {
    status: Number.isFinite(numeric) && numeric >= 400 ? numeric : 500,
  })
}

export function createReferenceCode(now: Date = new Date()): string {
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase().padEnd(6, '0')
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  return `ERR-${rand} • ${stamp}`
}
