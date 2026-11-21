import * as React from 'react'
import { useSearchParams } from 'react-router'
import { useAppStore } from '@/app/store'
import { TaskListParamsSchema, type TaskListParams } from '@/schemas/task'
import { getDefaultTaskScope } from '@/utils/permissions'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

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
    department: searchParams.get('department') || undefined,
    status: searchParams.get('status') || undefined,
    page: searchParams.get('page') ?? DEFAULT_PAGE,
    pageSize: rawSize === 20 || rawSize === 30 || rawSize === 50 ? rawSize : DEFAULT_PAGE_SIZE,
  }

  const parsed = TaskListParamsSchema.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }

  // Fallback field-by-field if a single URL param is malformed
  const scopeParsed = TaskListParamsSchema.shape.scope.safeParse(raw.scope)
  const fromParsed = TaskListParamsSchema.shape.fromDate.safeParse(raw.fromDate)
  const toParsed = TaskListParamsSchema.shape.toDate.safeParse(raw.toDate)
  const statusParsed = TaskListParamsSchema.shape.status.safeParse(raw.status)
  const pageParsed = TaskListParamsSchema.shape.page.safeParse(raw.page)

  return {
    scope: scopeParsed.success ? scopeParsed.data : defaultScope,
    search: raw.search,
    fromDate: fromParsed.success ? fromParsed.data : undefined,
    toDate: toParsed.success ? toParsed.data : undefined,
    department: raw.department,
    status: statusParsed.success ? statusParsed.data : undefined,
    page: pageParsed.success ? pageParsed.data : DEFAULT_PAGE,
    pageSize: raw.pageSize as 10 | 20 | 30 | 50,
  }
}

export function useTaskListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAppStore((s) => s.user)
  const defaultScope = getDefaultTaskScope(user)

  const params = parseUrlParams(searchParams, defaultScope)

  // Count active filters (excluding scope, page, pageSize)
  let activeFilterCount = 0
  if (params.search) activeFilterCount++
  if (params.fromDate) activeFilterCount++
  if (params.toDate) activeFilterCount++
  if (params.department && params.department !== 'all') activeFilterCount++
  if (params.status) activeFilterCount++

  // Functional setter to safely write to URL params
  const setScope = (newScope: 'mine' | 'created' | 'all') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newScope === defaultScope) {
          next.delete('scope')
        } else {
          next.set('scope', newScope)
        }
        next.delete('page') // Reset to page 1
        return next
      },
      { replace: false },
    )
  }

  const setFilters = (filters: {
    search?: string
    fromDate?: string
    toDate?: string
    department?: string
    status?: string
  }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (filters.search) next.set('search', filters.search)
        else next.delete('search')

        if (filters.fromDate) next.set('fromDate', filters.fromDate)
        else next.delete('fromDate')

        if (filters.toDate) next.set('toDate', filters.toDate)
        else next.delete('toDate')

        if (filters.department && filters.department !== 'all') {
          next.set('department', filters.department)
        } else {
          next.delete('department')
        }

        if (filters.status && filters.status !== 'all') {
          next.set('status', filters.status)
        } else {
          next.delete('status')
        }

        next.delete('page') // Reset to page 1
        return next
      },
      { replace: false },
    )
  }

  const resetFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('search')
        next.delete('fromDate')
        next.delete('toDate')
        next.delete('department')
        next.delete('status')
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
        if (newPage <= DEFAULT_PAGE) {
          next.delete('page')
        } else {
          next.set('page', newPage.toString())
        }
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
          next.delete('pageSize') // drop the deprecated alias so it cannot linger
        }
        next.delete('page') // Reset to page 1
        return next
      },
      { replace: true },
    )
  }

  return {
    params,
    activeFilterCount,
    setScope,
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
