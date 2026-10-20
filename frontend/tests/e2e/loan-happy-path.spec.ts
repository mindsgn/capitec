import { BORROWERS, estimateFor, formatRand, MONEY_SHAPE } from './fixtures/financial-scenarios'
import { expect, test } from './fixtures/test'
import { COPY, LoanForm, RESULT_TEST_IDS } from './helpers/loan-form'

/**
 * E2E-01…03: the ordinary user journey — calculate an estimate, then change
 * one input at a time and confirm the results follow the calculation model
 * (results only change on "Update estimate") without disturbing other fields.
 */

const ORDINARY_INPUTS = {
  loanAmount: '100000',
  termMonths: 24,
  monthlyIncome: '18000',
  monthlyExpenses: '10000',
  existingDebt: '1500',
} as const

test.describe('E2E-01: valid financial inputs', () => {
  test('accepts every valid value and shows a correctly calculated, correctly formatted estimate', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    const borrower = BORROWERS.ordinary
    const request = { loanAmount: 100_000, termMonths: 24 }

    await form.calculate(ORDINARY_INPUTS)

    // Expected state: the empty state is replaced by the results region and
    // all four figures match an independent calculation of the same rules.
    const expected = estimateFor(request, borrower)
    await form.expectResults(expected)

    // Currency formatting: en-ZA rand — space grouping, comma cents, `-` for
    // negative figures (the shape check is structural, the value check exact).
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveText(MONEY_SHAPE)
    await expect(form.result(RESULT_TEST_IDS.totalRepayment)).toHaveText(MONEY_SHAPE)
    await expect(form.result(RESULT_TEST_IDS.remainingIncome)).toHaveText(MONEY_SHAPE)

    // The entered scenario is affordable (income − expenses − debt > instalment),
    // so the non-urgent success notice — not the warning — is shown.
    expect(expected.remainingIncome).toBeGreaterThan(0)
    await expect(form.successNotice).toBeVisible()
    await expect(form.successNotice).toContainText(formatRand(expected.remainingIncome))
    await expect(form.warningNotice).toHaveCount(0)

    // The polite live region announces the same estimate concisely.
    await expect(form.announcement).toContainText(
      `Estimated monthly instalment ${formatRand(expected.monthlyRepayment, false)}`,
    )
    await expect(form.announcement).toContainText('for a 24 month term')
    await expect(form.announcement).toContainText(
      `Total repayment ${formatRand(expected.totalRepayment, false)}`,
    )

    // No unexpected validation errors, no invalid fields, no uncaught errors
    // (the diagnostics fixture fails the test on pageerror/console.error).
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.invalidControls).toHaveCount(0)
    await expect(page).toHaveTitle(COPY.heading)
  })
})

test.describe('E2E-02: changing the loan amount', () => {
  test('recalculates from the new principal and leaves every other field untouched', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()
    const borrower = BORROWERS.ordinary

    const first = { loanAmount: 100_000, termMonths: 24 }
    await form.calculate(ORDINARY_INPUTS)
    const firstEstimate = estimateFor(first, borrower)
    await form.expectResults(firstEstimate)

    // Change only the principal and recalculate explicitly — the application's
    // interaction model updates results on submit, never while typing.
    const second = { loanAmount: 120_000, termMonths: 24 }
    await form.amount.fill('120000')
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveText(
      formatRand(firstEstimate.monthlyRepayment),
    )
    await form.submit()

    const secondEstimate = estimateFor(second, borrower)
    await form.expectResults(secondEstimate)

    // No stale figure from the previous calculation survives.
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).not.toHaveText(
      formatRand(firstEstimate.monthlyRepayment),
    )

    // Unrelated fields keep their values, and the slider follows the input.
    await expect(form.amount).toHaveValue('120000')
    await expect(form.term).toHaveValue('24')
    await expect(form.income).toHaveValue('18000')
    await expect(form.expenses).toHaveValue('10000')
    await expect(form.debt).toHaveValue('1500')
    await expect(form.slider).toHaveValue('120000')
    await expect(form.slider).toHaveAttribute('aria-valuetext', /120[^\d]000/)
    await expect(form.errorSummary).toHaveCount(0)
  })
})

test.describe('E2E-03: changing the repayment term', () => {
  test('recalculates over the selected term and keeps the rest of the form intact', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()
    const borrower = BORROWERS.ordinary

    const base = { loanAmount: 100_000, termMonths: 24 }
    await form.calculate(ORDINARY_INPUTS)
    const baseEstimate = estimateFor(base, borrower)
    await form.expectResults(baseEstimate)

    // The select only offers 6/12/24/36/48/60 months (see the plan §2).
    await form.term.selectOption('48')
    await expect(form.term).toHaveValue('48')
    await form.submit()

    const longer = { loanAmount: 100_000, termMonths: 48 }
    const longerEstimate = estimateFor(longer, borrower)
    await form.expectResults(longerEstimate)

    // The chosen term is reflected beyond the select itself.
    await expect(form.announcement).toContainText('for a 48 month term')

    // Longer terms cost more overall but less per month at a positive rate —
    // properties of the amortisation formula, not invented expectations.
    expect(longerEstimate.totalBorrowingCost).toBeGreaterThan(baseEstimate.totalBorrowingCost)
    expect(longerEstimate.monthlyRepayment).toBeLessThan(baseEstimate.monthlyRepayment)

    // Nothing else was corrupted by the change.
    await expect(form.amount).toHaveValue('100000')
    await expect(form.income).toHaveValue('18000')
    await expect(form.expenses).toHaveValue('10000')
    await expect(form.debt).toHaveValue('1500')
    await expect(form.slider).toHaveValue('100000')
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.result(RESULT_TEST_IDS.totalRepayment)).not.toHaveText(
      formatRand(baseEstimate.totalRepayment),
    )
  })
})
