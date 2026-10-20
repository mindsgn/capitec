import type { Page } from '@playwright/test'

import { BORROWERS, estimateFor, formatRand } from './fixtures/financial-scenarios'
import { expect, test } from './fixtures/test'
import { LoanForm, RESULT_TEST_IDS } from './helpers/loan-form'

/**
 * E2E-04…10: input validation and affordability handling.
 *
 * Rules come from `src/lib/validation.ts` and `LOAN_SIMULATOR_LIMITS`
 * (amount 5 000–300 000, term 6–60, income minimum 5 000, expenses/debt ≥ 0);
 * affordability comes from the calculation layer. Numeric validation and the
 * affordability verdict are deliberately asserted as separate concerns.
 */

const VALID_INPUTS = {
  loanAmount: '100000',
  termMonths: 24,
  monthlyIncome: '18000',
  monthlyExpenses: '10000',
  existingDebt: '1500',
} as const

/** No `NaN`/`Infinity` may ever reach the screen (E2E-07, E2E-10). */
function noNonFiniteFigures(page: Page) {
  return expect(page.getByText(/NaN|Infinity/)).toHaveCount(0)
}

test.describe('E2E-04: zero monthly income', () => {
  test('treats zero as numerically valid but below the product minimum, without crashing or approving', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    // `BORROWERS.noIncome` — income R0, no expenses, no debt.
    await form.fill({
      loanAmount: '100000',
      termMonths: 24,
      monthlyIncome: '0',
      monthlyExpenses: '0',
      existingDebt: '0',
    })

    // Zero is not silently rewritten: the field keeps exactly what was typed,
    // and parsing it is fine — the schema minimum (R 5 000) is what rejects it.
    await expect(form.income).toHaveValue('0')
    await form.submit()
    await expect(form.income).toHaveValue('0')

    await expect(form.errorSummary).toBeVisible()
    await expect(form.errorSummary).toContainText('Minimum monthly income of R 5 000 required.')
    await expect(form.income).toHaveAttribute('aria-invalid', 'true')
    await expect(form.income).toHaveAccessibleDescription(
      /Minimum monthly income of R\s5\s000 required\./,
    )

    // A failed submit clears any previous estimate, so nothing misleading —
    // approval, affordability or a repayment figure — is on screen.
    await expect(form.emptyState).toBeVisible()
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.successNotice).toHaveCount(0)
    await expect(form.warningNotice).toHaveCount(0)
    await noNonFiniteFigures(page)

    // The application stays usable: correcting the value recalculates normally.
    await form.income.fill('18000')
    await form.expenses.fill('10000')
    await form.debt.fill('1500')
    await form.submit()
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.income).not.toHaveAttribute('aria-invalid')
    await form.expectResults(
      estimateFor({ loanAmount: 100_000, termMonths: 24 }, BORROWERS.ordinary),
    )
  })
})

test.describe('E2E-05: negative monthly income', () => {
  test('rejects keyboard-entered negative income, explains the fix and recovers after correction', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.fill({
      loanAmount: '100000',
      termMonths: 24,
      monthlyExpenses: '10000',
      existingDebt: '1500',
    })

    // Typed with the keyboard (minus sign first), as a real user would.
    await form.income.focus()
    await page.keyboard.type('-5000')

    // While typing: the field is already marked invalid with a message that
    // explains how to enter a value (the component-level parse message).
    await expect(form.income).toHaveValue('-5000')
    await expect(form.income).toHaveAttribute('aria-invalid', 'true')
    await expect(form.income).toHaveAccessibleDescription(
      /Enter a valid rand amount, for example 150000 or 150000,50\./,
    )

    // On submit: the schema message names the field and the correction.
    await form.submit()
    await expect(form.errorSummary).toBeVisible()
    await expect(form.errorSummary).toContainText('Monthly income cannot be negative.')
    await expect(form.income).toHaveAccessibleDescription(/Monthly income cannot be negative\./)

    // Invalid data never produces a figure.
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.successNotice).toHaveCount(0)
    await expect(form.warningNotice).toHaveCount(0)
    await noNonFiniteFigures(page)

    // The field stays editable and the application usable.
    await form.income.fill('18000')
    await form.submit()
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.income).not.toHaveAttribute('aria-invalid')
    await form.expectResults(
      estimateFor({ loanAmount: 100_000, termMonths: 24 }, BORROWERS.ordinary),
    )
  })
})

test.describe('E2E-06: expenses exceed income', () => {
  test('shows an accessible shortfall warning for a negative disposable income without implying approval', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    // Specification example: income R12 000, expenses R14 000, debt R0.
    const borrower = BORROWERS.expensesExceedIncome
    const request = { loanAmount: 150_000, termMonths: 24 }
    await form.calculate({
      loanAmount: '150000',
      termMonths: 24,
      monthlyIncome: '12000',
      monthlyExpenses: '14000',
      existingDebt: '0',
    })

    // The values are numerically valid, so they are accepted as entered…
    await expect(form.income).toHaveValue('12000')
    await expect(form.expenses).toHaveValue('14000')
    await expect(form.debt).toHaveValue('0')
    await expect(form.errorSummary).toHaveCount(0)

    // …and disposable income (income − expenses − debt − instalment) is negative.
    const expected = estimateFor(request, borrower)
    expect(expected.remainingIncome).toBeLessThan(0)
    await form.expectResults(expected)

    // The warning is shown through an alert region with a heading, and quotes
    // the monthly shortfall.
    await expect(form.warningNotice).toBeVisible()
    await expect(form.warningNotice).toContainText('leaves you short by')
    await expect(form.warningNotice).toContainText(formatRand(Math.abs(expected.remainingIncome)))
    // Not colour-only: the hidden "Warning:" cue is part of the announced text.
    await expect(form.warningNotice).toContainText('Warning:')

    // Never presented as guaranteed approval: no success notice, the standing
    // disclaimer stays visible, and no approval language appears anywhere.
    await expect(form.successNotice).toHaveCount(0)
    await expect(form.disclaimer).toBeVisible()
    await expect(form.disclaimer).toContainText('not a loan approval or a credit decision')
    await expect(page.getByText(/guaranteed/i)).toHaveCount(0)

    // The form remains fully usable after the warning.
    await expect(form.amount).toHaveValue('150000')
    await expect(form.submitButton).toBeEnabled()
  })
})

test.describe('E2E-07: zero loan amount', () => {
  test('rejects zero through the documented range rule and renders no invalid mathematics', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.calculate({
      loanAmount: '0',
      termMonths: 24,
      monthlyIncome: '18000',
      monthlyExpenses: '10000',
      existingDebt: '1500',
    })

    // Documented rule: the amount must fall within R 5 000 – R 300 000.
    await expect(form.errorSummary).toBeVisible()
    await expect(form.errorSummary).toContainText('Loan amount must be between R 5 000 and R 300 000.')
    await expect(form.amount).toHaveAttribute('aria-invalid', 'true')
    await expect(form.amount).toHaveAccessibleDescription(
      /Loan amount must be between R\s5\s000 and R\s300\s000\./,
    )

    // No result of any kind is rendered: no figures, no NaN/Infinity.
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.emptyState).toBeVisible()
    await noNonFiniteFigures(page)

    // The value is user-correctable and the calculation recovers.
    await form.amount.fill('5000')
    await form.submit()
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.amount).not.toHaveAttribute('aria-invalid')
    await form.expectResults(
      estimateFor({ loanAmount: 5_000, termMonths: 24 }, BORROWERS.ordinary),
    )
  })
})

test.describe('E2E-08: above the permitted maximum', () => {
  test('enforces the documented maximum instead of silently capping and calculating', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.fill({
      loanAmount: '400000',
      termMonths: 24,
      monthlyIncome: '18000',
      monthlyExpenses: '10000',
      existingDebt: '1500',
    })
    await form.submit()

    // The message quotes both configured bounds — the maximum is the product's
    // documented personal-loan ceiling (LOAN_SIMULATOR_LIMITS / API spec).
    await expect(form.errorSummary).toContainText('Loan amount must be between R 5 000 and R 300 000.')
    await expect(form.amount).toHaveAccessibleDescription(
      /Loan amount must be between R\s5\s000 and R\s300\s000\./,
    )

    // Nothing was clamped behind the user's back and no figure was produced.
    await expect(form.amount).toHaveValue('400000')
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.emptyState).toBeVisible()

    // The maximum itself is accepted and calculated exactly.
    await form.amount.fill('300000')
    await form.submit()
    await expect(form.errorSummary).toHaveCount(0)
    await form.expectResults(
      estimateFor({ loanAmount: 300_000, termMonths: 24 }, BORROWERS.ordinary),
    )
  })
})

test.describe('E2E-09: required fields are empty', () => {
  test('pristine submit: reports exactly the missing fields, focuses the summary and links each message', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.submit()

    // Term defaults to 24 months and existing debt is optional, so exactly
    // three fields are reported as missing.
    await expect(form.errorSummary).toBeVisible()
    await expect(form.errorSummary).toBeFocused()
    await expect(form.errorSummary.getByRole('link')).toHaveCount(3)
    await expect(form.errorSummary).toContainText('Enter loan amount.')
    await expect(form.errorSummary).toContainText('Enter monthly income.')
    await expect(form.errorSummary).toContainText('Enter monthly expenses.')
    await expect(form.errorSummary).not.toContainText('Select repayment term.')

    // Each message is associated with its control: aria-invalid + a resolvable
    // accessible description pointing at the visible text.
    await expect(form.amount).toHaveAttribute('aria-invalid', 'true')
    await expect(form.amount).toHaveAccessibleDescription(/Enter loan amount\./)
    await expect(form.income).toHaveAttribute('aria-invalid', 'true')
    await expect(form.income).toHaveAccessibleDescription(/Enter monthly income\./)
    await expect(form.expenses).toHaveAttribute('aria-invalid', 'true')
    await expect(form.expenses).toHaveAccessibleDescription(/Enter monthly expenses\./)
    await expect(form.invalidControls).toHaveCount(3)

    // The default term and the optional field are untouched by validation.
    await expect(form.term).not.toHaveAttribute('aria-invalid')
    await expect(form.debt).not.toHaveAttribute('aria-invalid')

    // An invalid submit never shows a result.
    await expect(form.emptyState).toBeVisible()
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)

    // Following a summary link moves focus to the field it describes.
    await form.errorSummary
      .getByRole('link')
      .filter({ hasText: 'Enter monthly expenses.' })
      .click()
    await expect(form.expenses).toBeFocused()

    // Completing the form clears the summary and calculates.
    await form.calculate(VALID_INPUTS)
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.invalidControls).toHaveCount(0)
    await form.expectResults(
      estimateFor({ loanAmount: 100_000, termMonths: 24 }, BORROWERS.ordinary),
    )
  })

  test('partially completed submit: reports only the fields that are still missing', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    await form.amount.fill('100000')
    await form.submit()

    await expect(form.errorSummary).toBeVisible()
    await expect(form.errorSummary.getByRole('link')).toHaveCount(2)
    await expect(form.errorSummary).toContainText('Enter monthly income.')
    await expect(form.errorSummary).toContainText('Enter monthly expenses.')
    // The completed field is not reported again.
    await expect(form.errorSummary).not.toContainText('Enter loan amount.')
    await expect(form.amount).not.toHaveAttribute('aria-invalid')
    await expect(form.emptyState).toBeVisible()
  })
})

test.describe('E2E-10: invalid text in numeric fields', () => {
  test('rejects unparseable and malformed input, never treats it as zero, and recovers', async ({
    page,
  }) => {
    const form = new LoanForm(page)
    await form.goto()

    // Plain letters: flagged immediately by the currency input.
    await form.income.focus()
    await page.keyboard.type('abc')
    await expect(form.income).toHaveValue('abc')
    await expect(form.income).toHaveAttribute('aria-invalid', 'true')
    await expect(form.income).toHaveAccessibleDescription(
      /Enter a valid rand amount, for example 150000 or 150000,50\./,
    )

    // Malformed grouping is rejected rather than guessed at.
    await form.amount.fill('1,2,3,4')
    await expect(form.amount).toHaveAttribute('aria-invalid', 'true')

    await form.fill({ termMonths: 24, monthlyExpenses: '10000', existingDebt: '1500' })
    await form.submit()

    // The schema messages replace the component messages after a submit, and
    // no result is produced from values that were never parsed as numbers.
    await expect(form.errorSummary).toBeVisible()
    await expect(form.errorSummary).toContainText('Enter a valid monthly income.')
    await expect(form.errorSummary).toContainText('Enter a valid loan amount.')
    await expect(form.result(RESULT_TEST_IDS.monthlyInstalment)).toHaveCount(0)
    await expect(form.successNotice).toHaveCount(0)
    await expect(form.warningNotice).toHaveCount(0)
    await noNonFiniteFigures(page)

    // Overwriting the bad values clears the errors and calculates normally.
    await form.amount.fill('100000')
    await form.income.fill('18000')
    await form.submit()
    await expect(form.errorSummary).toHaveCount(0)
    await expect(form.invalidControls).toHaveCount(0)
    await form.expectResults(
      estimateFor({ loanAmount: 100_000, termMonths: 24 }, BORROWERS.ordinary),
    )
  })
})
