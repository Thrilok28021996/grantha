/// <reference types="vite/client" />
import type { GranthaApi } from '../../shared/types'

declare global {
  interface Window {
    grantha: GranthaApi
  }
}

export {}
