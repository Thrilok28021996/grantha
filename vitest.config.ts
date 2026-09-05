import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // .test.ts files run in node (pure libs); .test.tsx files override to jsdom
    // via the per-file directive at the top of each component test.
    environment: 'node',
    setupFiles: ['test/setup.ts']
  }
})
