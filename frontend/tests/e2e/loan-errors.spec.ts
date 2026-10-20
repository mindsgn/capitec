import { BORROWERS, estimateFor } from './fixtures/financial-scenarios'
import { expect, test } from './fixtures/test'
import { COPY, LoanForm, RESULT_TEST_IDS } from './helpers/loan-form'

/**
 * E2E-18: error handling and resilience.
 *
 * The simulator is entirely client-side: it makes no API calls, has no loading
 * state and no error boundary, so the specification's network-failure and
 * outage cases cannot be simulated meaningfully. Those parts are recorded as
 * not applicable in `docs/e2e-test-plan.md`. What is verified here is what the
 * application genuinely does: it fails closed into a validation state, never
 * shows a stale or non-finite figure, exposes no internal details, keeps every
 * interaction recoverable, and performs no background requests.
 *
 * "The application does not crash" is covered continuously: the diagnostics
 * fixture in `fixtures/test.ts` fails any test in which the page raises an
 * uncaught exception or logs a console error.
 */

const VALID_INPUTS = {
  loanAmount: '100000',
  termMonths: 24,
  monthlyIncome: '18000',
  monthlyExpenses: '10000',
  existingDebt: '1500',
} as const

const ORDINARY_EXPECTATION = estimateFor({ loanAmount: 100_000, termMonths: 24 }, BORROWERS.ordinary)

test.describe('E2E-18: error handling without API dependencies', () => {
  test('a failed submit clears the previous estimate and the form recovers', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    // Start from a good estimate…
    await form.calculate(VALID_INPUTS)
    await form.expectResults(ORDINARY_EXPECTATION)

    // …then remove a required value and submit. The previous figure must not
    // linger as though it were still current.
    await form.income.fill('')
    await form.submit()
    await expect(form.errorSummary).toBeVisible()
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.emptyState).toBeVisible()

    // Unparseable text fails closed in exactly the same way.
    await form.amount.fill('abc')
    await form.income.fill('abc')
    await form.submit()
    await expect(form.errorSummary).toBeVisible()
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.emptyState).toBeVisible()
    await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0)

    // Nothing internal leaks into the interface: no exception names, no stack
    // traces, no raw message keys.
    await expect(
      page.getByText(/ReferenceError|TypeError|SyntaxError|at http:\/\/localhost/),
    ).toHaveCount(0)
    await expect(page.getByText(/\{\{|\}\}/)).toHaveCount(0)

    // The failure is recoverable without a reload.
    await form.calculate(VALID_INPUTS)
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.invalidControls).toHaveCount(0)
    await form.expectResults(ORDINARY_EXPECTATION)
  })

  test('a full journey makes no API, external or background requests and leaves no busy state', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))

    // Exercise every kind of interaction the page offers.
    await form.goto()
    await form.calculate(VALID_INPUTS)
    await form.expectResults(ORDINARY_EXPECTATION)
    await form.helpSummary.click()
    await form.openResetDialog()
    await form.dialog.getByRole('button', { name: COPY.dialogCancel, exact: true }).click()
    await expect(form.dialog).not.toBeVisible()

    // The page did load its own assets…
    const origin = new URL(page.url()).origin
    const httpRequests = requests.filter((url) => /^https?:/.test(url))
    expect(httpRequests.length, 'the page should request its own assets').toBeGreaterThan(0)

    // …but nothing from another origin and nothing that looks like an API call.
    expect(
      httpRequests.filter((url) => !url.startsWith(origin)),
      'no external requests',
    ).toEqual([])
    expect(
      httpRequests.filter((url) => /\/api\//.test(url)),
      'no API requests',
    ).toEqual([])

    // There is no asynchronous work, so no busy or loading state may be left.
    await expect(form.submitButton).toBeEnabled()
    await expect(form.submitButton).not.toHaveAttribute('aria-busy')
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await expect(page.getByText('Loading', { exact: true })).toHaveCount(0)
  })
})
