import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/http'
import { useAppStore } from '@/app/store'
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
import {
  fetchMetaDepts,
  fetchMetaSites,
  fetchPocketTaskTypes,
  fetchUserDirectory,
} from './meta'

export { filterAndPaginateTasks, type FilteredTaskPage }
export {
  assertMutationSuccess,
  useCreateTask,
  useDeleteReportAttachment,
  useDeleteTask,
  useSubmitReport,
  useUpdateReport,
  useUpdateTask,
} from './mutations'

export function useAllTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: async ({ signal }): Promise<RawTask[]> => {
      const raw = await http<unknown>('/tasks', { signal })
      return RawTaskListSchema.parse(raw)
    },
    staleTime: 30_000,
  })
}

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

export function useMetaDepts() {
  return useQuery({
    queryKey: taskKeys.metaDepts(),
    queryFn: ({ signal }) => fetchMetaDepts(signal),
    staleTime: 10 * 60_000,
  })
}

export function useMetaSites() {
  return useQuery({
    queryKey: taskKeys.metaSites(),
    queryFn: ({ signal }) => fetchMetaSites(signal),
    staleTime: 10 * 60_000,
  })
}

export function useUserDirectory() {
  return useQuery({
    queryKey: taskKeys.directory(),
    queryFn: ({ signal }) => fetchUserDirectory(signal),
    staleTime: 5 * 60_000,
  })
}

export function usePocketTaskTypes() {
  return useQuery({
    queryKey: taskKeys.pocketTaskTypes(),
    queryFn: ({ signal }) => fetchPocketTaskTypes(signal),
    staleTime: 5 * 60_000,
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
