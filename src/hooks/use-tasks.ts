import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/http'
import { RawTaskListSchema, type RawTask } from '@/schemas/task'

export const SHARED_TASK_LIST_KEY = ['tasks', 'all'] as const

export function useAllTasks() {
  return useQuery({
    queryKey: SHARED_TASK_LIST_KEY,
    queryFn: async ({ signal }): Promise<RawTask[]> => {
      const raw = await http<unknown>('/tasks', { signal })
      return RawTaskListSchema.parse(raw)
    },
    staleTime: 30_000,
  })
}
