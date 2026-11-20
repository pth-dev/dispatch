import '@testing-library/jest-dom/vitest'
import '@/i18n'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

afterEach(() => {
  cleanup()
})
