import { expect, test as base } from '@playwright/test'

/**
 * The suite's shared `test`.
 *
 * One automatic fixture guards every test: any uncaught page exception or
 * `console.error` produced while a test runs fails that test with the captured
 * messages. This is how "the application does not crash" (E2E-12, E2E-13,
 * E2E-18) is verified continuously instead of test by test, while still
 * keeping each spec file focused on its scenario.
 */
export interface PageDiagnostics {
  /** Uncaught exceptions and console errors collected while the test ran. */
  readonly problems: readonly string[]
}

export const test = base.extend<{ diagnostics: PageDiagnostics }>({
  diagnostics: [
    async ({ page }, use) => {
      const problems: string[] = []
      page.on('pageerror', (error) => problems.push(`uncaught page error: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() === 'error') {
          problems.push(`console.error: ${message.text()}`)
        }
      })
      await use({ problems })
      expect(problems, 'the application reported no uncaught errors or console errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
