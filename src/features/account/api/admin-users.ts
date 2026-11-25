import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import {
  AdminUserListSchema,
  AuthSourceResponseSchema,
  BatchUsersResponseSchema,
  MergePreviewResponseSchema,
  SimpleAdminMutationSchema,
  type AdminUser,
  type AuthSourceResponse,
  type BatchUsersResponse,
  type MergePreviewResponse,
  type SimpleAdminMutation,
} from '@/schemas/account'
import { http } from '@/services'
import { accountKeys } from './keys'

export async function fetchAdminUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  const raw = await http<unknown>('/admin/users', { method: 'GET', signal })
  return AdminUserListSchema.parse(raw)
}

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: accountKeys.adminUsers(),
    queryFn: ({ signal }) => fetchAdminUsers(signal),
    enabled,
    staleTime: 60 * 1000,
  })
}

function useInvalidateAccountAdmin() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: accountKeys.adminUsers() })
    void queryClient.invalidateQueries({ queryKey: accountKeys.scope() })
    void queryClient.invalidateQueries({ queryKey: accountKeys.org() })
    void queryClient.invalidateQueries({ queryKey: SHARED_QUERY_KEYS.userDirectory })
  }
}

export type CreateAdminUserPayload = {
  username: string
  password: string
  fullname: string
  dept: string
  site: string
  role: string
  status: string
}

export function useCreateAdminUser() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async (payload: CreateAdminUserPayload): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}

export type UpdateAdminUserPayload = {
  id: number
  data: Partial<{
    username: string
    fullname: string
    dept: string
    site: string
    role: string
    status: string
  }>
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async ({ id, data }: UpdateAdminUserPayload): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}

export function useResetAdminUserPassword() {
  return useMutation({
    mutationFn: async ({
      id,
      newPassword,
    }: {
      id: number
      newPassword: string
    }): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>(`/admin/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      })
      return SimpleAdminMutationSchema.parse(raw)
    },
  })
}

export function useDeleteAdminUser() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async (id: number): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>(`/admin/users/${id}`, { method: 'DELETE' })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}

export function useForceLogoutUser() {
  return useMutation({
    mutationFn: async (id: number): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>(`/admin/users/${id}/force-logout`, { method: 'POST' })
      return SimpleAdminMutationSchema.parse(raw)
    },
  })
}

export type BatchUpdateUsersPayload = {
  ids: number[]
  changes: Partial<{
    dept: string
    site: string
    role: string
    status: string
  }>
}

export function useBatchUpdateUsers() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async (payload: BatchUpdateUsersPayload): Promise<BatchUsersResponse> => {
      const raw = await http<unknown>('/admin/users/batch', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return BatchUsersResponseSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}

export function useSaveMenuPerms() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async (payload: {
      ids: number[]
      perms: Record<string, string> | null
    }): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>('/admin/users/menu-perms', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}

export function useSaveUserExtraDepts() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async (payload: {
      singleId?: number
      ids?: number[]
      depts: string[]
      ous: string[]
      mode?: 'set' | 'add' | 'remove'
    }): Promise<SimpleAdminMutation> => {
      const raw =
        payload.singleId != null
          ? await http<unknown>(`/admin/users/${payload.singleId}/depts`, {
              method: 'PUT',
              body: JSON.stringify({ depts: payload.depts, ous: payload.ous }),
            })
          : await http<unknown>('/admin/users/depts/batch', {
              method: 'POST',
              body: JSON.stringify({
                ids: payload.ids ?? [],
                depts: payload.depts,
                ous: payload.ous,
                mode: payload.mode ?? 'set',
              }),
            })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}

export type ConvertAuthSourcePayload =
  | { id: number; auth_source: 'ad'; ad_sam: string; use_ad_username: boolean }
  | { id: number; auth_source: 'local'; password: string; enable: boolean }

export function useConvertAuthSource() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async ({ id, ...body }: ConvertAuthSourcePayload): Promise<AuthSourceResponse> => {
      const raw = await http<unknown>(`/admin/users/${id}/auth-source`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return AuthSourceResponseSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}

export function useMergePreview() {
  return useMutation({
    mutationFn: async ({
      targetId,
      fromUsername,
    }: {
      targetId: number
      fromUsername: string
    }): Promise<MergePreviewResponse> => {
      const raw = await http<unknown>(
        `/admin/users/${targetId}/merge-preview?from=${encodeURIComponent(fromUsername)}`,
        { method: 'GET' },
      )
      return MergePreviewResponseSchema.parse(raw)
    },
  })
}

export function useMergeAccounts() {
  const invalidate = useInvalidateAccountAdmin()
  return useMutation({
    mutationFn: async ({
      targetId,
      from,
      disable_source,
    }: {
      targetId: number
      from: string
      disable_source: boolean
    }): Promise<MergePreviewResponse> => {
      const raw = await http<unknown>(`/admin/users/${targetId}/merge`, {
        method: 'POST',
        body: JSON.stringify({ from, disable_source }),
      })
      return MergePreviewResponseSchema.parse(raw)
    },
    onSuccess: invalidate,
  })
}
