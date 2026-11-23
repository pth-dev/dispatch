import { useQuery } from '@tanstack/react-query'
import {
  AccountOrgResponseSchema,
  AccountScopeResponseSchema,
  type AccountOrgResponse,
  type AccountScopeResponse,
} from '@/schemas/account'
import { http } from '@/services'
import { accountKeys } from './keys'

export async function fetchAccountScope(signal?: AbortSignal): Promise<AccountScopeResponse> {
  const raw = await http<unknown>('/account/scope', { method: 'GET', signal })
  return AccountScopeResponseSchema.parse(raw)
}

export async function fetchAccountOrg(signal?: AbortSignal): Promise<AccountOrgResponse> {
  const raw = await http<unknown>('/account/org', { method: 'GET', signal })
  return AccountOrgResponseSchema.parse(raw)
}

export function useAccountScope() {
  return useQuery({
    queryKey: accountKeys.scope(),
    queryFn: ({ signal }) => fetchAccountScope(signal),
    staleTime: 2 * 60 * 1000,
  })
}

export function useAccountOrg() {
  return useQuery({
    queryKey: accountKeys.org(),
    queryFn: ({ signal }) => fetchAccountOrg(signal),
    staleTime: 5 * 60 * 1000,
  })
}
