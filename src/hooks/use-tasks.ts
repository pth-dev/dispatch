import { useQuery } from '@tanstack/react-query'
import { http } from '@/services/http'
import { RawTaskListSchema, type RawTask } from '@/schemas/task'

export const SHARED_TASK_LIST_KEY = ['tasks', 'all'] as const

export function useAllTasks() {
  return useQuery({
    queryKey: SHARED_TASK_LIST_KEY,
    // Intentionally omit `signal`: shared app-wide task list (~1.75MB) should
    // finish populating the cache across lazy route transitions instead of aborting.
    queryFn: async (): Promise<RawTask[]> => {
      const raw = await http<unknown>('/tasks')
      return RawTaskListSchema.parse(raw)
    },
    staleTime: 60_000,
  })
}
