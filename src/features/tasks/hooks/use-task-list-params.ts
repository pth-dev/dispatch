import * as React from 'react'
import { useSearchParams } from 'react-router'
import { TaskStatusSchema, type TaskListParams } from '@/schemas/task'

const DEFAULT_SCOPE = 'mine'
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

export function useTaskListParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const rawScope = searchParams.get('scope')
  const scope: 'mine' | 'created' | 'all' =
    rawScope === 'created' || rawScope === 'all' ? rawScope : 'mine'

  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE

  const rawPageSize = parseInt(searchParams.get('size') || searchParams.get('pageSize') || '10', 10)
  const pageSize: 10 | 20 | 30 | 50 =
    rawPageSize === 20 || rawPageSize === 30 || rawPageSize === 50 ? rawPageSize : 10

  const search = searchParams.get('search') || undefined
  const fromDate = searchParams.get('fromDate') || undefined
  const toDate = searchParams.get('toDate') || undefined
  const department = searchParams.get('department') || undefined
  const parsedStatus = TaskStatusSchema.safeParse(searchParams.get('status'))
  const status = parsedStatus.success ? parsedStatus.data : undefined

  const params: TaskListParams = {
    scope,
    search,
    fromDate,
    toDate,
    department,
    status,
    page,
    pageSize,
  }

  // Count active filters (excluding scope, page, pageSize)
  let activeFilterCount = 0
  if (params.search) activeFilterCount++
  if (params.fromDate) activeFilterCount++
  if (params.toDate) activeFilterCount++
  if (params.department && params.department !== 'all') activeFilterCount++
  if (params.status && (params.status as string) !== 'all') activeFilterCount++

  // Functional setter to safely write to URL params
  const setScope = (newScope: 'mine' | 'created' | 'all') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newScope === DEFAULT_SCOPE) {
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

export interface PageClampOptions {
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
    if (isPlaceholderData || !total || total <= 0) return
    const lastPage = Math.max(1, Math.ceil(total / pageSize))
    if (page > lastPage) setPage(lastPage, { replace: true })
  }, [page, pageSize, total, isPlaceholderData, setPage])
}
