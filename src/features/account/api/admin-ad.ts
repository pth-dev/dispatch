import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import { SimpleAdminMutationSchema, type SimpleAdminMutation } from '@/schemas/account'
import {
  AdDiagnoseResponseSchema,
  AdImportResponseSchema,
  AdStatusResponseSchema,
  AdSyncLogsResponseSchema,
  AdUsersResponseSchema,
  type AdDiagnoseResponse,
  type AdImportResponse,
  type AdStatusResponse,
  type AdSyncLogEntry,
  type AdUserItem,
} from '@/schemas/account-ad'
import { http } from '@/services'
import { accountKeys } from './keys'

export function useSaveViewDepts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      singleId?: number
      ids?: number[]
      depts: string[]
      mode?: 'replace' | 'add' | 'remove'
    }): Promise<SimpleAdminMutation> => {
      const raw =
        payload.singleId != null
          ? await http<unknown>(`/admin/users/${payload.singleId}/view-depts`, {
              method: 'PUT',
              body: JSON.stringify({ depts: payload.depts }),
            })
          : await http<unknown>('/admin/users/view-depts/batch', {
              method: 'POST',
              body: JSON.stringify({
                ids: payload.ids ?? [],
                depts: payload.depts,
                mode: payload.mode ?? 'replace',
              }),
            })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.adminUsers() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.scope() })
    },
  })
}

export function useAdStatus(enabled: boolean) {
  return useQuery({
    queryKey: accountKeys.adStatus(),
    queryFn: async ({ signal }): Promise<AdStatusResponse> => {
      const raw = await http<unknown>('/admin/ad/status', { method: 'GET', signal })
      return AdStatusResponseSchema.parse(raw)
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useAdUsers(enabled: boolean, refresh = false) {
  return useQuery({
    queryKey: [...accountKeys.adUsers(), refresh ? 'refresh' : 'cached'] as const,
    queryFn: async ({ signal }): Promise<AdUserItem[]> => {
      const qs = refresh ? '?disabled=1&refresh=1' : '?disabled=1'
      const raw = await http<unknown>(`/admin/ad/users${qs}`, { method: 'GET', signal })
      return AdUsersResponseSchema.parse(raw).users
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAdSyncLogs(enabled: boolean) {
  return useQuery({
    queryKey: accountKeys.adSyncLogs(),
    queryFn: async ({ signal }): Promise<AdSyncLogEntry[]> => {
      const raw = await http<unknown>('/admin/ad/sync/logs', { method: 'GET', signal })
      return AdSyncLogsResponseSchema.parse(raw).logs
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useAdImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      accounts: string[]
      dept: string
      site: string
      role: string
      status: string
      link_existing: boolean
      auto_dept?: boolean
    }): Promise<AdImportResponse> => {
      const raw = await http<unknown>('/admin/ad/import', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return AdImportResponseSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.adminUsers() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.adUsers() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.adStatus() })
      void queryClient.invalidateQueries({ queryKey: SHARED_QUERY_KEYS.userDirectory })
    },
  })
}

export function useAdSyncNow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>('/admin/ad/sync', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.adStatus() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.adUsers() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.adSyncLogs() })
      void queryClient.invalidateQueries({ queryKey: accountKeys.adminUsers() })
    },
  })
}

export function useAdDiagnose() {
  return useMutation({
    mutationFn: async (): Promise<AdDiagnoseResponse> => {
      const raw = await http<unknown>('/admin/ad/diagnose', { method: 'GET' })
      return AdDiagnoseResponseSchema.parse(raw)
    },
  })
}
