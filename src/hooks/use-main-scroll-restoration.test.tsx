import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { useMainScrollRestoration } from './use-main-scroll-restoration'

function TestShell({
  isReady = true,
  children,
}: {
  isReady?: boolean
  children: React.ReactNode
}) {
  const mainRef = React.useRef<HTMLElement>(null)
  useMainScrollRestoration(mainRef, isReady)

  if (!isReady) {
    return <div>Loading...</div>
  }

  return (
    <main ref={mainRef} data-testid="main-scroll">
      {children}
    </main>
  )
}

function TasksStub() {
  const navigate = useNavigate()
  return (
    <div>
      <Link to="/messages">Go Messages</Link>
      <Link to="/tasks/521#report-12">Go Hash</Link>
      <button type="button" onClick={() => navigate('/tasks?status=pending')}>
        Apply Filter
      </button>
      <button type="button" onClick={() => navigate('/messages', { replace: true })}>
        Replace Messages
      </button>
    </div>
  )
}

function MessagesStub() {
  const navigate = useNavigate()
  return (
    <div>
      <button type="button" onClick={() => navigate(-1)}>
        Go Back
      </button>
    </div>
  )
}

function TaskDetailStub() {
  return (
    <div>
      <div id="report-12">Report 12</div>
    </div>
  )
}

function renderHarness(initialEntries = ['/tasks'], isReady = true) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TestShell isReady={isReady}>
        <Routes>
          <Route path="/tasks" element={<TasksStub />} />
          <Route path="/messages" element={<MessagesStub />} />
          <Route path="/tasks/:id" element={<TaskDetailStub />} />
        </Routes>
      </TestShell>
    </MemoryRouter>,
  )
}

describe('useMainScrollRestoration', () => {
  it('scrolls to top on route PUSH and restores previous scrollTop on POP (Back)', async () => {
    const user = userEvent.setup()
    renderHarness()

    const main = screen.getByTestId('main-scroll')
    main.scrollTop = 480
    fireEvent.scroll(main)

    await user.click(screen.getByRole('link', { name: 'Go Messages' }))
    expect(main.scrollTop).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Go Back' }))
    expect(main.scrollTop).toBe(480)
  })

  it('preserves scrollTop on query param change and restores it after PUSH then POP', async () => {
    const user = userEvent.setup()
    renderHarness()

    const main = screen.getByTestId('main-scroll')
    main.scrollTop = 320
    fireEvent.scroll(main)

    await user.click(screen.getByRole('button', { name: 'Apply Filter' }))
    expect(main.scrollTop).toBe(320)

    // Leave to another route without scrolling again, then come back via POP
    await user.click(screen.getByRole('link', { name: 'Go Messages' }))
    expect(main.scrollTop).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Go Back' }))
    expect(main.scrollTop).toBe(320)
  })

  it('scrolls to top on REPLACE navigation when pathname changes', async () => {
    const user = userEvent.setup()
    renderHarness()

    const main = screen.getByTestId('main-scroll')
    main.scrollTop = 410
    fireEvent.scroll(main)

    await user.click(screen.getByRole('button', { name: 'Replace Messages' }))
    expect(main.scrollTop).toBe(0)
  })

  it('scrolls to the target element inside main when navigating to a hash anchor', async () => {
    const user = userEvent.setup()
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
    const scrollIntoViewMock = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    try {
      renderHarness()
      const main = screen.getByTestId('main-scroll')
      main.scrollTop = 250
      fireEvent.scroll(main)

      await user.click(screen.getByRole('link', { name: 'Go Hash' }))
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'instant',
        block: 'start',
      })
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    }
  })

  it('attaches scroll tracking once isReady transitions from false to true', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <MemoryRouter initialEntries={['/tasks']}>
        <TestShell isReady={false}>
          <Routes>
            <Route path="/tasks" element={<TasksStub />} />
            <Route path="/messages" element={<MessagesStub />} />
          </Routes>
        </TestShell>
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    rerender(
      <MemoryRouter initialEntries={['/tasks']}>
        <TestShell isReady={true}>
          <Routes>
            <Route path="/tasks" element={<TasksStub />} />
            <Route path="/messages" element={<MessagesStub />} />
          </Routes>
        </TestShell>
      </MemoryRouter>,
    )

    const main = screen.getByTestId('main-scroll')
    main.scrollTop = 500
    fireEvent.scroll(main)

    await user.click(screen.getByRole('link', { name: 'Go Messages' }))
    expect(main.scrollTop).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Go Back' }))
    expect(main.scrollTop).toBe(500)
  })
})
