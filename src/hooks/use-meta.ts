import { useQuery } from '@tanstack/react-query'
import { SHARED_QUERY_KEYS } from '@/constants/query-keys'
import { DirectoryUserListSchema, type DirectoryUser } from '@/schemas/auth'
import {
  MetaDeptsResponseSchema,
  MetaSitesResponseSchema,
  PocketValueListSchema,
  type DeptItem,
  type MetaDeptsResponse,
  type MetaSitesResponse,
  type PocketValueItem,
  type SiteItem,
} from '@/schemas/meta'
import { http } from '@/services/http'

export async function fetchMetaDepts(signal?: AbortSignal): Promise<MetaDeptsResponse> {
  const raw = await http<unknown>('/meta/depts', {
    skipAuth: true,
    signal,
  })
  return MetaDeptsResponseSchema.parse(raw)
}

export async function fetchMetaSites(signal?: AbortSignal): Promise<MetaSitesResponse> {
  const raw = await http<unknown>('/meta/sites', {
    skipAuth: true,
    signal,
  })
  return MetaSitesResponseSchema.parse(raw)
}

export async function fetchUserDirectory(signal?: AbortSignal): Promise<DirectoryUser[]> {
  const raw = await http<unknown>('/users/directory', { signal })
  return DirectoryUserListSchema.parse(raw)
}

export async function fetchPocketTaskTypes(signal?: AbortSignal): Promise<PocketValueItem[]> {
  const raw = await http<unknown>('/pocket/task-types', { signal })
  return PocketValueListSchema.parse(raw)
}

/**
 * Displays a department in the active UI language while preserving `dept.value`
 * (Traditional Chinese, e.g. `"資訊部"`) as the submitted backend key.
 */
export function getDeptDisplayName(dept: DeptItem, locale: string): string {
  if (locale === 'vi' && dept.vn) return dept.vn
  if (locale === 'zh-CN' && dept.zh) return dept.zh
  if (locale === 'zh-TW') return dept.value
  return dept.label || dept.vn || dept.value
}

export function getSiteDisplayName(site: SiteItem, locale: string): string {
  if (locale === 'vi' && site.vn) return `${site.value} - ${site.vn}`
  if (site.name) return `${site.value} - ${site.name}`
  return site.label || site.value
}

// Shared reference/catalog queries intentionally omit `signal` so route transitions
// never cancel in-flight fetches that warm the shared cache across pages.

export function useMetaDepts() {
  return useQuery({
    queryKey: SHARED_QUERY_KEYS.metaDepts,
    queryFn: () => fetchMetaDepts(),
    staleTime: 10 * 60_000,
  })
}

export function useMetaSites() {
  return useQuery({
    queryKey: SHARED_QUERY_KEYS.metaSites,
    queryFn: () => fetchMetaSites(),
    staleTime: 10 * 60_000,
  })
}

export function useUserDirectory() {
  return useQuery({
    queryKey: SHARED_QUERY_KEYS.userDirectory,
    queryFn: () => fetchUserDirectory(),
    staleTime: 5 * 60_000,
  })
}

export function usePocketTaskTypes() {
  return useQuery({
    queryKey: SHARED_QUERY_KEYS.pocketTaskTypes,
    queryFn: () => fetchPocketTaskTypes(),
    staleTime: 5 * 60_000,
  })
}
