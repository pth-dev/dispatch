import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RawTask } from '@/schemas/task'
import { TaskMobileList } from './TaskMobileList'

function buildTasks(count: number): RawTask[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: idx + 1,
    title: `Nhiệm vụ mobile #${idx + 1}`,
    task_type: 'Hệ thống',
    site: 'YS',
    assigned_unit: '資訊部',
    assign_person: 'hieu',
    reporter: 'hieu',
    due_date: '2026-12-10T17:00',
    progress: 20,
    paused: 0,
    confidential: 0,
    cross_dept: 0,
  }))
}

describe('TaskMobileList infinite scroll', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('automatically loads the next batch when the sentinel intersects the viewport', () => {
    let triggerIntersect: ((isIntersecting: boolean) => void) | null = null

    class MockIntersectionObserver {
      private callback: IntersectionObserverCallback
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        triggerIntersect = (isIntersecting: boolean) => {
          this.callback(
            [{ isIntersecting } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          )
        }
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return []
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TaskMobileList tasks={buildTasks(25)} isLoading={false} resetKey="all" />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getAllByTestId('task-mobile-row')).toHaveLength(18)
    expect(screen.getByTestId('infinite-sentinel-incomplete')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /xem thêm/i })).not.toBeInTheDocument()

    act(() => {
      triggerIntersect?.(true)
    })

    expect(screen.getAllByTestId('task-mobile-row')).toHaveLength(25)
    expect(screen.queryByTestId('infinite-sentinel-incomplete')).not.toBeInTheDocument()
  })
})
