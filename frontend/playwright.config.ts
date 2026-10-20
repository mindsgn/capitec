import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end configuration for the loan simulator.
 *
 * - `webServer` starts the same Vite dev server used for development
 *   (`npm run dev`), reusing one that is already running outside CI so local
 *   runs are fast and CI always gets a clean, strict-port server.
 * - Chromium (desktop) is the baseline project; the Pixel 7 project adds a
 *   representative mobile viewport and touch context on the same engine.
 * - Firefox/WebKit are opt-in (`PW_CROSS_BROWSER=1`) — the binaries are large
 *   and the app is engine-agnostic, so they are available on demand rather
 *   than in every run.
 * - Failures keep a screenshot, a video and (once a retry happens) a full
 *   trace; the HTML report is written to `playwright-report/`.
 */

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

/** Desktop baseline and mobile viewport; extra engines only when asked for. */
const projects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
  },
  {
    name: 'mobile',
    use: { ...devices['Pixel 7'] },
  },
]

if (process.env.PW_CROSS_BROWSER) {
  projects.push(
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  )
}

export default defineConfig({
  testDir: './tests/e2e',
  /* Every test runs in its own context, so files may run fully in parallel. */
  fullyParallel: true,
  /* Leftover `test.only` must not silently drop coverage in CI. */
  forbidOnly: !!process.env.CI,
  /* CI retries absorb environment flakes; local runs fail fast and loud. */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    /* Diagnostics for a failing test, without recording every passing run. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  projects,

  outputDir: './test-results',

  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
