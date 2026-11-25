import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import { SimpleAdminMutationSchema, type SimpleAdminMutation } from '@/schemas/account'
import {
  AdminSitesResponseSchema,
  ArchiveInfoResponseSchema,
  ArchiveRunResponseSchema,
  OuRuleResponseSchema,
  type AdminSite,
  type ArchiveInfoResponse,
  type ArchiveRunResponse,
  type OuRuleResponse,
} from '@/schemas/account-system'
import { http } from '@/services'
import { accountKeys } from './keys'

export function useAdminSites(enabled: boolean) {
  return useQuery({
    queryKey: accountKeys.sites(),
    queryFn: async ({ signal }): Promise<AdminSite[]> => {
      const raw = await http<unknown>('/admin/sites', { method: 'GET', signal })
      return AdminSitesResponseSchema.parse(raw).sites
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      code: string
      name: string
      vn: string
    }): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>('/admin/sites', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.sites() })
      void queryClient.invalidateQueries({ queryKey: SHARED_QUERY_KEYS.metaSites })
    },
  })
}

export function useUpdateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      code: string
      name: string
      vn: string
      active: boolean
    }): Promise<SimpleAdminMutation> => {
      const raw = await http<unknown>(`/admin/sites/${encodeURIComponent(payload.code)}`, {
        method: 'PUT',
        body: JSON.stringify({ name: payload.name, vn: payload.vn, active: payload.active }),
      })
      return SimpleAdminMutationSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.sites() })
      void queryClient.invalidateQueries({ queryKey: SHARED_QUERY_KEYS.metaSites })
    },
  })
}

export function useRunOuRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dryRun: boolean): Promise<OuRuleResponse> => {
      const raw = await http<unknown>('/admin/dept-ou-rule', {
        method: 'POST',
        body: JSON.stringify({ dry_run: dryRun }),
      })
      return OuRuleResponseSchema.parse(raw)
    },
    onSuccess: (_data, dryRun) => {
      if (!dryRun) {
        void queryClient.invalidateQueries({ queryKey: accountKeys.adminUsers() })
        void queryClient.invalidateQueries({ queryKey: accountKeys.org() })
        void queryClient.invalidateQueries({ queryKey: accountKeys.scope() })
      }
    },
  })
}

export function useArchiveInfo(enabled: boolean) {
  return useQuery({
    queryKey: accountKeys.archiveInfo(),
    queryFn: async ({ signal }): Promise<ArchiveInfoResponse> => {
      const raw = await http<unknown>('/admin/archive/info', { method: 'GET', signal })
      return ArchiveInfoResponseSchema.parse(raw)
    },
    enabled,
    staleTime: 60 * 1000,
  })
}

export function useRunArchive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      targetPath: string
      format: 'zip' | 'folder'
      include: { messages: boolean; todos: boolean; users: boolean }
    }): Promise<ArchiveRunResponse> => {
      const raw = await http<unknown>('/admin/archive', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      return ArchiveRunResponseSchema.parse(raw)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.archiveInfo() })
    },
  })
}
