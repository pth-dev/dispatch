import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PostStatsResponseSchema, type PostStatsResponse } from '@/schemas/dashboard'
import { http } from '@/services'
import { dashboardKeys, type PostStatsQueryParams } from './keys'

export async function fetchPostStats(
  params: PostStatsQueryParams,
  signal?: AbortSignal,
): Promise<PostStatsResponse> {
  const qs = new URLSearchParams()
  qs.set('level', params.level)
  if (params.dept) qs.set('dept', params.dept)
  if (params.sub) qs.set('sub', '1')
  qs.set('gran', params.gran)
  qs.set('kpi', params.kpi)
  if (params.top) qs.set('top', String(params.top))

  const raw = await http<unknown>(`/stats/posts?${qs.toString()}`, {
    method: 'GET',
    signal,
  })
  return PostStatsResponseSchema.parse(raw)
}

export function usePostStats(params: PostStatsQueryParams, enabled = true) {
  return useQuery({
    queryKey: dashboardKeys.posts(params),
    queryFn: ({ signal }) => fetchPostStats(params, signal),
    enabled,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
