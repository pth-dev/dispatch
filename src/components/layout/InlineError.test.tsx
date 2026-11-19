import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { InlineError } from './InlineError'

describe('InlineError', () => {
  it('renders the shared copy for the status', () => {
    render(<InlineError status="500" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('errors.status.500.title'))).toBeInTheDocument()
    expect(screen.getByText(i18n.t('errors.status.500.description'))).toBeInTheDocument()
  })

  it('shows the attempt-dependent label for client errors', () => {
    render(<InlineError status="408" />)

    expect(screen.getByText(i18n.t('errors.status.408.title'))).toBeInTheDocument()
  })

  it('calls onRetry when the retry button is pressed', async () => {
    const onRetry = vi.fn()
    render(<InlineError status="network" onRetry={onRetry} />)

    await userEvent.click(screen.getByRole('button', { name: i18n.t('common.retry') }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('omits the retry button when no handler is provided', () => {
    render(<InlineError status="500" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
