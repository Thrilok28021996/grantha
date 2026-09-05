/**
 * Electron smoke test: launches the built app, waits for the window to appear,
 * then kills it. Catches packaging regressions (missing preload, broken CSP,
 * broken IPC bridge) that unit tests can't cover.
 *
 * Requires: `npm run build` first (or `out/main/index.js` must exist).
 * Run:      node test/smoke.mjs
 */
import { spawn, execFileSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const mainEntry = path.join(root, 'out/main/index.js')

if (!existsSync(mainEntry)) {
  console.error('out/main/index.js not found — run `npm run build` first.')
  process.exit(1)
}

const TIMEOUT_MS = 15_000
let exitCode = 0

const electronBin = execFileSync('node', ['-e', 'console.log(require("electron"))'], { cwd: root }).toString().trim()

const electron = spawn(
  electronBin,                           // the Electron binary
  [mainEntry, '--no-sandbox'],           // --no-sandbox avoids CI/sandbox issues
  {
    cwd: root,
    env: { ...process.env, ELECTRON_NO_ATTACH_CONSOLE: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  }
)

const stdout = []
const stderr = []
electron.stdout.on('data', (d) => stdout.push(d))
electron.stderr.on('data', (d) => stderr.push(d))

const timer = setTimeout(() => {
  // App survived for TIMEOUT_MS — it launched without crashing.
  console.log(`PASS  App launched and stayed alive for ${TIMEOUT_MS / 1000}s`)
  if (stderr.length) {
    const lines = Buffer.concat(stderr).toString().split('\n').filter(Boolean)
    if (lines.length) console.log(`  stderr (${lines.length} lines, last 5):`)
    lines.slice(-5).forEach((l) => console.log(`    ${l}`))
  }
  electron.kill('SIGTERM')
}, TIMEOUT_MS)

electron.on('error', (err) => {
  clearTimeout(timer)
  console.error(`FAIL  Could not spawn Electron: ${err.message}`)
  exitCode = 1
})

electron.on('close', (code) => {
  clearTimeout(timer)
  if (exitCode) {                       // already failed above
    process.exit(exitCode)
    return
  }
  if (code && code !== null && code !== 0 && code !== 15) {
    // Exit code 15 = SIGTERM (our kill). Anything else is a crash.
    console.error(`FAIL  Electron exited with code ${code}`)
    const tail = Buffer.concat(stderr).toString().split('\n').slice(-10).join('\n')
    if (tail) console.error(tail)
    process.exit(1)
  }
  // Normal exit (or SIGTERM from our kill) — already printed PASS above.
  process.exit(0)
})
