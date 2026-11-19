import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { TaskStatusSchema } from '@/schemas/task'
import { STATUS_META, StatusText, FILTER_STATUSES, LEGEND_STATUSES } from './status-text'

const ALL_STATUSES = [...TaskStatusSchema.options, 'urgent'] as const

describe('STATUS_META', () => {
  it('covers every task status plus the urgent flag', () => {
    expect(Object.keys(STATUS_META).sort()).toEqual([...ALL_STATUSES].sort())
  })

  it('points every entry at a translation key that exists', () => {
    for (const status of ALL_STATUSES) {
      const meta = STATUS_META[status]
      expect(meta.labelKey).toMatch(/^status\./)
      expect(i18n.exists(meta.labelKey)).toBe(true)
    }
  })

  it('maps every status to its own label key', () => {
    const labelKeys = ALL_STATUSES.map((status) => STATUS_META[status].labelKey)

    expect(new Set(labelKeys).size).toBe(ALL_STATUSES.length)
  })

  it('uses design tokens instead of raw colors', () => {
    for (const status of ALL_STATUSES) {
      const meta = STATUS_META[status]
      expect(meta.textClass).toMatch(/^text-(status-|primary|destructive|warning)/)
      expect(meta.dotClass).toMatch(/^bg-(status-|primary|destructive|warning)/)
    }
  })

  it('derives filter and legend lists in a stable order', () => {
    const orders = (statuses: readonly (keyof typeof STATUS_META)[]) =>
      statuses.map((status) => STATUS_META[status].order)

    expect(orders(FILTER_STATUSES)).toEqual([...orders(FILTER_STATUSES)].sort((a, b) => a - b))
    expect(orders(LEGEND_STATUSES)).toEqual([...orders(LEGEND_STATUSES)].sort((a, b) => a - b))
    expect(FILTER_STATUSES).not.toContain('urgent')
    expect(LEGEND_STATUSES).toEqual(['new', 'in_progress', 'pending', 'done', 'overdue'])
  })
})

describe('StatusText', () => {
  it('renders the translated label and a decorative dot', () => {
    const { container } = render(<StatusText status="pending" />)

    expect(screen.getByText(i18n.t('status.pending'))).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('accepts an explicit label override', () => {
    render(<StatusText status="done" label="custom" />)

    expect(screen.getByText('custom')).toBeInTheDocument()
  })
})
