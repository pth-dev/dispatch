import { describe, expect, it } from 'vitest'
import type { TaskListResponse } from '@/schemas/task'

// Node's fetch does not resolve relative URLs, so handlers are addressed absolutely.
// MSW matches them by pathname, which is what the browser worker does too.
const TASKS_URL = 'http://localhost:3000/api/tasks'

async function getTasks(query = '') {
  const response = await fetch(`${TASKS_URL}${query ? `?${query}` : ''}`)
  expect(response.status).toBe(200)
  return (await response.json()) as TaskListResponse
}

describe('GET /api/tasks', () => {
  it('returns the documented list envelope with counts', async () => {
    const body = await getTasks('scope=all&pageSize=50')

    expect(Array.isArray(body.items)).toBe(true)
    expect(body.total).toBeGreaterThan(0)
    expect(body.counts.all).toBe(body.total)
  })

  it('narrows the mine scope to the current user and reports stable counts', async () => {
    const body = await getTasks('scope=mine&pageSize=50')

    expect(body.total).toBe(body.counts.mine)
    for (const task of body.items) {
      expect(task.assignee).toBe('Nguyễn An')
    }
  })

  it('keeps counts independent from filters (brief §5.1)', async () => {
    const unfiltered = await getTasks('scope=all&pageSize=50')
    const filtered = await getTasks('scope=all&status=pending&pageSize=50')

    expect(filtered.counts).toEqual(unfiltered.counts)
    expect(filtered.total).toBeLessThanOrEqual(unfiltered.total)
    for (const task of filtered.items) {
      expect(task.status).toBe('pending')
    }
  })

  it('filters by keyword across id and title', async () => {
    const all = await getTasks('scope=all&pageSize=50')
    const sample = all.items[0]

    expect(sample).toBeDefined()
    const body = await getTasks(`scope=all&search=${encodeURIComponent(sample!.id)}`)

    expect(body.total).toBeGreaterThanOrEqual(1)
    for (const task of body.items) {
      expect(`${task.id} ${task.title}`.toLowerCase()).toContain(sample!.id.toLowerCase())
    }
  })

  it('returns an empty page past the end without losing the total', async () => {
    const first = await getTasks('scope=all&page=1&pageSize=10')
    const beyond = await getTasks('scope=all&page=99&pageSize=10')

    expect(beyond.items).toEqual([])
    expect(beyond.total).toBe(first.total)
  })

  it('serves a simulated 500 when the mock scenario is set', async () => {
    const { useAppStore } = await import('@/app/store')
    useAppStore.setState({ mockScenario: '500' })

    const response = await fetch(TASKS_URL)

    expect(response.status).toBe(500)
  })
})
