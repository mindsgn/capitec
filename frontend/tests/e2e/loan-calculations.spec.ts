import {
  BORROWERS,
  estimateFor,
  formatRand,
  MONEY_SHAPE,
  RULES,
} from './fixtures/financial-scenarios'
import { expect, test } from './fixtures/test'
import { COPY, LoanForm, RESULT_TEST_IDS } from './helpers/loan-form'

/**
 * E2E-11, E2E-12 and E2E-16: how amounts are parsed and how the figures behave
 * at the boundaries of the documented limits. Every expectation is recomputed
 * from the amortisation formula in `fixtures/financial-scenarios.ts`.
 */

const ORDINARY = BORROWERS.ordinary

test.describe('E2E-11: decimal and currency input', () => {
  test('parses both decimal separators correctly, preserves the typed text and never multiplies the value', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.fill({
      loanAmount: '150000.50',
      termMonths: 24,
      monthlyIncome: 'R18 000,50',
      monthlyExpenses: '10000',
      existingDebt: '1500',
    })

    // The editable text is preserved exactly as typed — no reformatting and
    // therefore no caret jumps — and the `R`/grouping prefix is accepted.
    await expect(form.amount).toHaveValue('150000.50')
    await expect(form.income).toHaveValue('R18 000,50')

    await form.submit()

    const borrower = { ...ORDINARY, monthlyIncome: 18_000.5 }
    const expected = estimateFor({ loanAmount: 150_000.5, termMonths: 24 }, borrower)
    await form.expectResults(expected)

    // A parsing fault (×100, truncation, double parsing) could not hide here:
    // fifty cents on the principal can only move the instalment by cents.
    const wholeRand = estimateFor({ loanAmount: 150_000, termMonths: 24 }, borrower)
    expect(Math.abs(expected.monthlyRepayment - wholeRand.monthlyRepayment)).toBeLessThan(1)
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveText(MONEY_SHAPE)

    // The same amount written with a comma parses to the same number.
    await form.amount.fill('150000,50')
    await expect(form.amount).toHaveValue('150000,50')
    await form.submit()
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveText(
      formatRand(expected.monthlyRepayment),
    )
    await expect(form.result(RESULT_TEST_IDS.remainingIncome)).toHaveText(
      formatRand(expected.remainingIncome),
    )
  })
})

test.describe('E2E-12: rapidly changing several fields', () => {
  test('renders only the final values of rapid edits, with no stale figures or stuck busy state', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    // Rapid edits with no waiting between them: typed principal, three slider
    // steps, a term change and three more amounts.
    await form.amount.fill('80000')
    await form.slider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await form.term.selectOption('36')
    await form.income.fill('25000')
    await form.expenses.fill('9000')
    await form.debt.fill('0')
    await form.amount.fill('90000')
    await form.slider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    // Two submits in quick succession — the calculation is synchronous, so the
    // result must simply reflect the final field values.
    await form.submitButton.click()
    await form.submitButton.click()

    const request = { loanAmount: 93_000, termMonths: 36 }
    const borrower = { ...ORDINARY, monthlyIncome: 25_000, monthlyExpenses: 9_000, existingDebt: 0 }
    const expected = estimateFor(request, borrower)
    await form.expectResults(expected)

    // Nothing from an earlier edit survives, in the form or in the results.
    await expect(form.amount).toHaveValue('93000')
    await expect(form.slider).toHaveValue('93000')
    await expect(form.term).toHaveValue('36')
    await expect(form.income).toHaveValue('25000')
    await expect(form.expenses).toHaveValue('9000')
    await expect(form.debt).toHaveValue('0')
    const slower = estimateFor({ loanAmount: 80_000, termMonths: 36 }, borrower)
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).not.toHaveText(
      formatRand(slower.monthlyRepayment),
    )

    // There is no asynchronous work, so nothing may be left disabled or busy.
    await expect(form.submitButton).toBeEnabled()
    await expect(form.submitButton).not.toHaveAttribute('aria-busy')
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
    await expect(form.errorSummary).toHaveCount(0)
  })
})

test.describe('E2E-16: mathematical edge cases', () => {
  test('smallest supported loan: minimum amount over the minimum term', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.calculate({
      loanAmount: String(RULES.loanAmount.min),
      termMonths: RULES.termMonths.min,
      monthlyIncome: '18000',
      monthlyExpenses: '10000',
      existingDebt: '1500',
    })

    const expected = estimateFor(
      { loanAmount: RULES.loanAmount.min, termMonths: RULES.termMonths.min },
      ORDINARY,
    )
    await form.expectResults(expected)
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveText(MONEY_SHAPE)

    // Positive-rate amortisation properties, derived from the formula.
    expect(expected.totalRepayment).toBeGreaterThan(RULES.loanAmount.min)
    expect(expected.monthlyRepayment).toBeGreaterThan(0)
    await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0)
  })

  test('largest supported loan: maximum amount over the maximum term', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.calculate({
      loanAmount: String(RULES.loanAmount.max),
      termMonths: RULES.termMonths.max,
      monthlyIncome: '45000',
      monthlyExpenses: '20000',
      existingDebt: '4000',
    })

    const expected = estimateFor(
      { loanAmount: RULES.loanAmount.max, termMonths: RULES.termMonths.max },
      BORROWERS.higherIncome,
    )
    await form.expectResults(expected)

    expect(expected.totalRepayment).toBeGreaterThan(RULES.loanAmount.max)
    expect(expected.totalBorrowingCost).toBeGreaterThan(0)
    await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0)
    await expect(form.emptyState).toHaveCount(0)
  })

  test('term extremes with a mid-range principal produce finite figures and correct properties', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    const base = {
      loanAmount: '150000',
      monthlyIncome: '45000',
      monthlyExpenses: '20000',
      existingDebt: '4000',
    } as const

    await form.calculate({ ...base, termMonths: RULES.termMonths.min })
    const shortest = estimateFor(
      { loanAmount: 150_000, termMonths: RULES.termMonths.min },
      BORROWERS.higherIncome,
    )
    await form.expectResults(shortest)

    await form.calculate({ ...base, termMonths: RULES.termMonths.max })
    const longest = estimateFor(
      { loanAmount: 150_000, termMonths: RULES.termMonths.max },
      BORROWERS.higherIncome,
    )
    await form.expectResults(longest)

    // At a positive rate: shorter term ⇒ higher instalment, lower total cost.
    expect(shortest.monthlyRepayment).toBeGreaterThan(longest.monthlyRepayment)
    expect(shortest.totalBorrowingCost).toBeLessThan(longest.totalBorrowingCost)
    await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0)
  })

  test('an unsupported amount above the maximum is rejected, not clamped', async ({ page }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.calculate({
      loanAmount: '999999999',
      termMonths: 24,
      monthlyIncome: '45000',
      monthlyExpenses: '20000',
      existingDebt: '4000',
    })

    await expect(form.errorSummary).toContainText('Loan amount must be between R 5 000 and R 300 000.')
    // The field keeps the rejected value: nothing is silently calculated from a
    // different amount than the user asked for.
    await expect(form.amount).toHaveValue('999999999')
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0)
  })

  test('the interest rate is the fixed illustrative rate, so a zero rate is not reachable', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    // The zero-rate fallback in `loan.ts` is covered by unit tests only; the
    // interface fixes the rate, which this asserts rather than assumes.
    await expect(form.form).toContainText(COPY.rateNote)
    await expect(form.form).toContainText(`12.5% per year`)
    await expect(page.getByText(/0% per year/)).toHaveCount(0)

    // And the fixed rate is what the results are calculated with.
    await form.calculate({
      loanAmount: '100000',
      termMonths: 24,
      monthlyIncome: '18000',
      monthlyExpenses: '10000',
      existingDebt: '1500',
    })
    await form.expectResults(estimateFor({ loanAmount: 100_000, termMonths: 24 }, ORDINARY))
  })
})
