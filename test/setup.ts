import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// Stub the Electron preload bridge — component tests never call it, but
// some modules reference `window.verso` at import time.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).verso = new Proxy(
    {},
    {
      get: () => () => {
        throw new Error('window.verso stub — not configured for this test')
      }
    }
  )
}
