import type { KpiBasis } from '../utils/kpi-people-domain'

export const kpiKeys = {
  all: ['kpi'] as const,
  reportTasks: (params: {
    start?: string
    end?: string
    basis: KpiBasis
    includeCycles: boolean
  }) => [...kpiKeys.all, 'report-tasks', params] as const,
}
