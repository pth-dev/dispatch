import { useQuery } from '@tanstack/react-query'
import { AdminUserListSchema, type AdminUser } from '@/schemas/account'
import { WorkRecordListSchema, type WorkRecord } from '@/schemas/worklog'
import { http } from '@/services'
import { worklogKeys } from './keys'

export function useWorkRecords(
  params: { user: string; start: string; end: string },
  enabled = true,
) {
  return useQuery({
    queryKey: worklogKeys.records(params.user, params.start, params.end),
    queryFn: async ({ signal }): Promise<WorkRecord[]> => {
      const qs = new URLSearchParams({
        user: params.user,
        start: params.start,
        end: params.end,
      })
      const raw = await http<unknown>(`/work-records?${qs.toString()}`, {
        method: 'GET',
        signal,
      })
      return WorkRecordListSchema.parse(raw)
    },
    enabled: enabled && Boolean(params.user) && Boolean(params.start) && Boolean(params.end),
    staleTime: 60 * 1000,
  })
}

export function useWorklogUsers(enabled: boolean) {
  return useQuery({
    queryKey: worklogKeys.users(),
    queryFn: async ({ signal }): Promise<AdminUser[]> => {
      const raw = await http<unknown>('/admin/users', { method: 'GET', signal })
      return AdminUserListSchema.parse(raw)
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
