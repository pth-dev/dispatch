import * as React from 'react'
import { useSearchParams } from 'react-router'
import { useAppStore } from '@/app/store'
import {
  TaskFlagFilterSchema,
  TaskListParamsSchema,
  type TaskFlagFilter,
  type TaskListParams,
  type TaskSortMode,
} from '@/schemas/task'
import { getDefaultTaskScope } from '@/utils/permissions'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

export const TASK_FLAG_LABEL_KEYS: Record<TaskFlagFilter, string> = {
  recurring: 'tasks.filter.flagRecurring',
  recur_today: 'tasks.filter.flagRecurToday',
  cross: 'tasks.filter.flagCross',
  reader: 'tasks.filter.flagReader',
}

function parseFlagsParam(raw: string | null): TaskFlagFilter[] | undefined {
  if (!raw) return undefined
  const valid = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is TaskFlagFilter => TaskFlagFilterSchema.safeParse(s).success)
  const unique = Array.from(new Set(valid))
  return unique.length > 0 ? unique : undefined
}

function readNonAllParam(searchParams: URLSearchParams, key: string): string | undefined {
  const val = searchParams.get(key)?.trim()
  if (!val || val === 'all') return undefined
  return val
}

function parseUrlParams(
  searchParams: URLSearchParams,
  defaultScope: 'mine' | 'all',
): TaskListParams {
  const rawSize = Number(searchParams.get('size') || searchParams.get('pageSize') || DEFAULT_PAGE_SIZE)
  const raw = {
    scope: searchParams.get('scope') ?? defaultScope,
    search: searchParams.get('search') || undefined,
    fromDate: searchParams.get('fromDate') || undefined,
    toDate: searchParams.get('toDate') || undefined,
    department: readNonAllParam(searchParams, 'department'),
    status: readNonAllParam(searchParams, 'status'),
    site: readNonAllParam(searchParams, 'site'),
    level: readNonAllParam(searchParams, 'level'),
    taskType: readNonAllParam(searchParams, 'taskType'),
    confidential: readNonAllParam(searchParams, 'confidential'),
    flags: parseFlagsParam(searchParams.get('flags')),
    sort: searchParams.get('sort') ?? 'default',
    page: searchParams.get('page') ?? DEFAULT_PAGE,
    pageSize: rawSize === 20 || rawSize === 30 || rawSize === 50 ? rawSize : DEFAULT_PAGE_SIZE,
  }

  const parsed = TaskListParamsSchema.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }

  const scopeParsed = TaskListParamsSchema.shape.scope.safeParse(raw.scope)
  const fromParsed = TaskListParamsSchema.shape.fromDate.safeParse(raw.fromDate)
  const toParsed = TaskListParamsSchema.shape.toDate.safeParse(raw.toDate)
  const statusParsed = TaskListParamsSchema.shape.status.safeParse(raw.status)
  const levelParsed = TaskListParamsSchema.shape.level.safeParse(raw.level)
  const confParsed = TaskListParamsSchema.shape.confidential.safeParse(raw.confidential)
  const sortParsed = TaskListParamsSchema.shape.sort.safeParse(raw.sort)
  const pageParsed = TaskListParamsSchema.shape.page.safeParse(raw.page)

  return {
    scope: scopeParsed.success ? scopeParsed.data : defaultScope,
    search: raw.search,
    fromDate: fromParsed.success ? fromParsed.data : undefined,
    toDate: toParsed.success ? toParsed.data : undefined,
    department: raw.department,
    status: statusParsed.success ? statusParsed.data : undefined,
    site: raw.site,
    level: levelParsed.success ? levelParsed.data : undefined,
    taskType: raw.taskType,
    confidential: confParsed.success ? confParsed.data : undefined,
    flags: raw.flags,
    sort: sortParsed.success ? sortParsed.data : 'default',
    page: pageParsed.success ? pageParsed.data : DEFAULT_PAGE,
    pageSize: raw.pageSize as 10 | 20 | 30 | 50,
  }
}

export type TaskFilterPatch = {
  search?: string
  fromDate?: string
  toDate?: string
  department?: string
  status?: string
  site?: string
  level?: string
  taskType?: string
  confidential?: string
  flags?: TaskFlagFilter[]
}

const STRING_FILTER_KEYS: ReadonlyArray<
  Exclude<keyof TaskFilterPatch, 'flags'>
> = ['search', 'fromDate', 'toDate', 'department', 'status', 'site', 'level', 'taskType', 'confidential']

export function useTaskListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAppStore((s) => s.user)
  const defaultScope = getDefaultTaskScope(user)

  const params = parseUrlParams(searchParams, defaultScope)

  let activeFilterCount = 0
  if (params.search) activeFilterCount++
  if (params.fromDate) activeFilterCount++
  if (params.toDate) activeFilterCount++
  if (params.department && params.department !== 'all') activeFilterCount++
  if (params.status) activeFilterCount++
  if (params.site) activeFilterCount++
  if (params.level) activeFilterCount++
  if (params.taskType) activeFilterCount++
  if (params.confidential) activeFilterCount++
  if (params.flags) activeFilterCount += params.flags.length

  let advancedFilterCount = 0
  if (params.fromDate) advancedFilterCount++
  if (params.toDate) advancedFilterCount++
  if (params.site) advancedFilterCount++
  if (params.level) advancedFilterCount++
  if (params.taskType) advancedFilterCount++
  if (params.confidential) advancedFilterCount++
  if (params.flags) advancedFilterCount += params.flags.length

  const setScope = (newScope: 'mine' | 'created' | 'all') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newScope === defaultScope) next.delete('scope')
        else next.set('scope', newScope)
        next.delete('page')
        return next
      },
      { replace: false },
    )
  }

  const setSort = (newSort: TaskSortMode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newSort === 'default') next.delete('sort')
        else next.set('sort', newSort)
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const patchFilters = (patch: TaskFilterPatch) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of STRING_FILTER_KEYS) {
          if (!(key in patch)) continue
          const value = patch[key]
          if (value && value !== 'all') next.set(key, value)
          else next.delete(key)
        }
        if ('flags' in patch) {
          const unique = Array.from(new Set(patch.flags ?? []))
          if (unique.length > 0) next.set('flags', unique.join(','))
          else next.delete('flags')
        }
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const setFilters = (filters: TaskFilterPatch) => {
    patchFilters({
      search: filters.search,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      department: filters.department,
      status: filters.status,
      site: filters.site,
      level: filters.level,
      taskType: filters.taskType,
      confidential: filters.confidential,
      flags: filters.flags,
    })
  }

  const resetFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of STRING_FILTER_KEYS) next.delete(key)
        next.delete('flags')
        next.delete('page')
        return next
      },
      { replace: false },
    )
  }

  const setPage = (newPage: number, options?: { replace?: boolean }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newPage <= DEFAULT_PAGE) next.delete('page')
        else next.set('page', newPage.toString())
        return next
      },
      { replace: options?.replace ?? false },
    )
  }

  const setPageSize = (newSize: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newSize === DEFAULT_PAGE_SIZE) {
          next.delete('size')
          next.delete('pageSize')
        } else {
          next.set('size', newSize.toString())
          next.delete('pageSize')
        }
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return {
    params,
    activeFilterCount,
    advancedFilterCount,
    setScope,
    setSort,
    patchFilters,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
  }
}

export type PageClampOptions = {
  page: number
  pageSize: number
  total?: number
  isPlaceholderData?: boolean
  setPage: (page: number, options?: { replace?: boolean }) => void
}

/**
 * Brief §5.1: a page beyond the last page is replaced (history replace) by the
 * last page once the total is known. Placeholder data is a previous query's
 * total, so it must never drive a clamp.
 */
export function usePageClamp({
  page,
  pageSize,
  total,
  isPlaceholderData = false,
  setPage,
}: PageClampOptions) {
  React.useEffect(() => {
    if (isPlaceholderData || total === undefined) return
    const lastPage = Math.max(1, Math.ceil(total / pageSize))
    if (page > lastPage) setPage(lastPage, { replace: true })
  }, [page, pageSize, total, isPlaceholderData, setPage])
}
