import '@testing-library/jest-dom/vitest'
import '@/i18n'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from '@/mocks/server'
import { useAppStore } from '@/app/store'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

beforeEach(() => {
  // Keep handler tests fast and deterministic: no artificial delay, normal scenario.
  useAppStore.setState({ mockDelayMs: 0, mockScenario: 'normal' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
