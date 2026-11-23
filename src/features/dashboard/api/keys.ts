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
  all: ['dashboard'] as const,
  posts: (params: PostStatsQueryParams) => [...dashboardKeys.all, 'posts', params] as const,
} as const
