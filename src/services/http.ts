import { env } from './env'

export interface ApiError {
  status: number
  code?: string
  message: string
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null)
  return {
    status: response.status,
    code: body?.code,
    message: body?.message ?? 'Request failed',
  }
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Unknown error'
}

function authHeaders(): Record<string, string> {
  // Read auth token if client token strategy is used, or rely on httpOnly cookies
  return {}
}

export async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${env.apiUrl}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw await toApiError(response)
  }

  return response.json()
}
