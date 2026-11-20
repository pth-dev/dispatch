import { http } from '@/services/http'
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

export async function fetchMetaDepts(signal?: AbortSignal): Promise<MetaDeptsResponse> {
  const raw = await http<unknown>('/meta/depts', {
    skipAuth: true,
    cache: 'no-store',
    signal,
  })
  return MetaDeptsResponseSchema.parse(raw)
}

export async function fetchMetaSites(signal?: AbortSignal): Promise<MetaSitesResponse> {
  const raw = await http<unknown>('/meta/sites', {
    skipAuth: true,
    cache: 'no-store',
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
