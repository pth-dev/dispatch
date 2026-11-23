import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingSpinner } from './loading-spinner'

describe('LoadingSpinner', () => {
  it('renders an animated spinner with default localized sr-only status label', () => {
    render(<LoadingSpinner />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Đang tải dữ liệu...')).toHaveClass('sr-only')
    expect(status.querySelector('svg')).toHaveClass('animate-spin')
  })

  it('supports custom label and size variants', () => {
    render(<LoadingSpinner size="lg" label="Đang tải thêm..." />)

    const status = screen.getByRole('status')
    expect(screen.getByText('Đang tải thêm...')).toHaveClass('sr-only')
    expect(status.querySelector('svg')).toHaveClass('size-6')
  })
})
