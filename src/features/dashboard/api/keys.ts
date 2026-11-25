import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import type { PostGranularity, PostKpiPeriod } from '@/schemas/dashboard'

export interface PostStatsQueryParams {
  level: 'company' | 'dept'
  dept?: string
  sub?: boolean
  gran: PostGranularity
  kpi: PostKpiPeriod
  top?: number
}

export const dashboardKeys = {
  all: SHARED_QUERY_KEYS.dashboard,
  posts: (params: PostStatsQueryParams) => [...dashboardKeys.all, 'posts', params] as const,
} as const
