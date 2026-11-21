export const taskKeys = {
  all: ['tasks'] as const,
  list: () => [...taskKeys.all, 'all'] as const,
  reports: (taskId: number) => [...taskKeys.all, 'reports', taskId] as const,
  dupCheck: (title: string, due: string, excludeId?: number) =>
    [...taskKeys.all, 'dup-check', title, due, excludeId ?? 0] as const,
  metaDepts: () => ['meta', 'depts'] as const,
  metaSites: () => ['meta', 'sites'] as const,
  directory: () => ['users', 'directory'] as const,
  pocketTaskTypes: () => ['pocket', 'task-types'] as const,
}
