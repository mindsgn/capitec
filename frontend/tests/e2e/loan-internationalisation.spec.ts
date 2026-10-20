import { BORROWERS, estimateFor, formatRand } from './fixtures/financial-scenarios'
import { expect, test } from './fixtures/test'
import { LoanForm, RESULT_TEST_IDS } from './helpers/loan-form'

/**
 * E2E-17: language switching and internationalisation.
 *
 * Status recorded in `docs/e2e-test-plan.md`: only the English bundle ships and
 * the interface has no language selector, so the switching behaviour in the
 * specification cannot be exercised. These tests assert the English baseline
 * that does exist and document the missing capability rather than faking it.
 */

const VALID_INPUTS = {
  loanAmount: '100000',
  termMonths: 24,
  monthlyIncome: '18000',
  monthlyExpenses: '10000',
  existingDebt: '1500',
} as const

test.describe('E2E-17: English baseline and internationalisation readiness', () => {
  test('declares its language and renders fully translated copy with no raw keys', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    // The document language is what screen readers and translation tools read.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveTitle('Loan eligibility simulator')
    await expect(form.heading).toBeVisible()

    // No unresolved interpolation or raw namespace keys leak into the UI.
    await expect(page.getByText(/\{\{|\}\}/)).toHaveCount(0)
    await expect(
      page.getByText(/\b(common|navigation|loan|income|expenses|results|validation|accessibility|help):/),
    ).toHaveCount(0)

    // No language selector exists yet, so multi-language switching is blocked
    // (it is not claimed to work). This documents the gap.
    await expect(page.getByRole('combobox', { name: /language/i })).toHaveCount(0)
  })

  test('formats money as en-ZA rand in results, announcements and validation messages', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    const expected = estimateFor({ loanAmount: 100_000, termMonths: 24 }, BORROWERS.ordinary)
    await form.calculate(VALID_INPUTS)

    // Results and the live announcement use the same en-ZA / ZAR formatting.
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveText(
      formatRand(expected.monthlyRepayment),
    )
    await expect(form.result(RESULT_TEST_IDS.totalRepayment)).toHaveText(
      formatRand(expected.totalRepayment),
    )
    await expect(form.announcement).toContainText(formatRand(expected.monthlyRepayment, false))

    // Validation copy quotes limits the same way — grouping spaces, whole rand
    // for the bounds — and is presented in English.
    await form.amount.fill('400000')
    await form.submit()
    await expect(form.errorSummary).toContainText('Loan amount must be between R 5 000 and R 300 000.')
    await expect(form.amount).toHaveAccessibleDescription(
      /Loan amount must be between R\s5\s000 and R\s300\s000\./,
    )
  })
})
