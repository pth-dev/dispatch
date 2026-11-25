/**
 * Shared TanStack Query root/catalog keys used across multiple features.
 * Keeping these in `src/constants/` prevents cross-feature imports when
 * invalidating or sharing cache entries across feature boundaries.
 */
export const SHARED_QUERY_KEYS = {
  tasks: ['tasks'] as const,
  dashboard: ['dashboard'] as const,
  kpi: ['kpi'] as const,
  metaDepts: ['meta', 'depts'] as const,
  metaSites: ['meta', 'sites'] as const,
  userDirectory: ['users', 'directory'] as const,
  pocketTaskTypes: ['pocket', 'task-types'] as const,
} as const
