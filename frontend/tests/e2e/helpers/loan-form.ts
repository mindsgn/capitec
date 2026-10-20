import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

import type { EstimateExpectation } from '../fixtures/financial-scenarios'
import { formatRand } from '../fixtures/financial-scenarios'

/**
 * Accessible names and stable hooks, copied from the English resources in
 * `src/i18n/locales/en` rather than guessed. Name queries use `exact: true`
 * because Playwright's role/label matching is otherwise a case-insensitive
 * substring match ("Your estimate" would also match the help heading
 * "How your estimate is worked out", "Loan amount" also matches the slider's
 * "Adjust the loan amount").
 */
export const COPY = {
  heading: 'Loan eligibility simulator',
  formRegion: 'Your details',
  resultsRegion: 'Your estimate',
  helpRegion: 'How your estimate is worked out',
  amount: 'Loan amount',
  slider: 'Adjust the loan amount',
  term: 'Repayment term',
  income: 'Monthly income',
  expenses: 'Monthly expenses',
  debt: 'Existing monthly debt',
  submit: 'Update estimate',
  reset: 'Reset',
  resetDialogTitle: 'Reset the form?',
  dialogCancel: 'Keep my details',
  dialogConfirm: 'Reset form',
  errorSummary: 'Please correct the following errors',
  emptyTitle: 'No estimate yet',
  successHeading: 'This repayment looks manageable',
  warningHeading: 'This repayment may not be affordable',
  disclaimerHeading: 'Illustrative estimate only',
  skipLink: 'Skip to main content',
  interestTooltip: 'What the interest rate means',
  helpSummary: 'What affects the estimate',
  amountHint: 'Choose an amount between R 5 000 and R 300 000.',
  rateNote: 'Uses a fixed illustrative interest rate of 12.5% per year.',
} as const

/** `data-testid` values on the four result figures in `LoanSimulator.tsx`. */
export const RESULT_TEST_IDS = {
  monthlyInstalment: 'result-monthly-instalment',
  borrowingCost: 'result-borrowing-cost',
  totalRepayment: 'result-total-repayment',
  remainingIncome: 'result-remaining-income',
} as const

export interface LoanFormValues {
  loanAmount?: string
  termMonths?: number
  monthlyIncome?: string
  monthlyExpenses?: string
  existingDebt?: string
}

/** Every field of the simulator form, i.e. what a complete submission needs. */
export type CompleteLoanFormValues = Required<LoanFormValues>

/**
 * Page object for the loan simulator: accessible locators, the fill →
 * submit interaction model and the assertions the scenarios repeat.
 * Business expectations always come from `financial-scenarios.ts`.
 */
export class LoanForm {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // --- locators -----------------------------------------------------------
  get heading(): Locator {
    return this.page.getByRole('heading', { name: COPY.heading, exact: true })
  }

  get form(): Locator {
    return this.page.getByRole('region', { name: COPY.formRegion, exact: true })
  }

  get results(): Locator {
    return this.page.getByRole('region', { name: COPY.resultsRegion, exact: true })
  }

  get help(): Locator {
    return this.page.getByRole('region', { name: COPY.helpRegion, exact: true })
  }

  get amount(): Locator {
    return this.page.getByLabel(COPY.amount, { exact: true })
  }

  get slider(): Locator {
    return this.page.getByRole('slider', { name: COPY.slider, exact: true })
  }

  get term(): Locator {
    return this.page.getByLabel(COPY.term, { exact: true })
  }

  get income(): Locator {
    return this.page.getByLabel(COPY.income, { exact: true })
  }

  get expenses(): Locator {
    return this.page.getByLabel(COPY.expenses, { exact: true })
  }

  get debt(): Locator {
    // The optional marker is a sibling span with no separating whitespace, so
    // the label's text is "Existing monthly debt(optional)" while the computed
    // accessible name inserts a space. Match the label by prefix.
    return this.page.getByLabel(/^Existing monthly debt/)
  }

  /**
   * The help disclosure. `<summary>` is not exposed with a button role, so the
   * semantic element is used rather than a class or DOM-path selector.
   */
  get helpSummary(): Locator {
    return this.page.locator('summary')
  }

  get interestTooltip(): Locator {
    return this.page.getByRole('button', { name: COPY.interestTooltip, exact: true })
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: COPY.submit, exact: true })
  }

  get resetButton(): Locator {
    return this.page.getByRole('button', { name: COPY.reset, exact: true })
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert', { name: COPY.errorSummary, exact: true })
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: COPY.emptyTitle, exact: true })
  }

  get successNotice(): Locator {
    return this.page.getByRole('status', { name: COPY.successHeading, exact: true })
  }

  get warningNotice(): Locator {
    return this.page.getByRole('alert', { name: COPY.warningHeading, exact: true })
  }

  get disclaimer(): Locator {
    return this.page.getByRole('note', { name: COPY.disclaimerHeading, exact: true })
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog', { name: COPY.resetDialogTitle, exact: true })
  }

  get skipLink(): Locator {
    return this.page.getByRole('link', { name: COPY.skipLink, exact: true })
  }

  /** The single polite live region on the page (the estimate announcement). */
  get announcement(): Locator {
    return this.page.locator('[aria-live="polite"]')
  }

  get invalidControls(): Locator {
    return this.page.locator('[aria-invalid="true"]')
  }

  result(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  // --- actions ------------------------------------------------------------
  async goto(): Promise<void> {
    await this.page.goto('/')
    await expect(this.heading).toBeVisible()
  }

  /** Fills only the provided fields, in a stable order. */
  async fill(values: LoanFormValues): Promise<void> {
    if (values.loanAmount !== undefined) await this.amount.fill(values.loanAmount)
    if (values.termMonths !== undefined) await this.term.selectOption(String(values.termMonths))
    if (values.monthlyIncome !== undefined) await this.income.fill(values.monthlyIncome)
    if (values.monthlyExpenses !== undefined) await this.expenses.fill(values.monthlyExpenses)
    if (values.existingDebt !== undefined) await this.debt.fill(values.existingDebt)
  }

  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  /** Fills the whole form and calculates an estimate in one step. */
  async calculate(values: CompleteLoanFormValues): Promise<void> {
    await this.fill(values)
    await this.submit()
  }

  /** Opens the reset confirmation with keyboard activation (focus + Enter). */
  async openResetDialog(): Promise<void> {
    await this.resetButton.focus()
    await this.page.keyboard.press('Enter')
    await expect(this.dialog).toBeVisible()
  }

  // --- assertions ---------------------------------------------------------
  /** A displayed figure equals the independently computed and formatted value. */
  async expectMoney(locator: Locator, expected: number, cents = true): Promise<void> {
    await expect(locator).toHaveText(formatRand(expected, cents))
  }

  /** All four result figures match the maths for the submitted values. */
  async expectResults(expected: EstimateExpectation): Promise<void> {
    await expect(this.results).toBeVisible()
    await expect(this.emptyState).toHaveCount(0)
    await this.expectMoney(this.result(RESULT_TEST_IDS.monthlyInstalment), expected.monthlyRepayment)
    await this.expectMoney(this.result(RESULT_TEST_IDS.borrowingCost), expected.totalBorrowingCost)
    await this.expectMoney(this.result(RESULT_TEST_IDS.totalRepayment), expected.totalRepayment)
    await this.expectMoney(this.result(RESULT_TEST_IDS.remainingIncome), expected.remainingIncome)
  }
}
