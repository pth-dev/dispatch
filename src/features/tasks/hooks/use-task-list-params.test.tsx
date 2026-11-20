import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { usePageClamp, useTaskListParams } from './use-task-list-params'

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  }
}

function useListHarness(total?: number, isPlaceholderData = false) {
  const list = useTaskListParams()
  usePageClamp({
    page: list.params.page,
    pageSize: list.params.pageSize,
    total,
    isPlaceholderData,
    setPage: list.setPage,
  })
  const location = useLocation()
  return { ...list, location }
}

describe('useTaskListParams', () => {
  it('returns documented defaults and writes nothing to the URL', () => {
    const { result } = renderHook(() => useListHarness(), {
      wrapper: createWrapper('/tasks'),
    })

    expect(result.current.params).toMatchObject({
      scope: 'mine',
      page: 1,
      pageSize: 10,
      search: undefined,
      fromDate: undefined,
      toDate: undefined,
      department: undefined,
      status: undefined,
    })
    expect(result.current.activeFilterCount).toBe(0)
    expect(result.current.location.search).toBe('')
  })

  it('falls back safely for invalid values instead of passing them through', () => {
    const { result } = renderHook(() => useListHarness(), {
      wrapper: createWrapper('/tasks?scope=bogus&page=abc&size=99&status=bogus&department='),
    })

    expect(result.current.params.scope).toBe('mine')
    expect(result.current.params.page).toBe(1)
    expect(result.current.params.pageSize).toBe(10)
    expect(result.current.params.status).toBeUndefined()
    expect(result.current.params.department).toBeUndefined()
  })

  it('omits the default scope from the URL and writes a non-default one', () => {
    const { result } = renderHook(() => useListHarness(), {
      wrapper: createWrapper('/tasks?page=3'),
    })

    act(() => result.current.setScope('created'))
    expect(result.current.location.search).toBe('?scope=created')
    expect(result.current.params.page).toBe(1)

    act(() => result.current.setScope('mine'))
    expect(result.current.location.search).toBe('')
  })

  it('keeps filters in the URL, clears them on reset and resets the page', () => {
    const { result } = renderHook(() => useListHarness(), {
      wrapper: createWrapper('/tasks?page=4&search=api'),
    })

    act(() =>
      result.current.setFilters({
        search: 'module',
        department: '資訊部',
        status: 'delayed_pending',
        fromDate: '2026-11-01',
        toDate: '2026-11-30',
      }),
    )

    expect(result.current.params).toMatchObject({
      search: 'module',
      department: '資訊部',
      status: 'delayed_pending',
      fromDate: '2026-11-01',
      toDate: '2026-11-30',
      page: 1,
    })
    expect(result.current.activeFilterCount).toBe(5)
    expect(result.current.location.search).not.toContain('page=')

    act(() => result.current.resetFilters())
    expect(result.current.location.search).toBe('')
    expect(result.current.activeFilterCount).toBe(0)
  })

  it('writes size and drops both size aliases when returning to the default', () => {
    const { result } = renderHook(() => useListHarness(), {
      wrapper: createWrapper('/tasks?page=2&pageSize=20'),
    })

    expect(result.current.params.pageSize).toBe(20)

    act(() => result.current.setPageSize(30))
    expect(result.current.params.pageSize).toBe(30)
    expect(result.current.params.page).toBe(1)
    expect(result.current.location.search).toBe('?size=30')

    act(() => result.current.setPageSize(10))
    expect(result.current.location.search).toBe('')
  })

  it('clamps a page beyond the last page with a replace, once total is known', () => {
    const { result } = renderHook(() => useListHarness(25), {
      wrapper: createWrapper('/tasks?page=99&search=api'),
    })

    expect(result.current.params.page).toBe(3)
    expect(result.current.location.search).toBe('?page=3&search=api')
  })

  it('does not clamp while the total is unknown or still placeholder data', () => {
    const unknownTotal = renderHook(() => useListHarness(undefined), {
      wrapper: createWrapper('/tasks?page=99'),
    })
    const placeholder = renderHook(() => useListHarness(25, true), {
      wrapper: createWrapper('/tasks?page=99'),
    })
    const emptyTotal = renderHook(() => useListHarness(0), {
      wrapper: createWrapper('/tasks?page=99'),
    })

    expect(unknownTotal.result.current.params.page).toBe(99)
    expect(unknownTotal.result.current.location.search).toBe('?page=99')
    expect(placeholder.result.current.params.page).toBe(99)
    expect(placeholder.result.current.location.search).toBe('?page=99')
    expect(emptyTotal.result.current.params.page).toBe(99)
    expect(emptyTotal.result.current.location.search).toBe('?page=99')
  })
})
