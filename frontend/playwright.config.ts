import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against a production build served by `vite preview`.
 * Projects cover desktop Chrome, Firefox and Safari (WebKit) plus Android (Pixel) and iOS (iPhone) emulation.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit (Safari)', use: { ...devices['Desktop Safari'] } },
    { name: 'android (Pixel 7)', use: { ...devices['Pixel 7'] } },
    { name: 'ios (iPhone 14)', use: { ...devices['iPhone 14'] } },
  ],
});
