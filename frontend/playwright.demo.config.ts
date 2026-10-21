import { defineConfig, devices } from '@playwright/test';

/**
 * Slow walkthrough recorded for the README.
 * Kept out of `playwright.config.ts` so `yarn e2e` stays a fast check.
 */
export default defineConfig({
  testDir: './e2e/demo',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  outputDir: './demo-results',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    video: { mode: 'on', size: { width: 1280, height: 800 } },
    launchOptions: { slowMo: 40 },
  },
  webServer: {
    command: 'yarn build && node server-dist/index.js',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { PORT: '4173' },
  },
});
