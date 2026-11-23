import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ScrollToTopButton } from './ScrollToTopButton'

function TestHarness({ onScrollTo }: { onScrollTo: (opts: ScrollToOptions) => void }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      ref.current.scrollTo = onScrollTo as typeof ref.current.scrollTo
    }
  }, [onScrollTo])

  return (
    <div>
      <div ref={ref} data-testid="scroll-container" />
      <ScrollToTopButton scrollContainerRef={ref} />
    </div>
  )
}

describe('ScrollToTopButton', () => {
  it('stays hidden near top, appears after scrolling past threshold, and scrolls container to top on click', async () => {
    const scrollToSpy = vi.fn()
    render(<TestHarness onScrollTo={scrollToSpy} />)

    expect(screen.queryByRole('button', { name: 'Lên đầu trang' })).not.toBeInTheDocument()

    const container = screen.getByTestId('scroll-container')
    Object.defineProperty(container, 'scrollTop', { configurable: true, value: 400 })
    fireEvent.scroll(container)

    const button = screen.getByRole('button', { name: 'Lên đầu trang' })
    expect(button).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(button)
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })

    Object.defineProperty(container, 'scrollTop', { configurable: true, value: 100 })
    fireEvent.scroll(container)
    expect(screen.queryByRole('button', { name: 'Lên đầu trang' })).not.toBeInTheDocument()
  })
})
