import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { DERIVED_TASK_STATUSES } from '@/schemas/task'
import {
  DERIVED_FILTER_STATUSES,
  DERIVED_LEGEND_STATUSES,
  DERIVED_STATUS_META,
  StatusText,
} from './status-text'

const ALL_DERIVED_KEYS = [...DERIVED_TASK_STATUSES, 'paused', 'urgent'] as const

describe('DERIVED_STATUS_META', () => {
  it('covers every derived task status plus paused and urgent flags', () => {
    expect(Object.keys(DERIVED_STATUS_META).sort()).toEqual([...ALL_DERIVED_KEYS].sort())
  })

  it('points every entry at a translation key that exists', () => {
    for (const status of ALL_DERIVED_KEYS) {
      const meta = DERIVED_STATUS_META[status]
      expect(meta.labelKey).toMatch(/^status\./)
      expect(i18n.exists(meta.labelKey)).toBe(true)
    }
  })

  it('maps every status to its own label key', () => {
    const labelKeys = ALL_DERIVED_KEYS.map((status) => DERIVED_STATUS_META[status].labelKey)
    expect(new Set(labelKeys).size).toBe(ALL_DERIVED_KEYS.length)
  })

  it('uses design tokens instead of raw colors', () => {
    for (const status of ALL_DERIVED_KEYS) {
      const meta = DERIVED_STATUS_META[status]
      expect(meta.textClass).toMatch(/^text-(status-|primary|destructive|warning)/)
      expect(meta.dotClass).toMatch(/^bg-(status-|primary|destructive|warning)/)
    }
  })

  it('derives filter and legend lists in a stable order', () => {
    const orders = (statuses: readonly (keyof typeof DERIVED_STATUS_META)[]) =>
      statuses.map((status) => DERIVED_STATUS_META[status].order)

    expect(orders(DERIVED_FILTER_STATUSES)).toEqual(
      [...orders(DERIVED_FILTER_STATUSES)].sort((a, b) => a - b),
    )
    expect(orders(DERIVED_LEGEND_STATUSES)).toEqual(
      [...orders(DERIVED_LEGEND_STATUSES)].sort((a, b) => a - b),
    )
    expect(DERIVED_FILTER_STATUSES).not.toContain('urgent')
    expect(DERIVED_LEGEND_STATUSES).toEqual([
      'not_started',
      'in_progress',
      'delayed_pending',
      'completed_ontime',
      'late_completed',
      'paused',
    ])
  })
})

describe('StatusText', () => {
  it('renders the translated label and a decorative dot', () => {
    const { container } = render(<StatusText status="delayed_pending" />)

    expect(screen.getByText(i18n.t('status.delayed_pending'))).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('accepts an explicit label override', () => {
    render(<StatusText status="completed_ontime" label="custom" />)

    expect(screen.getByText('custom')).toBeInTheDocument()
  })
})
