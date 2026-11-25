import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/app/store'
import { RawTaskListSchema, type RawTask } from '@/schemas/task'
import { http, isApiError } from '@/services/http'
import type { KpiBasis } from '../utils/kpi-people-domain'
import { kpiKeys } from './keys'

export interface UseKpiReportTasksOptions {
  start?: string
  end?: string
  basis?: KpiBasis
  includeCycles?: boolean
  enabled?: boolean
  refetchInterval?: number | false
}

export async function fetchKpiReportTasks(
  params: {
    start?: string
    end?: string
    basis: KpiBasis
    includeCycles: boolean
  },
  signal?: AbortSignal,
): Promise<RawTask[]> {
  const qs = new URLSearchParams({ purpose: 'kpi' })
  if (params.start) qs.set('start', params.start)
  if (params.end) qs.set('end', params.end)
  if (params.includeCycles) qs.set('include_cycles', '1')
  qs.set('basis', params.basis)

  try {
    const raw = await http<unknown>(`/reports/tasks?${qs.toString()}`, { signal })
    if (Array.isArray(raw)) {
      return RawTaskListSchema.parse(raw)
    }
    if (raw && typeof raw === 'object' && 'tasks' in raw) {
      return RawTaskListSchema.parse((raw as { tasks: unknown }).tasks)
    }
    return []
  } catch (err) {
    if (signal?.aborted) throw err
    if (isApiError(err) && (err.status === 404 || err.status === 405 || err.status === 501)) {
      const fallback = await http<unknown>('/tasks', { signal })
      return RawTaskListSchema.parse(fallback)
    }
    throw err
  }
}

export function useKpiReportTasks({
  start,
  end,
  basis = 'final',
  includeCycles = true,
  enabled = true,
  refetchInterval = false,
}: UseKpiReportTasksOptions) {
  const user = useAppStore((s) => s.user)

  return useQuery({
    queryKey: kpiKeys.reportTasks({ start, end, basis, includeCycles }),
    queryFn: ({ signal }) =>
      fetchKpiReportTasks({ start, end, basis, includeCycles }, signal),
    enabled: enabled && Boolean(user),
    staleTime: 30_000,
    refetchInterval,
    placeholderData: keepPreviousData,
  })
}
