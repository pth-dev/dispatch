import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import type { KpiBasis } from '../utils/kpi-people-domain'

export const kpiKeys = {
  all: SHARED_QUERY_KEYS.kpi,
  reportTasks: (params: {
    start?: string
    end?: string
    basis: KpiBasis
    includeCycles: boolean
  }) => [...kpiKeys.all, 'report-tasks', params] as const,
}
