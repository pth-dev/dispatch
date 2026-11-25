import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import { SHARED_TASK_LIST_KEY } from '@/hooks/use-tasks'

export const taskKeys = {
  all: SHARED_QUERY_KEYS.tasks,
  list: () => SHARED_TASK_LIST_KEY,
  history: () => [...taskKeys.all, 'history'] as const,
  myHistory: (username?: string) => [...taskKeys.all, 'history', 'mine', username ?? ''] as const,
  reports: (taskId: number) => [...taskKeys.all, 'reports', taskId] as const,
  dupCheck: (title: string, due: string, excludeId?: number) =>
    [...taskKeys.all, 'dup-check', title, due, excludeId ?? 0] as const,
  metaDepts: () => SHARED_QUERY_KEYS.metaDepts,
  metaSites: () => SHARED_QUERY_KEYS.metaSites,
  directory: () => SHARED_QUERY_KEYS.userDirectory,
  pocketTaskTypes: () => SHARED_QUERY_KEYS.pocketTaskTypes,
}
