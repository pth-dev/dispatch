import { useQuery } from '@tanstack/react-query'
import { http, isApiError } from '@/services/http'
import { useAppStore } from '@/app/store'
import {
  useMetaDepts,
  useMetaSites,
  usePocketTaskTypes,
  useUserDirectory,
} from '@/hooks/use-meta'
import { useAllTasks } from '@/hooks/use-tasks'
import {
  DupCheckResponseSchema,
  RawReportListSchema,
  RawTaskListSchema,
  type DupCheckResponse,
  type RawReport,
  type RawTask,
  type TaskListParams,
} from '@/schemas/task'
import { filterAndPaginateTasks, type FilteredTaskPage } from './filter-tasks'
import { taskKeys } from './keys'

export { useAllTasks, useMetaDepts, useMetaSites, usePocketTaskTypes, useUserDirectory }
export { filterAndPaginateTasks, type FilteredTaskPage }
export {
  assertMutationSuccess,
  useCreateTask,
  useDeleteReportAttachment,
  useDeleteTask,
  useGenerateAiReport,
  useSubmitReport,
  useUpdateReport,
  useUpdateTask,
} from './mutations'

export function useTaskList(params: TaskListParams) {
  const user = useAppStore((s) => s.user)
  const query = useAllTasks()
  const pageData = query.data ? filterAndPaginateTasks(query.data, params, user) : undefined

  return {
    ...query,
    data: pageData,
  }
}

export function useTaskById(taskId: number) {
  const query = useAllTasks()
  const task =
    Number.isFinite(taskId) && taskId > 0
      ? query.data?.find((item) => item.id === taskId)
      : undefined

  return {
    ...query,
    data: task,
  }
}

export function useMyTaskHistory(enabled = true) {
  const user = useAppStore((s) => s.user)

  return useQuery({
    queryKey: taskKeys.myHistory(user?.username),
    enabled: enabled && Boolean(user),
    queryFn: async ({ signal }): Promise<RawTask[]> => {
      try {
        const raw = await http<unknown>('/tasks/history/mine?limit=500', { signal })
        if (raw && typeof raw === 'object' && 'items' in raw) {
          return RawTaskListSchema.parse((raw as { items: unknown }).items)
        }
        if (Array.isArray(raw)) {
          return RawTaskListSchema.parse(raw)
        }
      } catch (err) {
        if (signal?.aborted) throw err
        if (!isApiError(err) || (err.status !== 404 && err.status !== 405 && err.status !== 501)) {
          throw err
        }
        // Fallback to active tasks filtered by reporter when history endpoint is unavailable
      }
      const fallbackRaw = await http<unknown>('/tasks', { signal })
      const all = RawTaskListSchema.parse(fallbackRaw)
      const me = (user?.username ?? '').trim().toLowerCase()
      return all
        .filter((t) => t.reporter.trim().toLowerCase() === me)
        .sort((a, b) => b.id - a.id)
    },
    staleTime: 60_000,
  })
}

export function useTaskReports(taskId: number) {
  return useQuery({
    queryKey: taskKeys.reports(taskId),
    queryFn: async ({ signal }): Promise<RawReport[]> => {
      const raw = await http<unknown>(`/tasks/${taskId}/reports`, { signal })
      return RawReportListSchema.parse(raw)
    },
    enabled: Number.isFinite(taskId) && taskId > 0,
    staleTime: 15_000,
  })
}

export async function checkDuplicateTask(params: {
  title: string
  due: string
  exclude?: number
  signal?: AbortSignal
}): Promise<DupCheckResponse> {
  const search = new URLSearchParams()
  search.set('title', params.title)
  search.set('due', params.due)
  if (params.exclude && params.exclude > 0) {
    search.set('exclude', String(params.exclude))
  }
  const raw = await http<unknown>(`/tasks/dup-check?${search.toString()}`, {
    signal: params.signal,
  })
  return DupCheckResponseSchema.parse(raw)
}
